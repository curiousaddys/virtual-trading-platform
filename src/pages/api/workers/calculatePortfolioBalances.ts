import dayjs from 'dayjs'
import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { fetchMarketData } from '../../../api/CoinGecko/markets'
import type { PortfolioBalance } from '../../../db/portfolioHistory'
import {
  getPortfolioHistoryDailyCollection,
  getPortfolioHistoryEveryFiveMinCollection,
  getPortfolioHistoryHourlyCollection,
  insertMinutelyPortfolioHistory,
  persistPortfolioBalances,
} from '../../../db/portfolioHistory'
import type { Holding } from '../../../db/portfolios'
import { findAllPortfolios } from '../../../db/portfolios'
import { cloudflareWorkerAuth } from '../../../utils/auth'
import { getErrorDetails } from '../../../utils/errors'
import { Timer } from '../../../utils/timer'

type WorkerAPIResponse = { status: 'ok' } | { status: 'error'; error: string }

interface CurrentPrices {
  [key: string]: number
}

const QuerySchema = z.object({
  time: z.string(),
})

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<WorkerAPIResponse>
) {
  try {
    cloudflareWorkerAuth(req)

    const { time } = QuerySchema.parse(req.query)
    const date = new Date(parseInt(time))

    const timer = new Timer()

    // get current prices
    const geckoPrices = await fetchMarketData()
    timer.log('Got Gecko market data')

    // store prices in key-value pairs to perform quick lookups
    const currentPrices: CurrentPrices = { USD: 1 }
    geckoPrices.forEach((price) => {
      currentPrices[price.id] = price.current_price
    })
    timer.log('Processed Gecko market data')

    // get all portfolios
    const portfolios = await findAllPortfolios()
    timer.log('Got all portfolios from database')

    // calculate balance for each portfolio for current minute
    const timestamp = dayjs(date).set('second', 0).set('millisecond', 0).toDate()
    const balances: PortfolioBalance[] = portfolios.map((portfolio) => ({
      timestamp: timestamp,
      portfolioID: portfolio._id,
      balanceUSD: portfolio.holdings.reduce(
        (prev: number, cur: Holding) => prev + cur.amount * (currentPrices[cur.currency] ?? 0),
        0
      ),
    }))
    timer.log('Calculated all portfolio balances')

    // insert into database
    const recordsInserted = await insertMinutelyPortfolioHistory(balances)
    timer.log('Inserted portfolio balances into database')

    console.info(`[Portfolio Price History – Minutely] ${recordsInserted} records inserted.`)

    // If time meets certain conditions, save snapshot of the data that we just calculated.
    const hour = date.getHours()
    const min = date.getMinutes()

    if (min % 5 === 0) {
      // Every 5 min.
      const targetCollection = await getPortfolioHistoryEveryFiveMinCollection()
      await persistPortfolioBalances(targetCollection, timestamp)
      timer.log('Snapshot [Portfolio Price History – Every 5 min] completed')
    }
    if (min === 0) {
      // Hourly.
      const targetCollection = await getPortfolioHistoryHourlyCollection()
      await persistPortfolioBalances(targetCollection, timestamp)
      timer.log('Snapshot [Portfolio Price History – Hourly] completed')
    }
    if (hour === 0 && min === 0) {
      // Daily.
      const targetCollection = await getPortfolioHistoryDailyCollection()
      await persistPortfolioBalances(targetCollection, timestamp)
      timer.log('Snapshot [Portfolio Price History – Daily] completed')
    }

    return res.status(200).json({ status: 'ok' })
  } catch (err) {
    const { status, message } = getErrorDetails(err)
    return res.status(status).json({ status: 'error', error: message })
  }
}
