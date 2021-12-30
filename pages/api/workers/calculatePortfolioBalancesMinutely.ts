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
    let start = Date.now()
    cloudflareWorkerAuth(req)
    console.info(`Auth completed in ${Date.now() - start} ms.`)

    // get current prices
    start = Date.now()
    const geckoPrices = await getMarketData()
    console.info(`Get Gecko market data done in ${Date.now() - start} ms.`)

    // store prices in key-value pairs to perform quick lookups
    start = Date.now()
    const currentPrices: CurrentPrices = {}
    geckoPrices.forEach((price) => {
      currentPrices[price.id] = price.current_price
    })
    console.info(`Gecko data processing done in ${Date.now() - start} ms.`)

    // get all portfolios
    start = Date.now()
    const portfolios = await getAllPortfolios()
    console.info(`Got all portfolios from DB in ${Date.now() - start} ms.`)

    // calculate balance for each portfolio for current minute
    start = Date.now()
    const timestamp = new Date(Math.floor(Date.now() / 1000 / 60) * 60 * 1000)
    const balances: PortfolioBalance[] = portfolios.map((portfolio) => ({
      timestamp: timestamp,
      portfolioID: portfolio._id,
      balanceUSD: portfolio.holdings.reduce((prev: any, cur: any) => ({
        amount: prev.amount + cur.amount * currentPrices[cur.currency],
        currency: '',
      })).amount,
    }))
    console.info(
      `Calculated all portfolio balances in ${Date.now() - start} ms.`
    )

    // insert into database
    start = Date.now()
    const recordsInserted = await insertMinutelyPortfolioHistory(balances)
    console.info(`Balances inserted into DB in ${Date.now() - start} ms.`)
    console.info(
      `[Portfolio Price History – Minutely] ${recordsInserted} records inserted.`
    )

    return res.status(200).json({ status: 'ok' })
  } catch (err: any) {
    const { status, message } = getErrorDetails(err)
    return res.status(status).json({ status: 'error', error: message })
  }
}
