import { getMongoDB } from './mongodb-client'
import { ONE_DAY_SEC, THIRTY_DAYS_SEC } from '../utils/constants'
import { ObjectID } from 'bson'
import { Collection } from 'mongodb'

export interface PortfolioBalance {
  timestamp: Date
  portfolioID: ObjectID
  balanceUSD: number // TODO(jh): ensure this handles enough precision
}

export const getPortfolioHistoryMinutelyCollection = async () => {
  const { db, session } = await getMongoDB()
  const collection = await db.collection<PortfolioBalance>('portfolioHistory_minutely')
  await collection.createIndex(
    { timestamp: -1 },
    {
      expireAfterSeconds: ONE_DAY_SEC,
      session,
    }
  )
  await collection.createIndex({ portfolioID: 1, timestamp: -1 }, { unique: true, session })
  return { collection, session }
}

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

export const getPortfolioHistoryDailyCollection = async () => {
  const { db, session } = await getMongoDB()
  const collection = await db.collection<PortfolioBalance>('portfolioHistory_daily')
  await collection.createIndex({ timestamp: -1 }, { session })
  await collection.createIndex({ portfolioID: 1, timestamp: -1 }, { unique: true, session })
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

export const persistLatestPortfolioBalances = async (
  targetCollection: Collection<PortfolioBalance>
) => {
  const { collection, session } = await getPortfolioHistoryMinutelyCollection()
  await collection.aggregate(
    [
      // sort by timestamp desc
      {
        $sort: {
          timestamp: -1,
        },
      },
      // group by portfolio id & select first (newest) timestamp + balance
      {
        $group: {
          _id: '$portfolioID',
          timestamp: {
            $first: '$timestamp',
          },
          balance: {
            $first: '$balanceUSD',
          },
        },
      },
      // project into desired format
      {
        $project: {
          _id: 0,
          timestamp: '$timestamp',
          balanceUSD: '$balance',
          portfolioID: '$_id',
        },
      },
      // merge results into target collection
      {
        $merge: {
          into: targetCollection.collectionName,
        },
      },
    ],
    { session }
  )
}
