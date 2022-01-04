import type { NextApiRequest, NextApiResponse } from 'next'
import { getErrorDetails } from '../../utils/errors'
import { GeckoPrices, getMarketData } from '../../api/CoinGecko/markets'

export type Price = Omit<GeckoPrices, 'sparkline_in_7d'> & { sparkline: number[][] }

// Only keeps hourly sparkline data for the past 24 hrs to slim down the data that is returned to the frontend.
const filterSparkline = (arr: GeckoPrices[]): Price[] =>
  arr.map(({ sparkline_in_7d, ...fieldsToKeep }) => ({
    ...fieldsToKeep,
    sparkline: (sparkline_in_7d?.price ?? [0])
      ?.slice((sparkline_in_7d.price?.length ?? 0) - 25, sparkline_in_7d.price?.length)
      .map((x) => [x]),
  }))

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Price[] | { error: string }>
) {
  try {
    const data = await getMarketData()
    res.setHeader('Cache-Control', 's-maxage=60')
    res.status(200).json(filterSparkline(data))
  } catch (err: any) {
    const { status, message } = getErrorDetails(err)
    return res.status(status).json({ error: message })
  }
}
