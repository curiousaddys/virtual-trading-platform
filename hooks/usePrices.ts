import ky from 'ky'
import useSWR from 'swr'
import { ONE_MINUTE_MS } from '../utils/constants'
import { Price } from '../pages/api/prices'

const fetchPrices = async (): Promise<Price[]> => {
  return await ky.get('/api/prices').json<Price[]>()
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
