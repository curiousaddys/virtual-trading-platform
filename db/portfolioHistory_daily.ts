import { getMongoDB } from './mongodb-client'
import { PortfolioBalance } from './portfolioHistory_minutely'

export const getPortfolioHistoryDailyCollection = async () => {
  const { db, session } = await getMongoDB()
  const collection = await db.collection<PortfolioBalance>(
    'portfolioHistory_daily'
  )
  await collection.createIndex({ timestamp: -1 }, { session })
  await collection.createIndex(
    { portfolioID: 1, timestamp: -1 },
    { unique: true, session }
  )
  return { collection, session }
}

export const insertDailyPortfolioHistory = async (
  history: PortfolioBalance[]
): Promise<number> => {
  const { collection, session } = await getPortfolioHistoryDailyCollection()
  try {
    const result = await collection.insertMany(history, {
      ordered: false,
      session,
    })
    return result.insertedCount
  } catch (err: any) {
    // Ignore duplicate key errors since that just means we tried to insert the same data twice.
    if (err.code === 11000) {
      return err.result.nInserted
    }
    // Unknown error
    return Promise.reject(err)
  }
}