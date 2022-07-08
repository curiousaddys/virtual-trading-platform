import ky from 'ky'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import type { Portfolio } from '../db/portfolios'
import type { ErrResp } from '../utils/errors'
import { useAccountContext } from './useAccount'

export const usePortfolios = () => {
  const { accountInfo, setAccountInfo } = useAccountContext()
  const [portfolios, setPortfolios] = useState<Portfolio[]>([] as Portfolio[])

  // on load, get all portfolios
  useEffect(() => {
    if (!accountInfo) return

    ky.get('/api/portfolios/list')
      .json<Portfolio[]>()
      .then(setPortfolios)
      .catch((err) => {
        console.error(err)
        toast('Error finding portfolios!', { type: 'error' })
      })
  }, [accountInfo])

  const createPortfolio = useCallback(
    (name = 'Untitled Portfolio'): Promise<Portfolio> =>
      ky
        .post('/api/portfolios/create', { searchParams: { portfolioName: name } })
        .json<Portfolio>()
        .then((data) => {
          setPortfolios((prev) => [...prev, data])
          return data
        })
        .catch((err) => err.response.json().then((error: ErrResp) => Promise.reject(error.error))),
    []
  )

  const updatePortfolio = useCallback(
    (id: string, name: string): Promise<Portfolio> =>
      ky
        .post('/api/portfolios/update', {
          searchParams: { portfolioID: id, portfolioName: name },
        })
        .json<Portfolio>()
        .then((data) => {
          setPortfolios((prev) =>
            prev.map((portfolio) => (portfolio._id.toString() === id ? data : portfolio))
          )
          // If the updated portfolio is currently set as the active portfolio
          // in the account, update the portfolio in the accountInfo state too.
          setAccountInfo((prev) => {
            if (prev?.portfolio._id === data._id) {
              return { ...prev, portfolio: data }
            }
            return prev
          })
          return data
        })
        .catch((err) => err.response.json().then((error: ErrResp) => Promise.reject(error.error))),
    [setAccountInfo]
  )

  return { portfolios, createPortfolio, updatePortfolio }
}
