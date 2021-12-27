import { NextApiRequest, NextApiResponse } from 'next'
import { getPortfolioBalancesAvgForDay } from '../../../db/portfolioHistory_hourly'
import { PortfolioBalance } from '../../../db/portfolioHistory_minutely'
import { insertDailyPortfolioHistory } from '../../../db/portfolioHistory_daily'

type WorkerAPIResponse = { status: 'ok' } | { status: 'error'; error: string }

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<WorkerAPIResponse>
) {
  try {
    const oneDayAgo = Date.now() - 1000 * 60 * 60 * 24
    const balances = await getPortfolioBalancesAvgForDay(oneDayAgo)

    // TODO: This should never be true after this has been running for a day, so remove it later.
    if (balances.length === 0) {
      return res.status(200).json({ status: 'ok' })
    }

    const timestamp = Math.floor(oneDayAgo / 1000 / 60 / 60 / 24) * 60 * 60 * 24

    const recordsInserted = await insertDailyPortfolioHistory(
      balances.map(
        (balance): PortfolioBalance => ({
          portfolioID: balance._id,
          balanceUSD: balance.avg,
          timestamp: timestamp,
        })
      )
    )

    console.info(
      `[Portfolio Price History – Daily] ${recordsInserted} records inserted.`
    )

    return res.status(200).json({ status: 'ok' })
  } catch (err: any) {
    return res.status(500).json({ status: 'error', error: err })
  }
}
