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
  const { collection, session } = await getCollection[days]()
  const startDate = (
    days === 'max' ? dayjs('1970-01-01') : dayjs().subtract(parseInt(days), 'day')
  ).toDate()
  const results = await collection.find(
    { portfolioID, timestamp: { $gte: startDate } },
    { session }
  )
  const resultsArr = await results.toArray()
  return resultsArr.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
}
