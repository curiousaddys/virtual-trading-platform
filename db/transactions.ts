import { ObjectID } from 'bson'
import { getMongoDB } from './client'

export interface Transaction {
  _id: ObjectID
  timestamp: Date
  accountID: ObjectID
  portfolioID: ObjectID
  currency: string
  exchangeRateUSD: number
  action: 'buy' | 'sell'
  amountUSD: number
  amountCoin: number
}

const getTransactionsCollection = async () => {
  const { db, session } = await getMongoDB()
  const collection = db.collection<Transaction>('transactions')
  await collection.createIndex({ portfolioID: 1, timestamp: -1 }, { session })
  return { collection, session }
}

export const insertTransaction = async (transaction: Transaction): Promise<ObjectID> => {
  const { collection, session } = await getTransactionsCollection()
  const result = await collection.insertOne(transaction, { session })
  return result.insertedId
}

// TODO: consider just using database transactions to rollback instead of doing this
export const deleteTransaction = async (id: ObjectID): Promise<number> => {
  const { collection, session } = await getTransactionsCollection()
  const result = await collection.deleteOne({ _id: id }, { session })
  return result.deletedCount
}

export const getTransactions = async (
  portfolioID: ObjectID,
  currency: string
): Promise<Transaction[]> => {
  const { collection, session } = await getTransactionsCollection()
  const result = await collection.find(
    { portfolioID: new ObjectID(portfolioID), currency },
    { session }
  )
  return result.toArray()
}
