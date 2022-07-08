import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import type { GeckoDetails } from '../../api/CoinGecko/coin'
import { fetchCoinDetails } from '../../api/CoinGecko/coin'
import { SUPPORTED_COINS } from '../../utils/constants'
import type { ErrResp } from '../../utils/errors'
import { getErrorDetails } from '../../utils/errors'

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
  } catch (err) {
    const { status, message } = getErrorDetails(err)
    return res.status(status).json({ error: message })
  }
}
