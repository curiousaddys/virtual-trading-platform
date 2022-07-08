import { ExternalProvider, JsonRpcFetchFunc } from '@ethersproject/providers'
import { Web3ReactProvider } from '@web3-react/core'
import { ethers } from 'ethers'
import type { AppProps } from 'next/app'
import Script from 'next/script'
import 'react-loader-spinner/dist/loader/css/react-spinner-loader.css'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { BuySellModal } from '../components/BuySellModal'
import { MetaTags } from '../components/MetaTags'
import { Navbar } from '../components/Navbar'
import { AccountContext, useAccount } from '../hooks/useAccount'
import { BuySellModalContext, useBuySellModal } from '../hooks/useBuySellModal'
import { PricesContext, usePrices } from '../hooks/usePrices'
import '../styles/globals.css'
import { TEN_SEC_MS } from '../utils/constants'

function getLibrary(provider: ExternalProvider | JsonRpcFetchFunc) {
  return new ethers.providers.Web3Provider(provider)
}

const GTM_ID = 'GTM-WP2MZ89'

function MyApp({ Component, pageProps }: AppProps) {
  const account = useAccount()
  const prices = usePrices()
  const buySellModalState = useBuySellModal()

  let children = (
    <>
      <Script id="gtm">
        {`
          (function(w,d,s,l,i){
            w[l]=w[l]||[];
            w[l].push({'gtm.start': new Date().getTime(),event:'gtm.js'});
            var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
            j.async=true;
            j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
            f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${GTM_ID}');
        `}
      </Script>
      <MetaTags />

      <Navbar />
      <Component {...pageProps} />

      <BuySellModal />
      <ToastContainer
        position={'bottom-right'}
        autoClose={TEN_SEC_MS}
        newestOnTop={true}
        theme={'colored'}
      />
    </>
  )
  children = (
    <BuySellModalContext.Provider value={buySellModalState}>
      {children}
    </BuySellModalContext.Provider>
  )
  children = <PricesContext.Provider value={prices}>{children}</PricesContext.Provider>
  children = <AccountContext.Provider value={account}>{children}</AccountContext.Provider>
  children = <Web3ReactProvider getLibrary={getLibrary}>{children}</Web3ReactProvider>

  return children
}

export default MyApp
