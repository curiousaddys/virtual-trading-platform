import { getMongoDB } from './client'
import { ONE_DAY_SEC, ONE_HOUR_SEC, THIRTY_DAYS_SEC } from '../utils/constants'
import { ObjectID } from 'bson'
import { Collection } from 'mongodb'
import dayjs from 'dayjs'
import { DateRangeValue } from '../components/common/DateRangePicker'

export interface PortfolioBalance {
  timestamp: Date
  portfolioID: ObjectID
  balanceUSD: number
}

export const getPortfolioHistoryMinutelyCollection = async () => {
  const { client, db } = await getMongoDB()
  const collection = await db.collection<PortfolioBalance>('portfolioHistory_minutely')
  await collection.createIndex(
    { timestamp: -1 },
    {
      expireAfterSeconds: ONE_HOUR_SEC,
    }
  )
  await collection.createIndex({ portfolioID: 1, timestamp: -1 }, { unique: true })
  return { client, collection }
}

export const getPortfolioHistoryEveryFiveMinCollection = async () => {
  const { db } = await getMongoDB()
  const collection = await db.collection<PortfolioBalance>('portfolioHistory_everyFiveMin')
  await collection.createIndex(
    { timestamp: -1 },
    {
      expireAfterSeconds: ONE_DAY_SEC,
    }
  )
  await collection.createIndex({ portfolioID: 1, timestamp: -1 }, { unique: true })
  return { collection }
}

export const getPortfolioHistoryHourlyCollection = async () => {
  const { db } = await getMongoDB()
  const collection = await db.collection<PortfolioBalance>('portfolioHistory_hourly')
  await collection.createIndex(
    { timestamp: -1 },
    {
      expireAfterSeconds: THIRTY_DAYS_SEC,
    }
  )
  await collection.createIndex({ portfolioID: 1, timestamp: -1 }, { unique: true })
  return { collection }
}

export const getPortfolioHistoryDailyCollection = async () => {
  const { db } = await getMongoDB()
  const collection = await db.collection<PortfolioBalance>('portfolioHistory_daily')
  await collection.createIndex({ timestamp: -1 })
  await collection.createIndex({ portfolioID: 1, timestamp: -1 }, { unique: true })
  return { collection }
}

// Returns the number of records inserted.
export const insertMinutelyPortfolioHistory = async (
  history: PortfolioBalance[]
): Promise<number> => {
  const { client, collection } = await getPortfolioHistoryMinutelyCollection()
  const session = await client.startSession()
  try {
    const result = await collection.insertMany(history, {
      ordered: false,
      session,
    })
    await session.endSession()
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

export const persistPortfolioBalances = async (
  targetCollection: Collection<PortfolioBalance>,
  timestamp: Date
) => {
  const { collection } = await getPortfolioHistoryMinutelyCollection()
  const results = await collection.aggregate([
    // sort by timestamp desc
    {
      $sort: {
        timestamp: -1,
      },
    },
    // filter by the timestamp that was passed into the function
    {
      $match: {
        timestamp: timestamp,
      },
    },
    // group by portfolio id & select first (newest) timestamp + balance (just in case somehow there are duplicates)
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
  ])
  // Must do this in order for Node.js MongoDB driver to actually execute the aggregation.
  await results.toArray()
}

const getPortfolioHistoryCollectionForDays = {
  [DateRangeValue.Hour]: getPortfolioHistoryMinutelyCollection,
  [DateRangeValue.Day]: getPortfolioHistoryEveryFiveMinCollection,
  [DateRangeValue.SevenDays]: getPortfolioHistoryHourlyCollection,
  [DateRangeValue.ThirtyDays]: getPortfolioHistoryHourlyCollection,
  [DateRangeValue.Year]: getPortfolioHistoryDailyCollection,
  [DateRangeValue.Max]: getPortfolioHistoryDailyCollection,
}

export const getPortfolioBalanceHistory = async (portfolioID: ObjectID, days: DateRangeValue) => {
  const { collection } = await getPortfolioHistoryCollectionForDays[days]()
  const startDate = (
    days === 'max' ? dayjs('1970-01-01') : dayjs().subtract(parseInt(days), 'day')
  ).toDate()
  const results = await collection.find({ portfolioID, timestamp: { $gte: startDate } })
  const resultsArr = await results.toArray()
  return resultsArr.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
}

export interface TopPortfolio {
  _id: ObjectID
  balanceUSD: number
  accountNickname: string
}

export const getTopPortfolios = async (limit: number) => {
  const { collection } = await getPortfolioHistoryMinutelyCollection()
  const results = await collection.aggregate<TopPortfolio>([
    {
      $sort: {
        timestamp: -1,
      },
    },
    {
      $group: {
        _id: '$portfolioID',
        balanceUSD: {
          $first: '$balanceUSD',
        },
      },
    },
    /*
      TODO: will this "lookup" stage will be fast enough when dealing w/ a lot of users?
      if not, then maybe we should run this entire thing in the background & have a "top portfolios" collection
      that just updates every five min
      */
    {
      $lookup: {
        from: 'accounts',
        let: {
          portfolio_id: '$_id',
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $in: ['$$portfolio_id', '$portfolios._id'],
              },
            },
          },
        ],
        as: 'accounts',
      },
    },
    {
      $project: {
        _id: 1,
        balanceUSD: 1,
        account: {
          $first: '$accounts',
        },
      },
    },
    {
      $project: {
        _id: 1,
        balanceUSD: 1,
        accountNickname: '$account.nickname',
      },
    },
    { $limit: limit },
    { $sort: { balanceUSD: -1 } },
  ])
  return await results.toArray()
}
