import { NextApiRequest, NextApiResponse } from 'next'
import { getAllPortfolios } from '../../../db/accounts'
import { getMarketData } from '../../../api/CoinGecko/markets'
import { insertMinutelyPortfolioHistory, PortfolioBalance } from '../../../db/portfolioHistory'
import { cloudflareWorkerAuth } from '../../../utils/auth'
import { getErrorDetails } from '../../../utils/errors'
import dayjs from 'dayjs'
import { Timer } from '../../../utils/timer'

type WorkerAPIResponse = { status: 'ok' } | { status: 'error'; error: string }

interface CurrentPrices {
  [key: string]: number
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<WorkerAPIResponse>
) {
  try {
    cloudflareWorkerAuth(req)

    const timer = new Timer()

    // get current prices
    const geckoPrices = await getMarketData()
    timer.log('Got Gecko market data')

    // store prices in key-value pairs to perform quick lookups
    const currentPrices: CurrentPrices = {}
    geckoPrices.forEach((price) => {
      currentPrices[price.id] = price.current_price
    })
    timer.log('Processed Gecko market data')

    // get all portfolios
    const portfolios = await getAllPortfolios()
    timer.log('Got all portfolios from database')

    // calculate balance for each portfolio for current minute
    const timestamp = dayjs().set('second', 0).set('millisecond', 0).toDate()
    const balances: PortfolioBalance[] = portfolios.map((portfolio) => ({
      timestamp: timestamp,
      portfolioID: portfolio._id,
      balanceUSD: portfolio.holdings.reduce((prev: any, cur: any) => ({
        amount: prev.amount + cur.amount * currentPrices[cur.currency],
        currency: '',
      })).amount,
    }))
    timer.log('Calculated all portfolio balances')

    // insert into database
    const recordsInserted = await insertMinutelyPortfolioHistory(balances)
    timer.log('Inserted portfolio balances into database')

    console.info(`[Portfolio Price History – Minutely] ${recordsInserted} records inserted.`)

    return res.status(200).json({ status: 'ok' })
  } catch (err: any) {
    const { status, message } = getErrorDetails(err)
    return res.status(status).json({ status: 'error', error: message })
  }
}
