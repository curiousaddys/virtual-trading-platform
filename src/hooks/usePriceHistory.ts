import ky from 'ky'
import useSWR from 'swr'
import { ONE_MINUTE_MS } from '../utils/constants'
import { PriceHistory } from '../pages/api/price_history'
import { DateRangeValue } from '../components/common/DateRangePicker'
import { useState } from 'react'

const fetchPrices = async (path: string): Promise<PriceHistory> => {
  return await ky.get(path).json<PriceHistory>()
}

export const usePriceHistory = (coin: string) => {
  const [dateRange, setDateRange] = useState(DateRangeValue.SevenDays)

  const shouldFetch = () => {
    return !!coin
  }

  const { data, error } = useSWR(
    shouldFetch() ? `/api/price_history?coin=${coin}&days=${dateRange}` : null,
    fetchPrices,
    {
      refreshInterval: ONE_MINUTE_MS,
    }
  )

  return {
    priceHistory: data,
    priceHistoryLoading: !error && !data,
    priceHistoryError: error,
    setDateRange,
  }
}
