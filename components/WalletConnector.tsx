import { useWeb3React } from '@web3-react/core'
import { InjectedConnector } from '@web3-react/injected-connector'
import React, { useContext, useEffect, useState } from 'react'
import { SIGNATURE_TEXT } from '../utils/constants'
import { UserContext } from '../hooks/useUser'
import { isBrowserCompatible, isEthereumObjectOnWindow } from '../utils/browser'

const injected = new InjectedConnector({})

type MetaMaskBrowserStatusState = null | 'supported' | 'unsupported' | 'ready'

export const WalletConnector: React.FC = () => {
  const { account, library, activate, deactivate } = useWeb3React()
  const { user, setUser } = useContext(UserContext)
  const [metaMaskBrowserStatus, setMetaMaskBrowserStatus] =
    useState<MetaMaskBrowserStatusState>(null)

  // Whenever web3 account is set, set the logged-in user.
  useEffect(() => {
    if (account) {
      ;(async () => {
        const signer = await library.getSigner(account)
        const signature = await signer.signMessage(SIGNATURE_TEXT + account)
        setUser({ address: account, signature })
      })()
    }
  }, [account, library, setUser])

  // Activate wallet.
  const login = async () => {
    try {
      await activate(injected, undefined, true)
    } catch (err) {
      console.error(err)
    }
  }

  // Deactivate wallet & clear the logged-in user.
  const logout = async () => {
    try {
      deactivate()
      setUser(null)
    } catch (err) {
      console.error(err)
    }
  }

  // Check browser on first client-side render to avoid next.js hydration errors.
  useEffect(() => {
    if (!isBrowserCompatible()) {
      return setMetaMaskBrowserStatus('unsupported')
    }
    if (!isEthereumObjectOnWindow()) {
      return setMetaMaskBrowserStatus('supported')
    }
    setMetaMaskBrowserStatus('ready')
  }, [])

  return (
    <>
      {user && (
        <button
          onClick={logout}
          className="py-2 px-4 m-1 text-lg font-bold text-white rounded-lg bg-blue-600 hover:bg-blue-800"
        >
          Logout
        </button>
      )}
      {!user && metaMaskBrowserStatus === 'ready' && (
        <button
          onClick={login}
          className="py-2 px-4 m-1 text-lg font-bold text-white rounded-lg bg-blue-600 hover:bg-blue-800"
        >
          Login with MetaMask
        </button>
      )}
      {!user && metaMaskBrowserStatus === 'supported' && (
        <button
          onClick={() => window.open('https://metamask.io/download.html', '_blank')}
          className="py-2 px-4 m-1 text-lg font-bold text-white rounded-lg bg-blue-600 hover:bg-blue-800"
        >
          Install MetaMask to Login
        </button>
      )}
      {metaMaskBrowserStatus === 'unsupported' && (
        // TODO: make a small modal w/ more info re: supported browser
        <button
          className="py-2 px-4 m-1 text-lg font-bold text-white rounded-lg bg-blue-600 hover:bg-blue-800"
          onClick={() => {
            if (window)
              window.alert(
                'Sorry, your browser does not support MetaMask, which is required to login.'
              )
          }}
        >
          Browser unsupported
        </button>
      )}
    </>
  )
}
