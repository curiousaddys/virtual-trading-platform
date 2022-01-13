import { getMongoDB } from './client'
import { ObjectId } from 'mongodb'
import { INITIAL_PORTFOLIO_FUND_AMOUNT } from '../utils/constants'

export interface Portfolio {
  _id: ObjectId
  accountID: ObjectId
  name: string
  created: Date
  holdings: Holding[]
}

export interface Holding {
  currency: string
  amount: number
  avgBuyCost: number
}

const getPortfoliosCollection = async () => {
  const { client, db } = await getMongoDB()
  const collection = db.collection<Portfolio>('portfolios')
  await collection.createIndex({ accountID: 1 })
  return { client, collection }
}

export const findOrInsertPortfolio = async (
  _id: ObjectId,
  accountID: ObjectId,
  portfolioName: string = 'Untitled Portfolio'
) => {
  const { collection } = await getPortfoliosCollection()
  const result = await collection.findOneAndUpdate(
    { _id, accountID },
    {
      $setOnInsert: {
        name: portfolioName,
        created: new Date(),
        holdings: [
          {
            currency: 'USD',
            amount: INITIAL_PORTFOLIO_FUND_AMOUNT,
            avgBuyCost: 0,
          },
        ],
      },
    },
    { upsert: true, returnDocument: 'after' }
  )
  if (!result.value) {
    throw 'failed to find or insert portfolio'
  }
  return result.value
}

export const updatePortfolioName = async (
  _id: ObjectId,
  accountID: ObjectId,
  portfolioName: string
) => {
  const { collection } = await getPortfoliosCollection()
  const result = await collection.findOneAndUpdate(
    { _id, accountID },
    {
      $set: {
        name: portfolioName,
      },
    },
    { upsert: true, returnDocument: 'after' }
  )
  if (!result.value) {
    throw 'failed to update portfolio name'
  }
  return result.value
}

export const findAllPortfolios = async (): Promise<Portfolio[]> => {
  const { client, collection } = await getPortfoliosCollection()
  const session = client.startSession()
  const portfolios = await collection.find({}, { session }).toArray()
  await session.endSession()
  return portfolios
}

export const findPortfoliosByAccount = async (accountID: ObjectId): Promise<Portfolio[]> => {
  const { collection } = await getPortfoliosCollection()
  return await collection.find({ accountID }).toArray()
}

export const findPortfolioByID = async (accountID: ObjectId, _id: ObjectId): Promise<Portfolio> => {
  const { collection } = await getPortfoliosCollection()
  const portfolio = await collection.findOne({
    // TODO: figure out why this doesn't work if you just use the ObjectId that is passed in (or maybe just pass it in as a string to simplify)
    accountID: new ObjectId(accountID.toString()),
    _id: new ObjectId(_id.toString()),
  })
  if (!portfolio) {
    throw 'portfolio not found'
  }
  return portfolio
}

export const updatePortfolioBalance = async (
  accountID: ObjectId,
  portfolio: Portfolio,
  currency: string,
  amount: number,
  costUSD: number
) => {
  const { collection } = await getPortfoliosCollection()

  const action = amount < 0 ? 'selling' : 'buying'
  const holding = portfolio.holdings.find((holding) => holding.currency === currency)
  const balance = holding?.amount
  const avgBuyCost =
    action === 'selling'
      ? holding?.avgBuyCost ?? 0
      : !balance
      ? costUSD / amount
      : (costUSD / amount) * (amount / (balance + amount)) +
        holding.avgBuyCost * (balance / (balance + amount))

  if (balance === undefined) {
    // $push new holding object with 0 amount
    await collection.findOneAndUpdate(
      { _id: portfolio._id, accountID: new ObjectId(accountID.toString()) },
      {
        $push: {
          holdings: {
            currency: currency,
            amount: 0,
            avgBuyCost: 0,
          },
        },
      }
    )
  }

  // now that all the objects exist for sure, we can just use $inc
  const results = await collection.findOneAndUpdate(
    { _id: portfolio._id, accountID: new ObjectId(accountID.toString()) },
    {
      $inc: {
        'holdings.$[coin].amount': amount,
        'holdings.$[cost].amount': -costUSD,
      },
      $set: {
        'holdings.$[coin].avgBuyCost': avgBuyCost,
      },
    },
    {
      arrayFilters: [{ 'coin.currency': currency }, { 'cost.currency': 'USD' }],
      returnDocument: 'after',
    }
  )

  if (!results.value) {
    throw 'failed to find and update portfolio'
  }
  return results.value
}
