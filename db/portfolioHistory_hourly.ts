import {
  PortfolioBalance,
  PortfolioBalanceAvg,
} from './portfolioHistory_minutely'
import { getMongoDB } from './mongodb-client'
import { THIRTY_DAYS_SEC } from '../utils/constants'

export const getPortfolioHistoryHourlyCollection = async () => {
  const { db, session } = await getMongoDB()
  const collection = await db.collection<PortfolioBalance>(
    'portfolioHistory_hourly'
  )
  await collection.createIndex(
    { timestamp: -1 },
    {
      expireAfterSeconds: THIRTY_DAYS_SEC,
      session,
    }
  )
  await collection.createIndex(
    { portfolioID: 1, timestamp: -1 },
    { unique: true, session }
  )
  return { collection, session }
}

export const insertHourlyPortfolioHistory = async (
  history: PortfolioBalance[]
): Promise<number> => {
  const { collection, session } = await getPortfolioHistoryHourlyCollection()
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

export const getPortfolioBalancesAvgForDay = async (
  date: Date
): Promise<PortfolioBalanceAvg[]> => {
  const startOfDay = new Date(
    Math.floor(date.getTime() / 1000 / 60 / 60 / 24) * 60 * 60 * 24 * 1000
  )
  const startOfNextDay = new Date(
    Math.floor(date.getTime() / 1000 / 60 / 60 / 24) * 60 * 60 * 24 * 1000 +
      60 * 60 * 24
  )
  const { collection, session } = await getPortfolioHistoryHourlyCollection()
  const results = await collection.aggregate<PortfolioBalanceAvg>(
    [
      { $match: { timestamp: { $gte: startOfDay, $lt: startOfNextDay } } },
      {
        $group: {
          _id: '$portfolioID',
          avg: { $avg: '$balanceUSD' },
        },
      },
    ],
    { session }
  )
  return results.toArray()
}
