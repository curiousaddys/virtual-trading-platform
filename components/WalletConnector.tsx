import { useWeb3React } from '@web3-react/core'
import { InjectedConnector } from '@web3-react/injected-connector'
import React, { useEffect, useState } from 'react'
import { SIGNATURE_TEXT } from '../utils/constants'
import { useAccountContext } from '../hooks/useAccount'

// TODO: Add connector for WalletConnect instead of only allowing MetaMask.
const injected = new InjectedConnector({})

export const isEthereumObjectOnWindow = (): boolean => !!(window as any)?.ethereum

export const WalletConnector: React.VFC = () => {
  const { account, library, activate, deactivate } = useWeb3React()
  const { login, logout, accountInfo, isLoaded } = useAccountContext()
  const [ethObjectExists, setEthObjectExists] = useState<boolean>(false)

  // Whenever web3 account is set, ask the user to sign.
  useEffect(() => {
    if (account && !accountInfo) {
      ;(async () => {
        const signer = await library.getSigner(account)
        const signature = await signer.signMessage(SIGNATURE_TEXT + account)
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
    if (isEthereumObjectOnWindow()) {
      setEthObjectExists(true)
    }
  }, [])

  return !isLoaded ? (
    <></>
  ) : accountInfo ? (
    <button
      onClick={deactivateWallet}
      className="py-2 px-4 m-1 text-lg font-bold text-white rounded-lg bg-blue-600 hover:bg-blue-800"
    >
      Logout
    </button>
  ) : ethObjectExists ? (
    <button
      onClick={activateWallet}
      className="py-2 px-4 m-1 text-lg font-bold text-white rounded-lg bg-blue-600 hover:bg-blue-800"
    >
      Login with MetaMask
    </button>
  ) : (
    <button
      onClick={() => window.open('https://metamask.io/download.html', '_blank')}
      className="py-2 px-4 m-1 text-lg font-bold text-white rounded-lg bg-blue-600 hover:bg-blue-800"
    >
      Get MetaMask to Login
    </button>
  )
}
