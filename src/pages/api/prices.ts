import type { NextApiRequest, NextApiResponse } from 'next'
import type { GeckoPrices } from '../../api/CoinGecko/markets'
import { fetchMarketData } from '../../api/CoinGecko/markets'
import type { ErrResp } from '../../utils/errors'
import { getErrorDetails } from '../../utils/errors'

export type Price = Pick<
  GeckoPrices,
  | 'id'
  | 'symbol'
  | 'name'
  | 'current_price'
  | 'price_change_percentage_1h_in_currency'
  | 'price_change_percentage_24h_in_currency'
  | 'price_change_percentage_7d_in_currency'
  | 'price_change_percentage_30d_in_currency'
  | 'price_change_percentage_1y_in_currency'
  | 'image'
  | 'total_volume'
>

// Strips away all the fields we don't actually use to reduce load time.
const filterPrices = (data: GeckoPrices[]): Price[] => {
  return data.map((price) => ({
    id: price.id,
    symbol: price.symbol,
    name: price.name,
    current_price: price.current_price,
    price_change_percentage_1h_in_currency: price.price_change_percentage_1h_in_currency,
    price_change_percentage_24h_in_currency: price.price_change_percentage_24h_in_currency,
    price_change_percentage_7d_in_currency: price.price_change_percentage_7d_in_currency,
    price_change_percentage_30d_in_currency: price.price_change_percentage_30d_in_currency,
    price_change_percentage_1y_in_currency: price.price_change_percentage_1y_in_currency,
    image: price.image,
    total_volume: price.total_volume,
  }))
}

const USDollars = {
  id: 'USD',
  symbol: 'USD',
  name: 'US Dollars',
  current_price: 1,
  price_change_percentage_1h_in_currency: 0,
  price_change_percentage_24h_in_currency: 0,
  price_change_percentage_7d_in_currency: 0,
  price_change_percentage_30d_in_currency: 0,
  price_change_percentage_1y_in_currency: 0,
  image: '/usd.jpg',
  total_volume: 0,
}

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse<Price[] | ErrResp>
) {
  try {
    const data = await fetchMarketData()
    const filteredData = filterPrices(data).concat(USDollars)
    res.setHeader('Cache-Control', 's-maxage=60')
    res.status(200).json(filteredData)
  } catch (err) {
    const { status, message } = getErrorDetails(err)
    return res.status(status).json({ error: message })
  }
}
