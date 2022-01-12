import { getMongoDB } from './client'
import { ONE_DAY_SEC, ONE_HOUR_SEC, THIRTY_DAYS_SEC } from '../utils/constants'
import { ObjectId } from 'mongodb'
import { Collection } from 'mongodb'
import dayjs from 'dayjs'
import { DateRangeValue } from '../components/common/DateRangePicker'
import { PORTFOLIOS_COLLECTION } from './portfolios'
import { ACCOUNT_COLLECTION } from './accounts'

export const PORTFOLIO_HISTORY_MINUTELY_COLLECTION = 'portfolioHistory_minutely'
export const PORTFOLIO_HISTORY_EVERY_FIVE_MIN_COLLECTION = 'portfolioHistory_everyFiveMin'
export const PORTFOLIO_HISTORY_HOURLY_COLLECTION = 'portfolioHistory_hourly'
export const PORTFOLIO_HISTORY_DAILY_COLLECTION = 'portfolioHistory_daily'

export interface PortfolioBalance {
  timestamp: Date
  portfolioID: ObjectId
  balanceUSD: number
}

export const getPortfolioHistoryMinutelyCollection = async () => {
  const { db } = await getMongoDB()
  const collection = await db.collection<PortfolioBalance>(PORTFOLIO_HISTORY_MINUTELY_COLLECTION)
  await collection.createIndex(
    { timestamp: -1 },
    {
      expireAfterSeconds: ONE_HOUR_SEC,
    }
  )
  await collection.createIndex({ portfolioID: 1, timestamp: -1 }, { unique: true })
  return collection
}

export const getPortfolioHistoryEveryFiveMinCollection = async () => {
  const { db } = await getMongoDB()
  const collection = await db.collection<PortfolioBalance>(
    PORTFOLIO_HISTORY_EVERY_FIVE_MIN_COLLECTION
  )
  await collection.createIndex(
    { timestamp: -1 },
    {
      expireAfterSeconds: ONE_DAY_SEC,
    }
  )
  await collection.createIndex({ portfolioID: 1, timestamp: -1 }, { unique: true })
  return collection
}

export const getPortfolioHistoryHourlyCollection = async () => {
  const { db } = await getMongoDB()
  const collection = await db.collection<PortfolioBalance>(PORTFOLIO_HISTORY_HOURLY_COLLECTION)
  await collection.createIndex(
    { timestamp: -1 },
    {
      expireAfterSeconds: THIRTY_DAYS_SEC,
    }
  )
  await collection.createIndex({ portfolioID: 1, timestamp: -1 }, { unique: true })
  return collection
}

export const getPortfolioHistoryDailyCollection = async () => {
  const { db } = await getMongoDB()
  const collection = await db.collection<PortfolioBalance>(PORTFOLIO_HISTORY_DAILY_COLLECTION)
  await collection.createIndex({ timestamp: -1 })
  await collection.createIndex({ portfolioID: 1, timestamp: -1 }, { unique: true })
  return collection
}

// Returns the number of records inserted.
export const insertMinutelyPortfolioHistory = async (
  history: PortfolioBalance[]
): Promise<number> => {
  const { client, db } = await getMongoDB()
  const collection = await db.collection<PortfolioBalance>(PORTFOLIO_HISTORY_MINUTELY_COLLECTION)
  const session = client.startSession()
  try {
    const result = await collection.insertMany(history, {
      ordered: false,
      session,
    })
    await session.endSession()
    return result.insertedCount
  } catch (err: any) {
    await session.endSession()
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
  const collection = await getPortfolioHistoryMinutelyCollection()
  return await collection
    .aggregate([
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
    .toArray()
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
  const collection = await getPortfolioHistoryCollectionForDays[days]()
  const startDate = (
    days === 'max' ? dayjs('1970-01-01') : dayjs().subtract(parseInt(days), 'day')
  ).toDate()
  const results = await collection.find({ portfolioID, timestamp: { $gte: startDate } })
  const resultsArr = await results.toArray()
  return resultsArr.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
}

export interface TopPortfolio {
  _id: ObjectId
  balanceUSD: number
  accountNickname: string
  portfolioName: string
}

export const getTopPortfolios = async (limit: number) => {
  const collection = await getPortfolioHistoryMinutelyCollection()
  const results = await collection.aggregate<TopPortfolio>([
    // Group by portfolio ID to get the latest balance for each portfolio.
    {
      $group: {
        _id: '$portfolioID',
        balanceUSD: {
          $first: '$balanceUSD',
        },
      },
    },
    // Sort by balance to find the top portfolios
    {
      $sort: {
        balanceUSD: -1,
      },
    },
    // Limit to top 10 now so that we have less data to work with.
    {
      $limit: limit,
    },
    // Lookup (join) full portfolio data for the top 10.
    {
      $lookup: {
        from: PORTFOLIOS_COLLECTION,
        localField: '_id',
        foreignField: '_id',
        as: 'portfolio',
      },
    },
    { $unwind: '$portfolio' },
    // Project to just get the accountID from the joined portfolio.
    {
      $project: {
        _id: 1,
        balanceUSD: 1,
        accountID: '$portfolio.accountID',
        portfolioName: '$portfolio.name',
      },
    },
    // Lookup (join) full account data.
    {
      $lookup: {
        from: ACCOUNT_COLLECTION,
        localField: 'accountID',
        foreignField: '_id',
        as: 'account',
      },
    },
    { $unwind: '$account' },
    // Project to just get the nickname from the joined account.
    {
      $project: {
        _id: 1,
        balanceUSD: 1,
        accountNickname: '$account.nickname',
        portfolioName: '$portfolioName',
      },
    },
    { $sort: { balanceUSD: -1 } },
  ])
  return await results.toArray()
}
