import { ObjectId } from 'mongodb'
import { getMongoDB } from './client'
import { ClientSession } from 'mongodb'

export const TRANSACTIONS_COLLECTION = 'transactions'

export interface Transaction {
  _id: ObjectId
  timestamp: Date
  accountID: ObjectId
  portfolioID: ObjectId
  currency: string
  exchangeRateUSD: number
  action: 'buy' | 'sell'
  amountUSD: number
  amountCoin: number
}

const getTransactionsCollection = async () => {
  const { db } = await getMongoDB()
  const collection = db.collection<Transaction>(TRANSACTIONS_COLLECTION)
  await collection.createIndex({ portfolioID: 1, timestamp: -1 })
  return { collection }
}

export const insertTransaction = async (
  transaction: Transaction,
  session: ClientSession
): Promise<ObjectId> => {
  const { collection } = await getTransactionsCollection()
  const result = await collection.insertOne(transaction, { session })
  return result.insertedId
}

export const getTransactions = async (
  accountID: ObjectId,
  portfolioID: ObjectId,
  currency: string
): Promise<Transaction[]> => {
  const { collection } = await getTransactionsCollection()
  return await collection
    .find({
      accountID,
      portfolioID,
      currency,
    })
    .toArray()
}
