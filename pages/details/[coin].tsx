import { NextPage } from 'next'
import React, { useEffect, useMemo, useState } from 'react'
import ky from 'ky'
import { formatFloat, formatInt, formatUSD, stripHtmlTags } from '../../utils/format'
import dayjs from 'dayjs'
import Link from 'next/link'
import { BuySellAction, BuySellModal } from '../../components/BuySellModal'
import { useAccountContext } from '../../hooks/useAccount'
import Image from 'next/image'
import { PrettyPercent } from '../../components/common/PrettyPercent'
import { Transaction } from '../../db/transactions'
import { usePriceHistory } from '../../hooks/usePriceHistory'
import { useCoinDetails } from '../../hooks/useCoinDetails'
import { toast } from 'react-toastify'
import { useRouter } from 'next/router'
import { SUPPORTED_COINS } from '../../utils/constants'
import Head from 'next/head'
import { Holding } from '../../db/portfolios'
import { Chart } from '../../components/common/Chart'

const Details: NextPage = () => {
  // TODO: show some loading spinner or skeleton if loading
  const router = useRouter()
  const [coin, setCoin] = useState<string>('')
  const [coinInvalid, setCoinInvalid] = useState<boolean>(false)
  const { coinDetails, coinDetailsLoading, coinDetailsError } = useCoinDetails(coin)
  // TODO: show some loading spinner or skeleton if loading
  const { priceHistory, priceHistoryLoading, priceHistoryError, setDateRange } =
    usePriceHistory(coin)
  const { accountInfo } = useAccountContext()
  const [transactionHistory, setTransactionHistory] = useState<Transaction[] | null>(null)
  const [showAllTransactions, setShowAllTransactions] = useState<boolean>(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [buySellAction, setBuySellAction] = useState<BuySellAction>(BuySellAction.Buy)

  const holding = useMemo<Holding | undefined>(() => {
    if (!accountInfo) return
    return accountInfo.portfolio.holdings.find((h) => h.currency === coin)
  }, [accountInfo, coin])

  useEffect(() => {
    const coinQuery = router.query.coin as string
    if (!coinQuery) return
    if (!(SUPPORTED_COINS as ReadonlyArray<string>).includes(coinQuery)) {
      setCoinInvalid(true)
      return
    }
    setCoin(coinQuery)
  }, [router.query])

  const openBuySellModal = (action: BuySellAction) => {
    if (!coinDetails) return
    setBuySellAction(action)
    setModalOpen(true)
  }

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
    <>
      <Head>
        <title>{coinDetails?.name ?? 'Virtual Trading Platform'}</title>
      </Head>
      <div className="container justify-center mx-auto my-10 px-2 sm:px-5 max-w-screen-lg">
        {coinDetailsLoading && !coinInvalid && <div className="text-center">Loading...</div>}
        {coinInvalid && <div className="text-center">Invalid coin</div>}
        {coinDetails && (
          <>
            {modalOpen && (
              <BuySellModal
                currency={{ value: coinDetails.id, label: coinDetails.name }}
                onClose={() => setModalOpen(false)}
                action={buySellAction}
              />
            )}
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
              {accountInfo && (
                <button
                  className="grow max-w-xs px-4 py-2 mx-2 bg-green-500 text-white text-base font-medium rounded-md shadow-sm hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-300"
                  onClick={() => openBuySellModal(BuySellAction.Buy)}
                >
                  Buy
                </button>
              )}
              {!!accountInfo?.portfolio.holdings.find((holding) => holding.currency === coin)
                ?.amount && (
                <button
                  className="grow max-w-xs px-4 py-2 mx-2 bg-green-500 text-white text-base font-medium rounded-md shadow-sm hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-300"
                  onClick={() => openBuySellModal(BuySellAction.Sell)}
                >
                  Sell
                </button>
              )}
            </section>

            <section className="rounded-2xl border-2 border-gray-200 p-4 bg-white mt-9 mb-6">
              <h2 className="text-5xl text-black font-semibold m-2 mb-5">
                {formatUSD(coinDetails.market_data.current_price.usd)}
              </h2>

              <Chart
                isLoading={priceHistoryLoading}
                data={priceHistory?.prices || []}
                onDateRangeOptionChange={setDateRange}
                dateDataKey={'0'}
                dateIsUnixtime={true}
                valueDataKey={'1'}
                valueLabel={'Price'}
              />

              <div className="grid grid-cols-2 md:grid-cols-4 my-5">
                <DataCard title={'Last Hour'}>
                  <PrettyPercent
                    value={coinDetails.market_data.price_change_percentage_1h_in_currency.usd}
                  />
                </DataCard>

                <DataCard title={'Last 24 Hours'}>
                  <PrettyPercent
                    value={coinDetails.market_data.price_change_percentage_24h_in_currency.usd}
                  />
                </DataCard>

                <DataCard title={'Last 7 Days'}>
                  <PrettyPercent
                    value={coinDetails.market_data.price_change_percentage_7d_in_currency.usd}
                  />
                </DataCard>

                <DataCard title={'Last 30 Days'}>
                  <PrettyPercent
                    value={coinDetails.market_data.price_change_percentage_30d_in_currency.usd}
                  />
                </DataCard>
              </div>

              <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                <DataCard title={'All Time High'}>
                  {formatUSD(coinDetails.market_data.ath.usd)}
                </DataCard>
                <DataCard title={'Popularity'}>#{coinDetails.market_cap_rank}</DataCard>
                <DataCard title={'Market Cap'}>
                  {formatUSD(coinDetails.market_data.market_cap.usd, true)}
                </DataCard>
                <DataCard title={'Volume'}>
                  {formatUSD(coinDetails.market_data.total_volume.usd, true)}
                </DataCard>
                <DataCard title={'Circulating Supply'}>
                  {formatInt(coinDetails.market_data.circulating_supply)}
                </DataCard>
              </div>
            </section>

            {accountInfo && transactionHistory && transactionHistory.length > 0 && (
              <>
                <h2 className="text-2xl text-gray-800 font-semibold ml-1">Your Wallet</h2>
                <section className="rounded-2xl border-2 border-gray-200 p-4 bg-white mt-3 mb-6">
                  <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                    <DataCard title={'Current Balance'}>
                      {formatFloat(holding?.amount ?? 0, 16)} {coinDetails.symbol.toUpperCase()}
                    </DataCard>
                    <DataCard title={'Total Profit/Loss'}>
                      {formatUSD(
                        (holding?.amount ?? 0) * coinDetails.market_data.current_price.usd -
                          (holding?.amount ?? 0) * (holding?.avgBuyCost ?? 0)
                      )}{' '}
                      {Math.abs(
                        (holding?.amount ?? 0) * coinDetails.market_data.current_price.usd -
                          (holding?.amount ?? 0) * (holding?.avgBuyCost ?? 0)
                      ).toFixed(2) !== '0.00' && (
                        <>
                          (
                          <PrettyPercent
                            value={
                              (((holding?.amount ?? 0) * coinDetails.market_data.current_price.usd -
                                (holding?.amount ?? 0) * (holding?.avgBuyCost ?? 0)) /
                                ((holding?.amount ?? 0) * (holding?.avgBuyCost ?? 0))) *
                              100
                            }
                          />
                          )
                        </>
                      )}
                    </DataCard>
                  </div>
                </section>
                <h2 className="text-2xl text-gray-800 font-semibold ml-1">Your Transactions</h2>
                <section className="rounded-2xl border-2 border-gray-200 p-4 bg-white mt-3 mb-6">
                  {transactionHistory.map((transaction, i) => (
                    <div
                      key={transaction._id.toString()}
                      className={`grid grid-cols-2 py-3 ${
                        i > 4 && !showAllTransactions && 'hidden'
                      }`}
                    >
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
                  ))}
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
        )}
      </div>
    </>
  )
}

export default Details

// TODO: move these sub-components out to other files

interface DataCardProps {
  title: string
}

export const DataCard: React.FC<DataCardProps> = (props) => (
  <div className="overflow-hidden">
    <div className="px-6 py-4 text-center">
      <div className="font-normal text-lg mb-2 text-gray-700">{props.title}</div>
      <div className="text-2xl font-medium text-gray-800">{props.children}</div>
    </div>
  </div>
)
