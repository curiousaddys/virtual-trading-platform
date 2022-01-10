import React, { useContext, useState } from 'react'
import ky from 'ky'
import { Account } from '../db/accounts'

export const useAccount = () => {
  const [accountInfo, setAccountInfo] = useState<Account | null>(null)
  const [accountError, setAccountError] = useState<any>(null)

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
  }
}

export const AccountContext = React.createContext<{
  login: (address: string, signature: string) => Promise<void>
  logout: () => Promise<void>
  accountInfo: Account | null
  setAccountInfo: (account: Account | null) => void
  updateAccount: (nickname: string) => Promise<void>
  accountError: any
}>({
  login: async (address: string, signature: string) => {},
  logout: async () => {},
  accountInfo: null,
  setAccountInfo: () => {},
  updateAccount: async (nickname: string) => {},
  accountError: null,
})

export const useAccountContext = () => useContext(AccountContext)
