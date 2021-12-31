// This endpoint returns an array with timestamps and prices.
// For 1 day, the data has minutely granularity. For 7 or 30 days, hourly. For 365+ days, daily.

import { COINGECKO_BASE_URL } from '../../utils/constants'
import got from 'got'

export interface GeckoPriceHistory {
  prices: number[][] //TODO(jh): seems like the data is not 100% clean and there could sometimes be null values?
  market_caps: number[][]
  total_volumes: number[][]
}

export const getMarketChart = async (coin: string, days: string): Promise<GeckoPriceHistory> => {
  const geckoCoinDetailsPath = `${COINGECKO_BASE_URL}/coins/${coin}/market_chart`
  const geckoOpts = {
    vs_currency: 'usd',
    days: days,
  }
  return got.get(geckoCoinDetailsPath, { searchParams: geckoOpts }).json<GeckoPriceHistory>()
}
