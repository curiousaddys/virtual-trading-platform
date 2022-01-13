import { useCallback, useEffect, useState } from 'react'
import { Portfolio } from '../db/portfolios'
import { useAccountContext } from './useAccount'
import ky from 'ky'
import { toast } from 'react-toastify'

const fetchPortfolioList = () => ky.get('/api/portfolios/list').json<Portfolio[]>()

export const usePortfolios = () => {
  const { accountInfo, setAccountInfo } = useAccountContext()
  const [portfolios, setPortfolios] = useState<Portfolio[]>([] as Portfolio[])

  // on load, get all portfolios
  useEffect(() => {
    if (!accountInfo) return

    fetchPortfolioList()
      .then(setPortfolios)
      .catch((err) => {
        console.error(err)
        toast('Error finding portfolios!', { type: 'error' })
      })
  }, [accountInfo])

  const createPortfolio = useCallback(async (name: string = 'Untitled Portfolio') => {
    try {
      const data = await ky
        .post('/api/portfolios/create', { searchParams: { portfolioName: name } })
        .json<Portfolio>()
      setPortfolios((prev) => [...prev, data])
      return data
    } catch (err) {
      // TODO: If the server gave a reason, display it to the user (similar to when saving an account).
      toast('Error creating portfolio!', { type: 'error' })
    }
  }, [])

  const updatePortfolio = useCallback(
    async (id: string, name: string) => {
      try {
        const data = await ky
          .post('/api/portfolios/update', {
            searchParams: { portfolioID: id, portfolioName: name },
          })
          .json<Portfolio>()
        setPortfolios((prev) =>
          prev.map((portfolio) => (portfolio._id.toString() === id ? data : portfolio))
        )
        // If the updated portfolio is currently set as the active portfolio
        // in the account, update the portfolio in the accountInfo state too.
        setAccountInfo((prev) => {
          if (prev?.portfolio._id === data._id) {
            return { ...prev!, portfolio: data }
          }
          return prev
        })
        return data
      } catch (err) {
        // TODO: If the server gave a reason, display it to the user (similar to when saving an account).
        toast('Error updating portfolio!', { type: 'error' })
      }
    },
    [setAccountInfo]
  )

  return { portfolios, createPortfolio, updatePortfolio }
}
