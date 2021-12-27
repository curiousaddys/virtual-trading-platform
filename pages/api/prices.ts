import type { NextApiRequest, NextApiResponse } from 'next'
import { getErrorDetails } from '../../utils/errors'
import { GeckoPrices, getMarketData } from '../../api/CoinGecko/markets'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GeckoPrices[] | { error: string }>
) {
  try {
    // TODO(jh): only return the exact data needed for out frontend to improve loading time
    const data = await getMarketData()
    res.setHeader('Cache-Control', 's-maxage=60')
    res.status(200).json(data)
  } catch (err: any) {
    const { status, message } = getErrorDetails(err)
    return res.status(status).json({ error: message })
  }
}
