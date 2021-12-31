import { NextApiRequest, NextApiResponse } from 'next'
import { getPortfolioBalancesAvgForDay } from '../../../db/portfolioHistory_hourly'
import { PortfolioBalance } from '../../../db/portfolioHistory_minutely'
import { insertDailyPortfolioHistory } from '../../../db/portfolioHistory_daily'
import { cloudflareWorkerAuth } from '../../../utils/auth'
import { getErrorDetails } from '../../../utils/errors'
import dayjs from 'dayjs'

type WorkerAPIResponse = { status: 'ok' } | { status: 'error'; error: string }

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<WorkerAPIResponse>
) {
  try {
    cloudflareWorkerAuth(req)
    const oneDayAgo = dayjs().subtract(1, 'day').toDate()
    const avgBalances = await getPortfolioBalancesAvgForDay(oneDayAgo)

    // TODO: This should never be true after this has been running for a day, so remove it later.
    if (avgBalances.length === 0) {
      return res.status(200).json({ status: 'ok' })
    }

    const timestamp = dayjs(oneDayAgo)
      .set('millisecond', 0)
      .set('second', 0)
      .set('minute', 0)
      .set('hour', 0)
      .toDate()

    const balancesToInsert = avgBalances.map(
      (balance): PortfolioBalance => ({
        portfolioID: balance._id,
        balanceUSD: balance.avg,
        timestamp: timestamp,
      })
    )

    const recordsInserted = await insertDailyPortfolioHistory(balancesToInsert)

    console.info(`[Portfolio Price History – Daily] ${recordsInserted} records inserted.`)

    return res.status(200).json({ status: 'ok' })
  } catch (err: any) {
    const { status, message } = getErrorDetails(err)
    return res.status(status).json({ status: 'error', error: message })
  }
}
