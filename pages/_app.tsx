import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { Web3ReactProvider } from '@web3-react/core'
import { ethers } from 'ethers'
import { ExternalProvider, JsonRpcFetchFunc } from '@ethersproject/providers'
import React from 'react'
import { AccountContext, useAccount } from '../hooks/useAccount'
import Head from 'next/head'
import { Navbar } from '../components/Navbar'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { TEN_SEC_MS } from '../utils/constants'

function getLibrary(provider: ExternalProvider | JsonRpcFetchFunc) {
  return new ethers.providers.Web3Provider(provider)
}

function MyApp({ Component, pageProps }: AppProps) {
  const account = useAccount()
  return (
    <Web3ReactProvider getLibrary={getLibrary}>
      <AccountContext.Provider value={account}>
        <Head>
          <title>Virtual Trading Platform</title>
          <meta name="description" content="Curious Addys' Trading Club" />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <Navbar />
        <Component {...pageProps} />
        <ToastContainer
          position={'bottom-right'}
          autoClose={TEN_SEC_MS}
          newestOnTop={true}
          theme={'colored'}
        />
      </AccountContext.Provider>
    </Web3ReactProvider>
  )
}

export default MyApp
