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
import { PricesContext, usePrices } from '../hooks/usePrices'
import { BuySellModalContext, useBuySellModal } from '../hooks/useBuySellModal'
import { BuySellModal } from '../components/BuySellModal'
import 'react-loader-spinner/dist/loader/css/react-spinner-loader.css'
import { Partytown } from '@builder.io/partytown/react'

function getLibrary(provider: ExternalProvider | JsonRpcFetchFunc) {
  return new ethers.providers.Web3Provider(provider)
}

function MyApp({ Component, pageProps }: AppProps) {
  const account = useAccount()
  const prices = usePrices()
  const buySellModalState = useBuySellModal()
  return (
    <Web3ReactProvider getLibrary={getLibrary}>
      <AccountContext.Provider value={account}>
        <PricesContext.Provider value={prices}>
          <BuySellModalContext.Provider value={buySellModalState}>
            <Head>
              <title>Virtual Trading Platform</title>
              <meta name="description" content="Curious Addys' Trading Club" />
              <link rel="icon" href="/favicon.ico" />
              <Partytown
                debug={process.env.NODE_ENV !== 'production'}
                forward={['dataLayer.push']}
              />
              {/* eslint-disable-next-line @next/next/next-script-for-ga */}
              <script
                id="google-tag-manager"
                type="text/partytown"
                dangerouslySetInnerHTML={{
                  __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                  new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                  j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                  'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                  })(window,document,'script','dataLayer','GTM-WP2MZ89');`,
                }}
              />
            </Head>
            <Navbar />
            <Component {...pageProps} />
            <BuySellModal />
            <ToastContainer
              position={'bottom-right'}
              autoClose={TEN_SEC_MS}
              newestOnTop={true}
              theme={'colored'}
            />
          </BuySellModalContext.Provider>
        </PricesContext.Provider>
      </AccountContext.Provider>
    </Web3ReactProvider>
  )
}

export default MyApp
