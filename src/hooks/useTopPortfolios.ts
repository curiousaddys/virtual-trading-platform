import ky from 'ky'
import useSWR from 'swr'
import { ONE_MINUTE_MS } from '../utils/constants'
import type { TopPortfolio } from '../db/portfolioHistory'

const fetchTopPortfolios = async (): Promise<TopPortfolio[]> => {
  return await ky.get('/api/top_portfolios?limit=10').json<TopPortfolio[]>()
}

export const useTopPortfolios = () => {
  const { data, error } = useSWR('/api/top_portfolios?limit=10', fetchTopPortfolios, {
    refreshInterval: ONE_MINUTE_MS,
  })

  return {
    topPortfolios: data,
    topPortfoliosLoading: !error && !data,
    topPortfoliosError: error,
  }
}
