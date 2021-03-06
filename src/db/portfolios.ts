import { getMongoDB } from './client'
import type { ClientSession, ObjectId } from 'mongodb'
import { INITIAL_PORTFOLIO_FUND_AMOUNT } from '../utils/constants'

export const PORTFOLIOS_COLLECTION = 'portfolios'

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
  const { db } = await getMongoDB()
  const collection = db.collection<Portfolio>(PORTFOLIOS_COLLECTION)
  await collection.createIndex({ accountID: 1 })
  return collection
}

export const findOrInsertPortfolio = async (
  _id: ObjectId,
  accountID: ObjectId,
  portfolioName = 'Untitled Portfolio'
) => {
  const collection = await getPortfoliosCollection()
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
    throw Error('failed to find or insert portfolio')
  }
  return result.value
}

export const updatePortfolioName = async (
  _id: ObjectId,
  accountID: ObjectId,
  portfolioName: string
) => {
  const collection = await getPortfoliosCollection()
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
    throw Error('failed to update portfolio name')
  }
  return result.value
}

export const findAllPortfolios = async (): Promise<Portfolio[]> => {
  const { client, db } = await getMongoDB()
  const collection = await db.collection<Portfolio>(PORTFOLIOS_COLLECTION)
  const session = client.startSession()
  const portfolios = await collection.find({}, { session }).toArray()
  await session.endSession()
  return portfolios
}

export const findPortfoliosByAccount = async (accountID: ObjectId): Promise<Portfolio[]> => {
  const collection = await getPortfoliosCollection()
  return await collection.find({ accountID }).toArray()
}

export const findPortfolioByID = async (accountID: ObjectId, _id: ObjectId): Promise<Portfolio> => {
  const collection = await getPortfoliosCollection()
  const portfolio = await collection.findOne({
    accountID,
    _id,
  })
  if (!portfolio) {
    throw Error('portfolio not found')
  }
  return portfolio
}

interface UpdatePortfolioBalanceParams {
  accountID: ObjectId
  portfolio: Portfolio
  currency: string
  amount: number
  costUSD: number
}

export const updatePortfolioBalance = async (
  params: UpdatePortfolioBalanceParams,
  session: ClientSession
) => {
  const { accountID, portfolio, currency, amount, costUSD } = params
  const collection = await getPortfoliosCollection()

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
      { _id: portfolio._id, accountID },
      {
        $push: {
          holdings: {
            currency: currency,
            amount: 0,
            avgBuyCost: 0,
          },
        },
      },
      { session }
    )
  }

  // now that all the objects exist for sure, we can just use $inc
  const results = await collection.findOneAndUpdate(
    { _id: portfolio._id, accountID },
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
      session,
    }
  )

  if (!results.value) {
    throw Error('failed to find and update portfolio')
  }
  return results.value
}
