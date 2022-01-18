import type { NextApiRequest, NextApiResponse } from 'next'
import { ErrResp, getErrorDetails } from '../../utils/errors'
import { fetchMarketData, GeckoPrices } from '../../api/CoinGecko/markets'

export type Price = Pick<
  GeckoPrices,
  | 'id'
  | 'symbol'
  | 'name'
  | 'current_price'
  | 'price_change_percentage_24h'
  | 'image'
  | 'total_volume'
>

// Strips away all the fields we don't actually use to reduce load time.
const filterPrices = (data: GeckoPrices[]): Price[] => {
  return data.map((price) => {
    const {
      id,
      symbol,
      name,
      current_price,
      price_change_percentage_24h,
      image,
      total_volume,
      ...other
    } = price
    return {
      id,
      symbol,
      name,
      current_price,
      price_change_percentage_24h,
      image,
      total_volume,
    }
  })
}

const USDollars = {
  id: 'USD',
  symbol: 'USD',
  name: 'US Dollars',
  current_price: 1,
  price_change_percentage_24h: 0,
  image: '/usd.jpg',
  total_volume: 0,
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Price[] | ErrResp>
) {
  try {
    const data = await fetchMarketData()
    const filteredData = filterPrices(data).concat(USDollars)
    res.setHeader('Cache-Control', 's-maxage=60')
    res.status(200).json(filteredData)
  } catch (err: any) {
    const { status, message } = getErrorDetails(err)
    return res.status(status).json({ error: message })
  }
}
