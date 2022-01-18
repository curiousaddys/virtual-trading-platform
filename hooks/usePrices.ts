import ky from 'ky'
import useSWR from 'swr'
import { ONE_MINUTE_MS } from '../utils/constants'
import React, { useContext } from 'react'
import { Price } from '../pages/api/prices'

const fetchPrices = async (): Promise<Price[]> => {
  return await ky.get('/api/prices').json<Price[]>()
}

export const usePrices = () => {
  const { data, error } = useSWR('/api/prices', fetchPrices, {
    refreshInterval: ONE_MINUTE_MS,
  })

  return {
    prices: data ?? ([] as Price[]),
    pricesLoading: !error && !data,
    pricesError: error,
  }
}

export const PricesContext = React.createContext<{
  prices: Price[]
  pricesLoading: boolean
  pricesError: any
}>({
  prices: [] as Price[],
  pricesLoading: false,
  pricesError: null,
})

export const usePricesContext = () => useContext(PricesContext)
