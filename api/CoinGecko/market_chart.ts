// This endpoint returns an array with timestamps and prices.
// For 1 day, the data has minutely granularity. For 7 or 30 days, hourly. For 365+ days, daily.

import CoinGeckoAPI from './client'

export interface GeckoPriceHistory {
  prices: number[][]
  market_caps: number[][]
  total_volumes: number[][]
}

export const fetchMarketChart = async (coin: string, days: string): Promise<GeckoPriceHistory> => {
  const path = `coins/${coin}/market_chart`
  const params = {
    vs_currency: 'usd',
    days: days,
  }
  return CoinGeckoAPI.get(path, { searchParams: params }).json<GeckoPriceHistory>()
}
