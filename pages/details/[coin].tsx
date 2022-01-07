import { GetServerSideProps, NextPage } from 'next'
import React, { useContext, useEffect, useState } from 'react'
import ky from 'ky'
import { formatFloat, formatInt, formatUSD, stripHtmlTags } from '../../utils/format'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import dayjs from 'dayjs'
import Link from 'next/link'
import { BuySellAction, BuySellModal } from '../../components/BuySellModal'
import { UserContext } from '../../hooks/useUser'
import Image from 'next/image'
import { PrettyPercent } from '../../components/common/PrettyPercent'
import { Transaction } from '../../db/transactions'
import { DateRangePicker, DateRangeValue } from '../../components/common/DateRangePicker'
import { usePriceHistory } from '../../hooks/usePriceHistory'
import { useCoinDetails } from '../../hooks/useCoinDetails'
import { toast } from 'react-toastify'
import { SUPPORTED_COINS } from '../../utils/constants'

interface CoinDetailsPageProps {
  coin: string
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  // Check that a valid coin was requested before rending the page.
  const coin = context.query['coin'] as string
  if (!(SUPPORTED_COINS as ReadonlyArray<string>).includes(coin)) {
    return {
      notFound: true,
    }
  }
  // TODO: consider using SSR for initial data
  return {
    props: { coin },
  }
}

const Details: NextPage<CoinDetailsPageProps> = (props) => {
  // TODO: show some loading spinner or skeleton if loading
  const { coinDetails, coinDetailsLoading, coinDetailsError } = useCoinDetails(props.coin)
  const [chartRange, setChartRange] = useState<DateRangeValue>(DateRangeValue.SevenDays)
  // TODO: show some loading spinner or skeleton if loading
  const { priceHistory, priceHistoryLoading, priceHistoryError } = usePriceHistory(
    props.coin,
    chartRange
  )
  const { accountInfo } = useContext(UserContext)
  const [transactionHistory, setTransactionHistory] = useState<Transaction[] | null>(null)
  const [showAllTransactions, setShowAllTransactions] = useState<boolean>(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [buySellAction, setBuySellAction] = useState<BuySellAction>(BuySellAction.Buy)

  const openBuySellModal = (action: BuySellAction) => {
    if (!coinDetails) return
    setBuySellAction(action)
    setModalOpen(true)
  }

  // Fetch transaction data if user is logged in & whenever account data changes.
  useEffect(() => {
    if (!accountInfo || !props.coin) return

    const fetchTransactionHistory = async () => {
      try {
        const results = await ky
          .get('/api/transactions', {
            searchParams: {
              coin: props.coin,
              portfolioID: accountInfo.portfolios[0]._id.toString(),
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
  }, [accountInfo, props.coin])

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
    <div className="container justify-center mx-auto my-10 px-2 sm:px-5 max-w-screen-lg">
      {!coinDetails ? (
        <div className="text-center">Loading...</div>
      ) : (
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
            {!!accountInfo?.portfolios[0].holdings.find(
              (holding) => holding.currency === props.coin
            )?.amount && (
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
            <div className="rounded pt-3 shadow-lg">
              <DateRangePicker selectedDays={chartRange} onSelectionChange={setChartRange} />
              <div className="px-2">
                {priceHistoryLoading && (
                  // TODO: nicer loading indicator
                  <div style={{ height: 400, width: '100%' }} className="flex text-xl">
                    <div className="m-auto">Loading...</div>
                  </div>
                )}
                {priceHistory && (
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart
                      data={priceHistory?.prices}
                      margin={{
                        top: 10,
                        right: 10,
                        bottom: 10,
                        left: 10,
                      }}
                    >
                      <XAxis
                        dataKey="0"
                        tickFormatter={(t) =>
                          chartRange !== '1'
                            ? dayjs.unix(t / 1000).format('MMM D, YYYY')
                            : dayjs(t).format('hh:mm A')
                        }
                        type="number"
                        domain={['dataMin', 'dataMax']}
                        scale="time"
                        minTickGap={15}
                        tickMargin={10}
                      />
                      <YAxis
                        domain={[
                          (dataMin: number) => dataMin * 0.9,
                          (dataMax: number) => dataMax * 1.1,
                        ]}
                        hide
                      />
                      <Tooltip
                        formatter={(value: number) => formatUSD(value)}
                        labelFormatter={(t) =>
                          dayjs.unix(t / 1000).format('MMM D, YYYY [at] hh:mm A')
                        }
                      />
                      <Line
                        type="linear"
                        dataKey="1"
                        stroke={'#00008B'}
                        dot={false}
                        isAnimationActive={true}
                        animationDuration={500}
                        name={'Price'}
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
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

          {/*TODO: only show 5-10 recent transactions w/ a "view more" button*/}
          {transactionHistory && transactionHistory.length > 0 && (
            <>
              <h2 className="text-2xl text-gray-800 font-semibold ml-1">Your Transactions</h2>
              <section className="rounded-2xl border-2 border-gray-200 p-4 bg-white mt-3 mb-6">
                {transactionHistory.map((transaction, i) => (
                  <div
                    key={transaction._id.toString()}
                    className={`grid grid-cols-2 py-3 ${i > 4 && !showAllTransactions && 'hidden'}`}
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
