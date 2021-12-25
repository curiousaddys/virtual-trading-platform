import type { NextApiRequest, NextApiResponse } from 'next'
import { COINGECKO_BASE_URL, SUPPORTED_COINS } from '../../utils/constants'
import got from 'got'
import { z } from 'zod'
import { getErrorDetails } from '../../utils/errors'

export interface GeckoPriceHistory {
  prices: number[][] //TODO(jh): seems like the data is not 100% clean and there could sometimes be null values?
  market_caps: number[][]
  total_volumes: number[][]
}

const QuerySchema = z.object({
  coin: z.enum(SUPPORTED_COINS),
  days: z.enum(['1', '7', '30', '365', 'max']).default('1'),
})

// This endpoint returns an array with timestamps and prices.
// For 1 day, the data has minutely granularity. For 7 or 30 days, hourly. For 365+ days, daily.
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GeckoPriceHistory | { error: string }>
) {
  try {
    const { coin, days } = QuerySchema.parse(req.query)
    const geckoCoinDetailsPath = `${COINGECKO_BASE_URL}/coins/${coin}/market_chart`
    const geckoOpts = {
      vs_currency: 'usd',
      days: days,
    }
    const data = await got
      .get(geckoCoinDetailsPath, { searchParams: geckoOpts })
      .json<GeckoPriceHistory>()
    // TODO(jh): only return the exact data needed for out frontend to improve loading time
    res.status(200).json(data)
  } catch (err: any) {
    const { status, message } = getErrorDetails(err)
    return res.status(status).json({ error: message })
  }
}
