import { getPortfolioHistoryMinutelyCollection } from './portfolioHistory_minutely'
import { ObjectID } from 'bson'

export const getPortfolioBalanceHistory = async (portfolioID: ObjectID) => {
  // TODO: add params for time range (today, this week, 30 days, 365 days, all)
  // for last hour (minutely)
  const { collection, session } = await getPortfolioHistoryMinutelyCollection()
  const results = await collection.find({ portfolioID }, { session })
  const resultsArr = await results.toArray()
  return resultsArr.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
  // for today (minutely)
  // for the week (hourly)
  // for this year (daily)
  // for all time (daily)
}
