import { NextPage } from 'next'
import React, { useEffect, useMemo, useState } from 'react'
import ky from 'ky'
import { useAccountContext } from '../../hooks/useAccount'
import Image from 'next/image'
import { Transaction } from '../../db/transactions'
import { usePriceHistory } from '../../hooks/usePriceHistory'
import { useCoinDetails } from '../../hooks/useCoinDetails'
import { toast } from 'react-toastify'
import { useRouter } from 'next/router'
import { SUPPORTED_COINS } from '../../utils/constants'
import { Holding } from '../../db/portfolios'
import { PageWrapper } from '../../components/common/PageWrapper'
import { formatFloat, formatUSD, stripHtmlTags } from '../../utils/format'
import { Chart } from '../../components/common/Chart'
import { DataCard } from '../../components/common/DataCard'
import Link from 'next/link'
import dayjs from 'dayjs'
import { useBuySellModalContext } from '../../hooks/useBuySellModal'
import { BuySellAction } from '../../components/BuySellModal'

const Details: NextPage = () => {
  const router = useRouter()
  const [coin, setCoin] = useState<string>('')
  const [coinInvalid, setCoinInvalid] = useState<boolean>(false)
  const { coinDetails, coinDetailsLoading, coinDetailsError } = useCoinDetails(coin)
  const { priceHistory, priceHistoryLoading, priceHistoryError, setDateRange } =
    usePriceHistory(coin)
  const { accountInfo } = useAccountContext()
  const [showAllTransactions, setShowAllTransactions] = useState<boolean>(false)
  const { openBuyModal, openSellModal } = useBuySellModalContext()

  const holding = useMemo<Holding | undefined>(() => {
    if (!accountInfo) return
    return accountInfo.portfolio.holdings.find((h) => h.currency === coin)
  }, [accountInfo, coin])
  const currentBalanceUSD = useMemo(
    () => (holding?.amount ?? 0) * (coinDetails?.market_data.current_price.usd ?? 0),
    [coinDetails?.market_data.current_price.usd, holding?.amount]
  )

  const [transactionHistory, setTransactionHistory] = useState<Transaction[] | null>(null)
  const priceHistoryForTransactionHistory = usePriceHistory(coin) // SWR hook uses cache, so this doesn't actually double the API calls.

  const transactionHistoryChartData = useMemo(() => {
    if (
      !priceHistoryForTransactionHistory.priceHistory ||
      !transactionHistory?.length ||
      !coinDetails
    )
      return []
    const txnHistoryAsc = transactionHistory.slice().reverse()
    let [runningBalance, txnNum, txnDate] = [0, 0, new Date(txnHistoryAsc[0].timestamp).getTime()]
    return priceHistoryForTransactionHistory.priceHistory.prices.map((price) => {
      while (txnDate <= price[0] && txnNum < txnHistoryAsc.length) {
        runningBalance +=
          txnHistoryAsc[txnNum].action === BuySellAction.Buy
            ? txnHistoryAsc[txnNum].amountCoin
            : -txnHistoryAsc[txnNum].amountCoin
        txnNum++
        if (txnNum < txnHistoryAsc.length)
          txnDate = new Date(txnHistoryAsc[txnNum].timestamp).getTime()
      }
      return [price[0], runningBalance * price[1]]
    })
  }, [priceHistoryForTransactionHistory.priceHistory, transactionHistory, coinDetails])

  useEffect(() => {
    const coinQuery = router.query.coin as string
    if (!coinQuery) return
    if (!(SUPPORTED_COINS as ReadonlyArray<string>).includes(coinQuery)) {
      setCoinInvalid(true)
      return
    }
    setCoin(coinQuery)
  }, [router.query])

  // Fetch transaction data if user is logged in & whenever account data changes.
  useEffect(() => {
    if (!accountInfo || !coin) return

    const fetchTransactionHistory = async () => {
      try {
        const results = await ky
          .get('/api/transactions', {
            searchParams: {
              coin: coin,
              portfolioID: accountInfo.portfolio._id.toString(),
            },
          })
          .json<Transaction[]>()
        setTransactionHistory(results)
      } catch (err) {
        console.error(err)
        toast('Error finding transactions!', { type: 'error' })
      }
    }
    fetchTransactionHistory()
  }, [accountInfo, coin])

  // Handle errors from data fetching hooks.
  useEffect(() => {
    if (coinDetailsError) {
      console.error(coinDetailsError)
      toast('Error loading coin info!', { type: 'error' })
    }
    if (priceHistoryError) {
      console.error(priceHistoryError)
      toast('Error loading price history!', { type: 'error' })
    }
  }, [coinDetailsError, priceHistoryError])

  return (
    <PageWrapper title={coinDetails?.name}>
      {coinInvalid ? (
        <div className="text-center">Invalid coin</div>
      ) : coinDetailsLoading ? (
        <div className="text-center">Loading...</div>
      ) : coinDetails ? (
        <>
          <section className="my-5 flex items-center justify-between">
            <div className="flex items-center justify-between">
              <Image
                src={coinDetails.image.large}
                height={100}
                width={100}
                alt={coinDetails.symbol}
              />
              <h1 className="text-4xl text-black font-semibold px-5">
                {coinDetails.name} ({coinDetails.symbol.toUpperCase()})
              </h1>
            </div>
            {accountInfo ? (
              <button
                className={`px-4 py-2 bg-green-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-300 grow max-w-xs mx-2 w-[75px]`}
                onClick={() => {
                  openBuyModal({ value: coinDetails.id, label: coinDetails.name })
                }}
              >
                Buy
              </button>
            ) : null}
            {holding?.amount ? (
              <button
                className={`px-4 py-2 bg-green-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-300 grow max-w-xs mx-2  w-[75px]`}
                onClick={() => {
                  openSellModal({ value: coinDetails.id, label: coinDetails.name })
                }}
              >
                Sell
              </button>
            ) : null}
          </section>

          <section className="rounded-2xl border-2 border-gray-200 p-4 bg-white mt-9 mb-6">
            <h2 className="text-5xl text-black font-semibold m-2 mb-5">
              {formatUSD(coinDetails.market_data.current_price.usd)}
            </h2>

            <Chart
              data={priceHistory?.prices || []}
              onDateRangeOptionChange={setDateRange}
              dateDataKey={'0'}
              dateIsUnixtime={true}
              valueDataKey={'1'}
              valueLabel={'Price'}
              placeholder={priceHistoryLoading ? 'Loading...' : 'No data to display.'}
            />

            <div className="grid grid-cols-2 md:grid-cols-4 my-5">
              <DataCard
                title={'Last Hour'}
                value={coinDetails.market_data.price_change_percentage_1h_in_currency.usd}
                format={'percent'}
              />

              <DataCard
                title={'Last 24 Hours'}
                value={coinDetails.market_data.price_change_percentage_24h_in_currency.usd}
                format={'percent'}
              />

              <DataCard
                title={'Last 7 Days'}
                value={coinDetails.market_data.price_change_percentage_7d_in_currency.usd}
                format={'percent'}
              />

              <DataCard
                title={'Last 30 Days'}
                value={coinDetails.market_data.price_change_percentage_30d_in_currency.usd}
                format={'percent'}
              />
            </div>

            <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
              <DataCard
                title={'All Time High'}
                value={coinDetails.market_data.ath.usd}
                format={'usd'}
              />

              <DataCard title={'Popularity'} value={`#${coinDetails.market_cap_rank}`} />

              <DataCard
                title={'Market Cap'}
                value={coinDetails.market_data.market_cap.usd}
                format={'usdNoCents'}
              />

              <DataCard
                title={'Volume'}
                value={coinDetails.market_data.total_volume.usd}
                format={'usdNoCents'}
              />

              <DataCard
                title={'Circulating Supply'}
                value={coinDetails.market_data.circulating_supply}
                format={'int'}
              />
            </div>
          </section>

          {accountInfo && transactionHistory && transactionHistory.length > 0 && (
            <>
              <h2 className="text-2xl text-gray-800 font-semibold ml-1">Your Wallet</h2>
              <section className="rounded-2xl border-2 border-gray-200 p-4 bg-white mt-3 mb-6">
                <Chart
                  data={transactionHistoryChartData}
                  dateDataKey={'0'}
                  valueDataKey={'1'}
                  valueLabel={'Value'}
                  onDateRangeOptionChange={priceHistoryForTransactionHistory.setDateRange}
                  placeholder={
                    priceHistoryForTransactionHistory.priceHistoryLoading
                      ? 'Loading...'
                      : 'No data to display.'
                  }
                  minValue={0}
                />
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                  <DataCard
                    title={'Current Balance'}
                    value={`${formatFloat(
                      holding?.amount ?? 0,
                      16
                    )} ${coinDetails.symbol.toUpperCase()}`}
                  />

                  <DataCard title={'Current Value'} value={currentBalanceUSD} format={'usd'} />

                  <DataCard
                    title={'Total Profit/Loss ($)'}
                    value={
                      (holding?.amount ?? 0) * coinDetails.market_data.current_price.usd -
                      (holding?.amount ?? 0) * (holding?.avgBuyCost ?? 0)
                    }
                    format={'usd'}
                  />

                  <DataCard
                    title={'Total Profit/Loss (%)'}
                    value={
                      (((holding?.amount ?? 0) * coinDetails.market_data.current_price.usd -
                        (holding?.amount ?? 0) * (holding?.avgBuyCost ?? 0)) /
                        ((holding?.amount ?? 0) * (holding?.avgBuyCost ?? 0))) *
                      100
                    }
                    format={'percent'}
                  />
                </div>
              </section>

              <h2 className="text-2xl text-gray-800 font-semibold ml-1">Your Transactions</h2>
              <section className="rounded-2xl border-2 border-gray-200 p-4 bg-white mt-3 mb-6">
                {transactionHistory.map((transaction, i) =>
                  i > 4 && !showAllTransactions ? null : (
                    <div key={transaction._id.toString()} className={`grid grid-cols-2 py-3`}>
                      <div className="grid grid-cols-1 md:grid-cols-2">
                        <div className="text-gray-800">
                          {dayjs(transaction.timestamp).format('MMM D, YYYY h:mm A')}
                        </div>
                        <div className="font-medium capitalize text-left md:text-center">
                          {transaction.action}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 text-right">
                        <div className="text-gray-800 font-medium">
                          {formatFloat(transaction.amountUSD / transaction.exchangeRateUSD)}{' '}
                          {coinDetails?.symbol.toUpperCase()}
                        </div>
                        <div className="text-gray-700">{formatUSD(transaction.amountUSD)}</div>
                      </div>
                    </div>
                  )
                )}
                {transactionHistory.length > 5 && (
                  <div className="text-center">
                    <button
                      className="w-100 text-center text-blue-500 cursor-pointer"
                      onClick={() => setShowAllTransactions(!showAllTransactions)}
                    >
                      Show {showAllTransactions ? 'less' : 'more'}
                    </button>
                  </div>
                )}
              </section>
            </>
          )}
          <h2 className="text-2xl text-gray-800 font-semibold ml-1">About {coinDetails.name}</h2>
          <section className="rounded-2xl border-2 border-gray-200 p-4 bg-white mt-3">
            <p
              dangerouslySetInnerHTML={{
                __html: stripHtmlTags(coinDetails.description.en),
              }}
            />
            {coinDetails.links?.homepage?.length && (
              <p className="mt-5">
                <Link href={coinDetails.links.homepage[0]} passHref>
                  <a className="text-blue-500" target="_blank" rel="noreferrer">
                    Official Website
                  </a>
                </Link>
              </p>
            )}
          </section>
        </>
      ) : null}
    </PageWrapper>
  )
}

export default Details
