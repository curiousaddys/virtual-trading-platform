import { useWeb3React } from '@web3-react/core'
import { InjectedConnector } from '@web3-react/injected-connector'
import React, { useEffect, useState } from 'react'
import { SIGNATURE_TEXT } from '../utils/constants'
import { useAccountContext } from '../hooks/useAccount'
import { isBrowserCompatible, isEthereumObjectOnWindow } from '../utils/browser'

const injected = new InjectedConnector({})

type MetaMaskBrowserStatusState = null | 'supported' | 'unsupported' | 'ready'

export const WalletConnector: React.VFC = () => {
  const { account, library, activate, deactivate } = useWeb3React()
  const { login, logout, accountInfo } = useAccountContext()
  const [metaMaskBrowserStatus, setMetaMaskBrowserStatus] =
    useState<MetaMaskBrowserStatusState>(null)

  // Whenever web3 account is set, ask the user to sign.
  useEffect(() => {
    if (account && !accountInfo) {
      ;(async () => {
        const signer = await library.getSigner(account)
        const signature = await signer.signMessage(SIGNATURE_TEXT + account)
        // TODO: submit signature to backend to verify (using UserContext)
        await login(account, signature)
      })()
    }
  }, [account, accountInfo, library, login])

  // Activate wallet.
  const activateWallet = async () => {
    try {
      await activate(injected, undefined, true)
    } catch (err) {
      console.error(err)
    }
  }

  // Deactivate wallet & clear the logged-in user.
  const deactivateWallet = async () => {
    try {
      deactivate()
      await logout()
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
      {accountInfo && (
        <button
          onClick={deactivateWallet}
          className="py-2 px-4 m-1 text-lg font-bold text-white rounded-lg bg-blue-600 hover:bg-blue-800"
        >
          Logout
        </button>
      )}
      {!accountInfo && metaMaskBrowserStatus === 'ready' && (
        <button
          onClick={activateWallet}
          className="py-2 px-4 m-1 text-lg font-bold text-white rounded-lg bg-blue-600 hover:bg-blue-800"
        >
          Login with MetaMask
        </button>
      )}
      {!accountInfo && metaMaskBrowserStatus === 'supported' && (
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
