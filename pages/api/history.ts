import type { NextApiRequest, NextApiResponse } from 'next'
import { SUPPORTED_COINS } from '../../utils/constants'
import { z } from 'zod'
import { getErrorDetails } from '../../utils/errors'
import { GeckoPriceHistory, getMarketChart } from '../../api/CoinGecko/market_chart'

const QuerySchema = z.object({
  coin: z.enum(SUPPORTED_COINS),
  days: z.enum(['1', '7', '30', '365', 'max']).default('1'),
})

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GeckoPriceHistory | { error: string }>
) {
  try {
    const { coin, days } = QuerySchema.parse(req.query)
    const data = await getMarketChart(coin, days)
    // TODO(jh): only return the exact data needed for out frontend to improve loading time
    res.setHeader('Cache-Control', 's-maxage=60')
    res.status(200).json(data)
  } catch (err: any) {
    const { status, message } = getErrorDetails(err)
    return res.status(status).json({ error: message })
  }
}
