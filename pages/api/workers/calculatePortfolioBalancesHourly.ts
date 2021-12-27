import { NextApiRequest, NextApiResponse } from 'next'
import {
  getPortfolioBalancesAvgForHour,
  PortfolioBalance,
} from '../../../db/portfolioHistory_minutely'
import { insertHourlyPortfolioHistory } from '../../../db/portfolioHistory_hourly'

type WorkerAPIResponse = { status: 'ok' } | { status: 'error'; error: string }

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<WorkerAPIResponse>
) {
  try {
    const oneHourAgo = Date.now() - 1000 * 60 * 60
    const balances = await getPortfolioBalancesAvgForHour(oneHourAgo)

    // TODO: This should never be true after this has been running for an hour, so remove it later.
    if (balances.length === 0) {
      return res.status(200).json({ status: 'ok' })
    }

    const timestamp = Math.floor(oneHourAgo / 1000 / 60 / 60) * 60 * 60

    const recordsInserted = await insertHourlyPortfolioHistory(
      balances.map(
        (balance): PortfolioBalance => ({
          portfolioID: balance._id,
          balanceUSD: balance.avg,
          timestamp: timestamp,
        })
      )
    )

    console.info(
      `[Portfolio Price History – Hourly] ${recordsInserted} records inserted.`
    )

    return res.status(200).json({ status: 'ok' })
  } catch (err: any) {
    return res.status(500).json({ status: 'error', error: err })
  }
}
