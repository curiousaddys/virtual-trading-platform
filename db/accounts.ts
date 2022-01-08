import { getMongoDB } from './client'
import { ObjectID } from 'bson'
import { INITIAL_PORTFOLIO_FUND_AMOUNT } from '../utils/constants'

export interface Account {
  _id: ObjectID
  address: string
  nickname: string
  joined: Date
  lastLogin: Date
  portfolios: Portfolio[]
}

export interface Portfolio {
  _id: ObjectID
  name: string
  holdings: Holding[]
}

export interface Holding {
  currency: string
  amount: number
}

const getAccountsCollection = async () => {
  const { client, db } = await getMongoDB()
  const collection = db.collection<Account>('accounts')
  await collection.createIndex({ address: 1 })
  return { client, collection }
}

export const findOrInsertAccount = async (address: string) => {
  const { collection } = await getAccountsCollection()
  const result = await collection.findOneAndUpdate(
    { address },
    {
      // Create user in database and fund initial portfolio.
      $setOnInsert: {
        address,
        nickname: 'Anonymous User', // Eventually the user will be able to set their own nickname.
        joined: new Date(),
        portfolios: [
          {
            _id: new ObjectID(),
            name: 'main', // Eventually we may let the user assign names to their different portfolios.
            holdings: [
              {
                currency: 'USD',
                amount: INITIAL_PORTFOLIO_FUND_AMOUNT,
              },
            ],
          },
        ],
      },
      $set: {
        lastLogin: new Date(),
      },
    },
    { upsert: true, returnDocument: 'after' }
  )
  return result.value!
}

export const updateAccount = async (address: string, account: Partial<Account>) => {
  const { collection } = await getAccountsCollection()
  const result = await collection.findOneAndUpdate(
    { address },
    {
      $set: account,
    },
    { returnDocument: 'after' }
  )
  return result.value!
}

export const getAllPortfolios = async (): Promise<Portfolio[]> => {
  const { client, collection } = await getAccountsCollection()
  const session = client.startSession()
  const accounts = await collection.find({}, { session }).toArray()
  const portfolios: Portfolio[] = []
  accounts.forEach((account) => {
    account.portfolios.forEach((portfolio) => {
      portfolios.push(portfolio)
    })
  })
  await session.endSession()
  return portfolios
}

export const findPortfoliosByAddress = async (address: string): Promise<Portfolio[]> => {
  const { collection } = await getAccountsCollection()
  const account = await collection.findOne({ address })
  return account?.portfolios ?? <Portfolio[]>[]
}

export const updatePortfolio = async (
  accountID: ObjectID,
  portfolio: Portfolio,
  currency: string,
  amount: number,
  costUSD: number
) => {
  const { collection } = await getAccountsCollection()
  const balance = portfolio!.holdings.find((holding) => holding.currency === currency)?.amount
  if (!balance && balance !== 0) {
    // insert new object
    // TODO: figure out if there is a way to get $push and $inc working in a single db call w/o conflicts
    // TODO: just use db transaction here?
    await collection.findOneAndUpdate(
      { _id: accountID },
      {
        $inc: {
          'portfolios.$[portfolio].holdings.$[cost].amount': -costUSD,
        },
      },
      {
        arrayFilters: [{ 'portfolio._id': portfolio._id }, { 'cost.currency': 'USD' }],
        returnDocument: 'after',
      }
    )
    const results = await collection.findOneAndUpdate(
      { _id: accountID },
      {
        $push: {
          'portfolios.$[portfolio].holdings': {
            currency: currency,
            amount: amount,
          },
        },
      },
      {
        arrayFilters: [{ 'portfolio._id': portfolio._id }],
        returnDocument: 'after',
      }
    )
    return results.value
  } else {
    // update existing object
    const results = await collection.findOneAndUpdate(
      { _id: accountID },
      {
        $inc: {
          'portfolios.$[portfolio].holdings.$[coin].amount': amount,
          'portfolios.$[portfolio].holdings.$[cost].amount': -costUSD,
        },
      },
      {
        arrayFilters: [
          { 'portfolio._id': portfolio._id },
          { 'coin.currency': currency },
          { 'cost.currency': 'USD' },
        ],
        returnDocument: 'after',
      }
    )
    return results.value
  }
}
