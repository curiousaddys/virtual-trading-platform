import React, { useContext, useEffect, useState } from 'react'
import ky from 'ky'
import { Account } from '../db/accounts'

export const useAccount = () => {
  const [accountInfo, setAccountInfo] = useState<Account | null>(null)
  const [accountError, setAccountError] = useState<any>(null)
  const [isLoaded, setIsLoaded] = useState<boolean>(false)

  const fetchAccountInfo = async () => {
    try {
      const data = await ky.get('/api/account').json<Account>()
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
        .json<Account>()
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

  const updateAccount = async (nickname: string) => {
    try {
      const data = await ky.post('/api/account', { searchParams: { nickname } }).json<Account>()
      setAccountInfo(data)
    } catch (err) {
      setAccountError(err)
    }
  }

  return {
    login,
    logout,
    accountInfo,
    setAccountInfo,
    updateAccount,
    accountError,
    isLoaded,
  }
}

export const AccountContext = React.createContext<{
  login: (address: string, signature: string) => Promise<void>
  logout: () => Promise<void>
  accountInfo: Account | null
  setAccountInfo: (account: Account | null) => void
  updateAccount: (nickname: string) => Promise<void>
  accountError: any
  isLoaded: boolean
}>({
  login: async (address: string, signature: string) => {},
  logout: async () => {},
  accountInfo: null,
  setAccountInfo: () => {},
  updateAccount: async (nickname: string) => {},
  accountError: null,
  isLoaded: false,
})

export const useAccountContext = () => useContext(AccountContext)
