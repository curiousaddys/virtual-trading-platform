import { NextApiRequest, NextApiResponse } from 'next'
import { getAllPortfolios } from '../../../db/accounts'
import { getMarketData } from '../../../api/CoinGecko/markets'
import {
  insertMinutelyPortfolioHistory,
  PortfolioBalance,
} from '../../../db/portfolioHistory_minutely'
import { cloudflareWorkerAuth } from '../../../utils/auth'
import { getErrorDetails } from '../../../utils/errors'

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

    // get current prices
    const geckoPrices = await getMarketData()

    // store prices in key-value pairs to perform quick lookups
    const currentPrices: CurrentPrices = {}
    geckoPrices.forEach((price) => {
      currentPrices[price.id] = price.current_price
    })

    // get all portfolios
    const portfolios = await getAllPortfolios()

    // calculate balance for each portfolio for current minute
    const timestamp = Math.floor(Date.now() / 1000 / 60) * 60
    const balances: PortfolioBalance[] = portfolios.map((portfolio) => ({
      timestamp: timestamp,
      portfolioID: portfolio._id,
      balanceUSD: portfolio.holdings.reduce((prev: any, cur: any) => ({
        amount: prev.amount + cur.amount * currentPrices[cur.currency],
        currency: '',
      })).amount,
    }))

    // insert into database
    const recordsInserted = await insertMinutelyPortfolioHistory(balances)
    console.info(
      `[Portfolio Price History – Minutely] ${recordsInserted} records inserted.`
    )

    return res.status(200).json({ status: 'ok' })
  } catch (err: any) {
    const { status, message } = getErrorDetails(err)
    return res.status(status).json({ status: 'error', error: message })
  }
}
