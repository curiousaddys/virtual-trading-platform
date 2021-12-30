import { NextPage } from 'next'
import React, { useContext, useEffect, useState } from 'react'
import { GeckoDetails } from '../api/CoinGecko/coin'
import ky from 'ky'
import { formatFloat, formatUSD, stripHtmlTags } from '../utils/format'
import { GeckoPriceHistory } from '../api/CoinGecko/market_chart'
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
import { BuySellModal } from '../components/BuySellModal'
import { UserContext } from '../hooks/useUser'
import Image from 'next/image'
import { PrettyPercent } from '../components/common/PrettyPercent'
import { Transaction } from '../db/transactions'

const Details: NextPage = () => {
  const [coin, setCoin] = useState<string>('')
  const [data, setData] = useState<GeckoDetails>()
  const [chartData, setChartData] = useState<GeckoPriceHistory>()
  const { accountInfo } = useContext(UserContext)
  const [transactionHistory, setTransactionHistory] = useState<
    Transaction[] | null
  >(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [buyButtonClicked, setBuyButtonClicked] =
    useState<{ value: string; label: string }>()

  const openBuyModal = (value: string, label: string) => {
    setBuyButtonClicked({ value, label })
    setModalOpen(true)
  }

  // TODO: maybe turn this into a simple useQueryString hook
  useEffect(() => {
    const queryString = window.location.search
    const urlParams = new URLSearchParams(queryString)
    setCoin(urlParams.get('coin') ?? '')
  }, [])

  useEffect(() => {
    if (!coin) return

    // TODO: should this chart update every minute? use SWR for this since it's public info?
    const fetchChartData = async () => {
      // TODO: handle errors
      const results = await ky
        .get('/api/history', {
          searchParams: {
            coin: coin,
            // TODO: use days from option on page
            days: 7,
          },
        })
        .json<GeckoPriceHistory>()
      // TODO: remove logging
      console.log(results)
      setChartData(results)
    }

    // TODO: should these details update on an interval too? maybe use SWR here too?
    const fetchDetailsData = async () => {
      // TODO: handle errors
      const results = await ky
        .get('/api/details', {
          searchParams: {
            coin: coin,
          },
        })
        .json<GeckoDetails>()
      // TODO: remove logging
      console.log(results)
      setData(results)
    }

    fetchDetailsData()
    fetchChartData()
  }, [coin])

  // Fetch transaction data if user is logged in & whenever account data changes.
  useEffect(() => {
    if (!accountInfo || !coin) return

    const fetchTransactionHistory = async () => {
      // TODO: handle errors
      const results = await ky
        .get('/api/transactions', {
          searchParams: {
            coin: coin,
            portfolioID: '61ce1722db11e201724381ac', // TODO: get ID from AccountInfo
          },
        })
        .json<Transaction[]>()
      // TODO: remove logging
      console.log(results)
      setTransactionHistory(results)
    }

    fetchTransactionHistory()
  }, [accountInfo, coin])

  return (
    <div className="container justify-center mx-auto my-10 px-2 sm:px-5 max-w-screen-lg">
      {!data ? (
        <div className="text-center">Loading...</div>
      ) : (
        <>
          <BuySellModal
            visible={modalOpen}
            defaultCoin={buyButtonClicked}
            onClose={() => setModalOpen(false)}
          />
          <section className="my-5 flex items-center justify-between">
            <div className="flex items-center justify-between">
              <Image
                src={data.image.large}
                height={100}
                width={100}
                alt={data.symbol}
              />
              <h1 className="text-4xl text-black font-semibold px-5">
                {data.name} ({data.symbol.toUpperCase()})
              </h1>
            </div>
            {accountInfo && data && (
              <button
                className="grow max-w-xs px-4 py-2 bg-green-500 text-white text-base font-medium rounded-md shadow-sm hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-300"
                onClick={() => openBuyModal(data.id, data.name)}
              >
                Buy
              </button>
            )}
          </section>
          {chartData && (
            <section className="my-5">
              <div className="container">
                {/*TODO: add options to show other time periods (day, week, month, year, all)*/}
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart
                    data={chartData.prices}
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
                        dayjs.unix(t / 1000).format('MMM D, YYYY')
                      }
                      type="number"
                      domain={['dataMin', 'dataMax']}
                      scale="time"
                      minTickGap={15}
                      tickMargin={10}
                    />
                    <YAxis domain={['dataMin-10000', 'dataMax+10000']} hide />
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
                      name={'Price'}
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}
          <section className="my-5">
            <h2 className="text-2xl text-black font-semibold mb-2">Stats</h2>
            <div>
              Current price: {formatUSD(data.market_data.current_price.usd)}
            </div>
            <div>Market cap: {formatUSD(data.market_data.market_cap.usd)}</div>
            <div>Volume: {formatUSD(data.market_data.total_volume.usd)}</div>
            <div>
              Circulating supply:{' '}
              {formatFloat(data.market_data.circulating_supply)}
            </div>
            <div>Popularity: #{data.market_cap_rank}</div>
            <div>All time high: {formatUSD(data.market_data.ath.usd)}</div>
          </section>
          <section className="my-5">
            <h2 className="text-2xl text-black font-semibold mb-2">
              Price History
            </h2>
            <div>
              {/*TODO: color prices*/}
              Price change (last hour):{' '}
              <PrettyPercent
                value={
                  data.market_data.price_change_percentage_1h_in_currency.usd
                }
              />
            </div>
            <div>
              Price change (24 hours):{' '}
              <PrettyPercent
                value={
                  data.market_data.price_change_percentage_24h_in_currency.usd
                }
              />
            </div>
            <div>
              Price change (7 days):{' '}
              <PrettyPercent
                value={
                  data.market_data.price_change_percentage_7d_in_currency.usd
                }
              />
            </div>
            <div>
              Price change (30 days):{' '}
              <PrettyPercent
                value={
                  data.market_data.price_change_percentage_30d_in_currency.usd
                }
              />
            </div>
          </section>
          {transactionHistory && transactionHistory.length > 0 && (
            <section className="my-5">
              <div>
                <h2 className="text-2xl text-black font-semibold mb-2">
                  Your Transactions
                </h2>
                {transactionHistory.map((transaction) => (
                  <div key={transaction._id.toString()} className="mb-2">
                    <div className="font-medium underline">
                      {dayjs(transaction.timestamp).format(
                        'MMM D, YYYY [at] h:mm A'
                      )}
                    </div>
                    <div>
                      {transaction.action === 'buy' ? 'Purchased' : 'Sold'}{' '}
                      {transaction.amountUSD / transaction.exchangeRateUSD}{' '}
                      {data?.symbol.toUpperCase()} for ${transaction.amountUSD}.
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
                __html: stripHtmlTags(data.description.en),
              }}
            />
            {data.links?.homepage?.length && (
              <p className="my-3">
                <Link href={data.links.homepage[0]} passHref>
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
