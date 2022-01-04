import {
  getPortfolioHistoryDailyCollection,
  getPortfolioHistoryHourlyCollection,
  getPortfolioHistoryMinutelyCollection,
} from './portfolioHistory'
import { ObjectID } from 'bson'
import { DateRangeValues } from '../utils/constants'
import dayjs from 'dayjs'

const getCollection = {
  '1': getPortfolioHistoryMinutelyCollection,
  '7': getPortfolioHistoryHourlyCollection,
  '30': getPortfolioHistoryHourlyCollection,
  '365': getPortfolioHistoryDailyCollection,
  max: getPortfolioHistoryDailyCollection,
}

export const getPortfolioBalanceHistory = async (portfolioID: ObjectID, days: DateRangeValues) => {
  // TODO: add params for time range (today, this week, 30 days, 365 days, all)
  // for today (minutely)
  const { collection, session } = await getCollection[days]()
  // TODO: filter timestamp greater than or equal to whatever
  const startDate = days === 'max' ? null : dayjs().subtract(parseInt(days), 'day').toDate()
  const results = await collection.find(
    { portfolioID, timestamp: { $gte: startDate ?? dayjs('1970-01-01').toDate() } },
    { session }
  )
  const resultsArr = await results.toArray()
  return resultsArr.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
  // for the week (hourly)
  // for this year (daily)
  // for all time (daily)
}
