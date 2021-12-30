import React, { useEffect, useState } from 'react'
import { useCookies } from 'react-cookie'
import { ACCOUNT_COOKIE } from '../utils/constants'
import ky from 'ky'
import { Account } from '../db/accounts'

interface User {
  address: string
  signature: string
}

export type UserState = User | null

// useUser holds the UserState and handles reading/persisting it from/to a cookie.
export const useUser = () => {
  const [user, setUser] = useState<UserState>(null)
  const [accountInfo, setAccountInfo] = useState<Account | null>(null)
  const [cookies, setCookie, removeCookie] = useCookies([ACCOUNT_COOKIE])

  // On initial render, read from cookie if it's set.
  useEffect(() => {
    if (cookies.catc_vtp_account) {
      setUser(cookies.catc_vtp_account)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // When the user changes, set or remove the cookie.
  useEffect(() => {
    if (!user) {
      removeCookie(ACCOUNT_COOKIE)
      return
    }
    setCookie(ACCOUNT_COOKIE, user)
  }, [removeCookie, setCookie, user])

  // When user changes, fetch account info.
  useEffect(() => {
    if (!user) {
      setAccountInfo(null)
      return
    }
    ;(async () => {
      // TODO: handle errors
      const data = await ky.get('/api/account').json<Account>()
      // TODO(jh): remove logging
      console.log(data)
      setAccountInfo(data)
    })()
  }, [user])

  return { user, setUser, accountInfo, setAccountInfo }
}

export const UserContext = React.createContext<{
  user: UserState
  setUser: (user: UserState) => void
  accountInfo: Account | null
  setAccountInfo: (account: Account) => void
}>({
  user: null,
  setUser: (user: UserState) => {},
  accountInfo: null,
  setAccountInfo: (account: Account) => {},
})
