import { getPortfolioHistoryMinutelyCollection } from './portfolioHistory_minutely'
import { ObjectID } from 'bson'

export const getPortfolioBalanceHistory = async (portfolioID: ObjectID) => {
  // TODO: add params for time range (today, this week, 30 days, 365 days, all)
  // for last hour (minutely)
  const collection = await getPortfolioHistoryMinutelyCollection()
  const results = await collection.find({ portfolioID })
  const resultsArr = await results.toArray()
  return resultsArr.sort((a, b) => a.timestamp - b.timestamp)
  // for today (minutely)
  // for the week (hourly)
  // for this year (daily)
  // for all time (daily)
}
