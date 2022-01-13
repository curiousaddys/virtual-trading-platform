import { ObjectId } from 'mongodb'
import { getMongoDB } from './client'

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

export const insertTransaction = async (transaction: Transaction): Promise<ObjectId> => {
  const { collection } = await getTransactionsCollection()
  const result = await collection.insertOne(transaction)
  return result.insertedId
}

// TODO: consider just using database transactions to rollback instead of doing this
export const deleteTransaction = async (id: ObjectId): Promise<number> => {
  const { collection } = await getTransactionsCollection()
  const result = await collection.deleteOne({ _id: id })
  return result.deletedCount
}

export const getTransactions = async (
  accountID: string,
  portfolioID: string,
  currency: string
): Promise<Transaction[]> => {
  const { collection } = await getTransactionsCollection()
  return await collection
    .find({
      accountID: new ObjectId(accountID),
      portfolioID: new ObjectId(portfolioID),
      currency,
    })
    .toArray()
}
