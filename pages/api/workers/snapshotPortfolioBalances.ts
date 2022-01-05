import { NextApiRequest, NextApiResponse } from 'next'
import {
  getPortfolioHistoryDailyCollection,
  getPortfolioHistoryEveryFiveMinCollection,
  getPortfolioHistoryHourlyCollection,
  persistLatestPortfolioBalances,
} from '../../../db/portfolioHistory'
import { cloudflareWorkerAuth } from '../../../utils/auth'
import { getErrorDetails } from '../../../utils/errors'
import { z } from 'zod'

const QuerySchema = z.object({
  period: z.enum(['fiveMin', 'daily', 'hourly']),
})

const getCollection = {
  fiveMin: getPortfolioHistoryEveryFiveMinCollection,
  hourly: getPortfolioHistoryHourlyCollection,
  daily: getPortfolioHistoryDailyCollection,
}

type WorkerAPIResponse = { status: 'ok' } | { status: 'error'; error: string }

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<WorkerAPIResponse>
) {
  try {
    cloudflareWorkerAuth(req)

    const { period } = QuerySchema.parse(req.query)

    const { collection: targetCollection } = await getCollection[period]()
    await persistLatestPortfolioBalances(targetCollection)

    console.info(`[Portfolio Price History – ${period}] Finished.`)

    return res.status(200).json({ status: 'ok' })
  } catch (err: any) {
    const { status, message } = getErrorDetails(err)
    return res.status(status).json({ status: 'error', error: message })
  }
}
