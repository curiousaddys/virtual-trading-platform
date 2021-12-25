import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { Web3ReactProvider } from '@web3-react/core'
import { ethers } from 'ethers'
import { ExternalProvider, JsonRpcFetchFunc } from '@ethersproject/providers'
import { CookiesProvider } from 'react-cookie'
import React from 'react'
import { UserContext, useUser } from '../hooks/useUser'
import { WalletConnector } from '../components/WalletConnector'

function getLibrary(provider: ExternalProvider | JsonRpcFetchFunc) {
  return new ethers.providers.Web3Provider(provider)
}

function MyApp({ Component, pageProps }: AppProps) {
  const userState = useUser()
  return (
    <Web3ReactProvider getLibrary={getLibrary}>
      <CookiesProvider>
        <UserContext.Provider value={userState}>
          <WalletConnector />
          <Component {...pageProps} />
        </UserContext.Provider>
      </CookiesProvider>
    </Web3ReactProvider>
  )
}

export default MyApp
