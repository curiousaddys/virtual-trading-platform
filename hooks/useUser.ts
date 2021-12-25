import React, { useEffect, useState } from 'react'
import { useCookies } from 'react-cookie'
import { ACCOUNT_COOKIE } from '../utils/constants'

interface User {
  address: string
  signature: string
}

export type UserState = User | null

// useUser holds the UserState and handles reading/persisting it from/to a cookie.
export const useUser = () => {
  const [user, setUser] = useState<UserState>(null)
  const [cookies, setCookie, removeCookie] = useCookies([ACCOUNT_COOKIE])

  // On initial render, read from cookie if it's set.
  useEffect(() => {
    if (cookies.catc_itp_account) {
      setUser(cookies.catc_itp_account)
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

  return { user, setUser }
}

export const UserContext = React.createContext<{
  user: UserState
  setUser: (user: UserState) => void
}>({
  user: null,
  setUser: (user: UserState) => {},
})
