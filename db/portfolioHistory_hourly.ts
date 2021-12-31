import { PortfolioBalance, PortfolioBalanceAvg } from './portfolioHistory_minutely'
import { getMongoDB } from './mongodb-client'
import { THIRTY_DAYS_SEC } from '../utils/constants'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
dayjs.extend(utc)

export const getPortfolioHistoryHourlyCollection = async () => {
  const { db, session } = await getMongoDB()
  const collection = await db.collection<PortfolioBalance>('portfolioHistory_hourly')
  await collection.createIndex(
    { timestamp: -1 },
    {
      expireAfterSeconds: THIRTY_DAYS_SEC,
      session,
    }
  )
  await collection.createIndex({ portfolioID: 1, timestamp: -1 }, { unique: true, session })
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

export const getPortfolioBalancesAvgForDay = async (date: Date): Promise<PortfolioBalanceAvg[]> => {
  // Note that it's crucial to use UTC mode here since we are setting the hour.
  // It's not needed if only setting smaller units since those aren't impacted by time zones.
  const startOfDay = dayjs(date)
    .utc()
    .set('millisecond', 0)
    .set('second', 0)
    .set('minute', 0)
    .set('hour', 0)
    .toDate()
  const startOfNextDay = dayjs(startOfDay).add(1, 'day').toDate()
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
