import { getMongoDB } from './mongodb-client'
import { ONE_DAY_SEC } from '../utils/constants'
import { ObjectID } from 'bson'

export interface PortfolioBalance {
  timestamp: Date
  portfolioID: ObjectID
  balanceUSD: number // TODO(jh): ensure this handles enough precision
}

export interface PortfolioBalanceAvg {
  _id: ObjectID
  avg: number
}

export const getPortfolioHistoryMinutelyCollection = async () => {
  const { db, session } = await getMongoDB()
  const collection = await db.collection<PortfolioBalance>(
    'portfolioHistory_minutely'
  )
  await collection.createIndex(
    { timestamp: -1 },
    {
      expireAfterSeconds: ONE_DAY_SEC,
      session,
    }
  )
  await collection.createIndex(
    { portfolioID: 1, timestamp: -1 },
    { unique: true, session }
  )
  return { collection, session }
}

// Returns the number of records inserted.
export const insertMinutelyPortfolioHistory = async (
  history: PortfolioBalance[]
): Promise<number> => {
  const { collection, session } = await getPortfolioHistoryMinutelyCollection()
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

export const getPortfolioBalancesAvgForHour = async (
  date: Date
): Promise<PortfolioBalanceAvg[]> => {
  const startOfHour = new Date(
    Math.floor(date.getTime() / 1000 / 60 / 60) * 60 * 60 * 1000
  )
  const startOfNextHour = new Date(
    Math.floor(date.getTime() / 1000 / 60 / 60) * 60 * 60 * 1000 + 60 * 60
  )
  const { collection, session } = await getPortfolioHistoryMinutelyCollection()
  const results = await collection.aggregate<PortfolioBalanceAvg>(
    [
      {
        $match: {
          timestamp: { $gte: startOfHour, $lt: startOfNextHour },
        },
      },
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
