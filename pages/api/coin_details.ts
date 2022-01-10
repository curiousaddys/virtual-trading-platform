import type { NextApiRequest, NextApiResponse } from 'next'
import { SUPPORTED_COINS } from '../../utils/constants'
import { z } from 'zod'
import { ErrResp, getErrorDetails } from '../../utils/errors'
import { GeckoDetails, fetchCoinDetails } from '../../api/CoinGecko/coin'

const QuerySchema = z.object({
  coin: z.enum(SUPPORTED_COINS),
})

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GeckoDetails | ErrResp>
) {
  try {
    const { coin } = QuerySchema.parse(req.query)
    const data = await fetchCoinDetails(coin)
    // TODO(jh): filter the coingecko data before returning since there is a lot of extra stuff we don't need
    res.setHeader('Cache-Control', 's-maxage=60')
    res.status(200).json(data)
  } catch (err: any) {
    const { status, message } = getErrorDetails(err)
    return res.status(status).json({ error: message })
  }
}
