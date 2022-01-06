import { NextPage } from 'next'
import React, { useContext, useEffect, useState } from 'react'
import ky from 'ky'
import { formatFloat, formatUSD, stripHtmlTags } from '../utils/format'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import dayjs from 'dayjs'
import Link from 'next/link'
import { BuySellAction, BuySellModal } from '../components/BuySellModal'
import { UserContext } from '../hooks/useUser'
import Image from 'next/image'
import { PrettyPercent } from '../components/common/PrettyPercent'
import { Transaction } from '../db/transactions'
import { DateRangePicker, DateRangeValue } from '../components/common/DateRangePicker'
import { usePriceHistory } from '../hooks/usePriceHistory'
import { useCoinDetails } from '../hooks/useCoinDetails'
import { useQueryString } from '../hooks/useQueryString'
import { toast } from 'react-toastify'

const Details: NextPage = () => {
  const coin = useQueryString('coin')
  // TODO: show some loading spinner or skeleton if loading
  const { coinDetails, coinDetailsLoading, coinDetailsError } = useCoinDetails(coin)
  const [chartRange, setChartRange] = useState<DateRangeValue>(DateRangeValue.SevenDays)
  // TODO: show some loading spinner or skeleton if loading
  const { priceHistory, priceHistoryLoading, priceHistoryError } = usePriceHistory(coin, chartRange)
  const { accountInfo } = useContext(UserContext)
  const [transactionHistory, setTransactionHistory] = useState<Transaction[] | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [buySellAction, setBuySellAction] = useState<BuySellAction>(BuySellAction.Buy)

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
  }, [accountInfo, coin])

  // Handle errors from data fetching hooks.
  useEffect(() => {
    if (coinDetailsError) {
      console.error(coinDetailsError)
      toast('Error loading coin info!', { type: 'error' })
    }
    if (priceHistoryError) {
      console.error(priceHistoryError)
      toast('Error price history!', { type: 'error' })
    }
  }, [coinDetailsError, priceHistoryError])

  return (
    <div className="container justify-center mx-auto my-10 px-2 sm:px-5 max-w-screen-lg">
      {!coinDetails ? (
        <div className="text-center">Loading...</div>
      ) : (
        <>
          <BuySellModal
            visible={modalOpen}
            currency={{ value: coinDetails.id, label: coinDetails.name }}
            onClose={() => setModalOpen(false)}
            action={buySellAction}
          />
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
            {!!accountInfo?.portfolios[0].holdings.find((holding) => holding.currency === coin)
              ?.amount && (
              <button
                className="grow max-w-xs px-4 py-2 mx-2 bg-green-500 text-white text-base font-medium rounded-md shadow-sm hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-300"
                onClick={() => openBuySellModal(BuySellAction.Sell)}
              >
                Sell
              </button>
            )}
          </section>

          <section className="my-5">
            <DateRangePicker selectedDays={chartRange} onSelectionChange={setChartRange} />
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
                <CartesianGrid />
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
                  domain={[(dataMin: number) => dataMin * 0.9, (dataMax: number) => dataMax * 1.1]}
                  hide
                />
                <Tooltip
                  formatter={(value: number) => formatUSD(value)}
                  labelFormatter={(t) => dayjs.unix(t / 1000).format('MMM D, YYYY [at] hh:mm A')}
                />
                {priceHistory && (
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
                )}
              </LineChart>
            </ResponsiveContainer>
          </section>

          <section className="my-5">
            <h2 className="text-2xl text-black font-semibold mb-2">Stats</h2>
            <div>Current price: {formatUSD(coinDetails.market_data.current_price.usd)}</div>
            <div>Market cap: {formatUSD(coinDetails.market_data.market_cap.usd)}</div>
            <div>Volume: {formatUSD(coinDetails.market_data.total_volume.usd)}</div>
            <div>Circulating supply: {formatFloat(coinDetails.market_data.circulating_supply)}</div>
            <div>Popularity: #{coinDetails.market_cap_rank}</div>
            <div>All time high: {formatUSD(coinDetails.market_data.ath.usd)}</div>
          </section>
          <section className="my-5">
            {/*TODO: make this section look nicer. maybe put it on cards like on cryptoparrot.*/}
            <h2 className="text-2xl text-black font-semibold mb-2">Price History</h2>
            <div>
              Price change (last hour):{' '}
              <PrettyPercent
                value={coinDetails.market_data.price_change_percentage_1h_in_currency.usd}
              />
            </div>
            <div>
              Price change (24 hours):{' '}
              <PrettyPercent
                value={coinDetails.market_data.price_change_percentage_24h_in_currency.usd}
              />
            </div>
            <div>
              Price change (7 days):{' '}
              <PrettyPercent
                value={coinDetails.market_data.price_change_percentage_7d_in_currency.usd}
              />
            </div>
            <div>
              Price change (30 days):{' '}
              <PrettyPercent
                value={coinDetails.market_data.price_change_percentage_30d_in_currency.usd}
              />
            </div>
          </section>
          {/*TODO: display a nice table for this data*/}
          {/*TODO: only show 5-10 recent transactions w/ a "view more" button*/}
          {transactionHistory && transactionHistory.length > 0 && (
            <section className="my-5">
              <div>
                <h2 className="text-2xl text-black font-semibold mb-2">Your Transactions</h2>
                {transactionHistory.map((transaction) => (
                  <div key={transaction._id.toString()} className="mb-2">
                    <div className="font-medium underline">
                      {dayjs(transaction.timestamp).format('MMM D, YYYY [at] h:mm A')}
                    </div>
                    <div>
                      {transaction.action === 'buy' ? 'Purchased' : 'Sold'}{' '}
                      {transaction.amountUSD / transaction.exchangeRateUSD}{' '}
                      {coinDetails?.symbol.toUpperCase()} for {formatUSD(transaction.amountUSD)}.
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
          <section className="my-5">
            <h2 className="text-2xl text-black font-semibold mb-2">About</h2>
            <p
              dangerouslySetInnerHTML={{
                __html: stripHtmlTags(coinDetails.description.en),
              }}
            />
            {coinDetails.links?.homepage?.length && (
              <p className="my-3">
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
