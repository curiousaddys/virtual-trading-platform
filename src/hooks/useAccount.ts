import ky from 'ky'
import React, { useContext, useEffect, useState } from 'react'

import type { AccountWithPortfolio } from '../pages/api/account'

export const useAccount = () => {
  const [accountInfo, setAccountInfo] = useState<AccountWithPortfolio | null>(null)
  const [accountError, setAccountError] = useState<unknown>(null)
  const [isLoaded, setIsLoaded] = useState<boolean>(false)

  const fetchAccountInfo = async () => {
    try {
      const data = await ky.get('/api/account').json<AccountWithPortfolio>()
      setAccountInfo(data)
    } catch {
      console.log('Could not fetch account info. Probably because user is not logged in.')
    } finally {
      setIsLoaded(true)
    }
  }

  useEffect(() => {
    // Try to fetch account info on initial load (hoping that cookie is set).
    fetchAccountInfo()
  }, [])

  const login = async (address: string, signature: string) => {
    try {
      const data = await ky
        .post('/api/auth/login', { searchParams: { address, signature } })
        .json<AccountWithPortfolio>()
      setAccountInfo(data)
    } catch (err) {
      setAccountError(err)
    }
  }

  const logout = async () => {
    try {
      await ky.post('/api/auth/logout')
      setAccountInfo(null)
    } catch (err) {
      setAccountError(err)
    }
  }

  return {
    login,
    logout,
    accountInfo,
    setAccountInfo,
    accountError,
    isLoaded,
  }
}

export const AccountContext = React.createContext<ReturnType<typeof useAccount>>({
  login: async () => void undefined,
  logout: async () => void undefined,
  accountInfo: null,
  setAccountInfo: () => void undefined,
  accountError: null,
  isLoaded: false,
})

export const useAccountContext = () => useContext(AccountContext)
