import ky from 'ky'
import useSWR from 'swr'
import { ONE_MINUTE_MS } from '../utils/constants'
import type { GeckoDetails } from '../api/CoinGecko/coin'

const fetchCoinDetails = async (path: string): Promise<GeckoDetails> => {
  return await ky.get(path).json<GeckoDetails>()
}

export const useCoinDetails = (coin: string) => {
  const shouldFetch = () => {
    return !!coin
  }

  const { data, error } = useSWR(
    shouldFetch() ? `/api/coin_details?coin=${coin}` : null,
    fetchCoinDetails,
    {
      refreshInterval: ONE_MINUTE_MS,
    }
  )

  return {
    coinDetails: data,
    coinDetailsLoading: !error && !data,
    coinDetailsError: error,
  }
}
