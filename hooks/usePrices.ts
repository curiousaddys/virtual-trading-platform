import ky from 'ky'
import useSWR from 'swr'
import { ONE_MINUTE_MS } from '../utils/constants'
import { PricesResp } from '../pages/api/prices'

const fetchPrices = async (): Promise<PricesResp> => {
  const prices = await ky.get('/api/prices').json<PricesResp>()
  // TODO(jh): remove logging
  console.log(prices)
  return prices
}

export const usePrices = () => {
  const { data, error } = useSWR('/api/prices', fetchPrices, {
    refreshInterval: ONE_MINUTE_MS,
  })

  return {
    prices: data,
    pricesLoading: !error && !data,
    pricesError: error,
  }
}
