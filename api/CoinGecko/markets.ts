// Markets API returns current prices.

import { SUPPORTED_COINS } from '../../utils/constants'
import CoinGeckoAPI from './client'

export interface GeckoPrices {
  id: string
  symbol: string
  name: string
  image: string
  current_price: number
  market_cap: number
  market_cap_rank: number
  fully_diluted_valuation: number
  total_volume: number
  high_24h: number
  low_24h: number
  price_change_24h: number
  price_change_percentage_24h: number
  market_cap_change_24h: number
  market_cap_change_percentage_24h: number
  circulating_supply: number
  total_supply: number
  max_supply: number
  ath: number
  ath_change_percentage: number
  ath_date: string
  atl: number
  atl_change_percentage: number
  atl_date: string
  roi?: null
  last_updated: string
  // Keep in mind that this sparkline is just an array of prices, it doesn't contain timestamp or date values.
  // Also it seems very inconsistent b/c it can be up to 6 hours behind.
  sparkline_in_7d?: {
    price?: number[] | null
  }
  price_change_percentage_1h_in_currency: number
  price_change_percentage_1y_in_currency: number
  price_change_percentage_24h_in_currency: number
  price_change_percentage_30d_in_currency: number
  price_change_percentage_7d_in_currency: number
}

export const fetchMarketData = async (): Promise<GeckoPrices[]> => {
  const path = `coins/markets`
  const params = {
    vs_currency: 'usd',
    ids: SUPPORTED_COINS.join(','),
    sparkline: false,
    price_change_percentage: '1h,24h,7d,30d,1y',
  }
  return CoinGeckoAPI.get(path, { searchParams: params }).json<GeckoPrices[]>()
}
