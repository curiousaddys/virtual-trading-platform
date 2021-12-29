import type { NextPage } from 'next'
import Image from 'next/image'
import { useContext, useEffect, useState } from 'react'
import React from 'react'
import ky from 'ky'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { UserContext } from '../hooks/useUser'
import { formatFloat, formatPercent, formatUSD } from '../utils/format'
import { PortfolioBalance } from '../db/portfolioHistory_minutely'
import dayjs from 'dayjs'
import { BuySellModal } from '../components/BuySellModal'
import { usePrices } from '../hooks/usePrices'

const Home: NextPage = () => {
  const { accountInfo } = useContext(UserContext)
  const [chartData, setChartData] = useState<PortfolioBalance[] | null>(null)
  // TODO: display error if prices fail to load
  const { prices, pricesLoading, pricesError } = usePrices()
  const [modalOpen, setModalOpen] = useState(false)
  const [buyButtonClicked, setBuyButtonClicked] =
    useState<{ value: string; label: string }>()

  const openBuyModal = (value: string, label: string) => {
    setBuyButtonClicked({ value, label })
    setModalOpen(true)
  }

  // Get data for portfolio price history graph whenever account info changes.
  useEffect(() => {
    if (!accountInfo) {
      return
    }
    ;(async () => {
      const data = await ky.get('/api/balance').json<PortfolioBalance[]>()
      // TODO(jh): remove logging
      console.log(data)
      // TODO(jh): append current portfolio amount to end so that it updates immediately after a buy/sell happens?
      setChartData(data)
    })()
  }, [accountInfo])

  return (
    <div className="container justify-center mx-auto my-10 px-2 sm:px-5 max-w-screen-lg">
      {pricesLoading ? (
        <div className="text-center">Loading...</div>
      ) : (
        <>
          <BuySellModal
            visible={modalOpen}
            defaultCoin={buyButtonClicked}
            onClose={() => setModalOpen(false)}
          />
          {accountInfo && chartData && prices && (
            <>
              <section>
                <h2 className="text-lg text-black font-semibold">
                  Portfolio Balance
                </h2>

                <div className="container">
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart
                      width={600}
                      height={500}
                      data={chartData}
                      margin={{
                        top: 10,
                        right: 10,
                        bottom: 10,
                        left: 10,
                      }}
                    >
                      <CartesianGrid />
                      <XAxis
                        dataKey="timestamp"
                        tickFormatter={(t) => dayjs.unix(t).format('hh:mm A')}
                        type="number"
                        domain={['dataMin', 'dataMax']}
                        scale="time"
                        minTickGap={15}
                        tickMargin={10}
                      />
                      <YAxis domain={['dataMin-10000', 'dataMax+10000']} hide />
                      <Tooltip
                        formatter={(value: number) => formatUSD(value)}
                        labelFormatter={(t) => dayjs.unix(t).format('hh:mm A')}
                      />
                      <Line
                        type="linear"
                        dataKey="balanceUSD"
                        stroke={'#00008B'}
                        dot={false}
                        isAnimationActive={true}
                        name={'Balance'}
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </section>
              <section>
                <h2 className="text-lg text-black font-semibold mt-10">
                  Your Portfolio ({accountInfo?.address})
                </h2>
                <div className="shadow border mt-2">
                  <table className="w-full table-auto">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-xs text-gray-500 text-left">
                          Name
                        </th>
                        <th className="px-4 py-2" />
                        <th className="px-6 py-2 text-xs text-gray-500 text-right">
                          Balance
                        </th>
                        <th className="px-6 py-2 text-xs text-gray-500 text-right">
                          Price
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {accountInfo.portfolios[0]?.holdings?.map((h) => {
                        const coin = prices.find(
                          (price) => price.id === h.currency
                        ) ?? {
                          symbol: 'USD',
                          name: 'US Dollars',
                          current_price: 1,
                          price_change_percentage_24h: 0,
                          image:
                            // TODO: maybe host this image ourselves
                            'https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png',
                        }
                        return (
                          <tr
                            key={h.currency}
                            className="whitespace-nowrap even:bg-gray-50"
                          >
                            <td className="px-4 py-4 whitespace-nowrap w-px">
                              <Image
                                src={coin.image}
                                height={40}
                                width={40}
                                alt={coin.symbol}
                              />
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-900">
                              <span className="font-bold">{coin.name}</span>
                              <br />
                              <span className="font-light">
                                {coin.symbol.toUpperCase()}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 text-right">
                              <span className="font-bold text-gray-700 text-base">
                                {formatUSD(coin.current_price * h.amount)}
                              </span>
                              <br />
                              {formatFloat(h.amount)}{' '}
                              {coin.symbol.toUpperCase()}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 text-right">
                              {formatUSD(coin.current_price)}
                              <br />
                              <span
                                className={`${
                                  coin.price_change_percentage_24h >= 0
                                    ? 'text-green-500'
                                    : 'text-red-500'
                                }`}
                              >
                                {formatPercent(
                                  coin.price_change_percentage_24h
                                )}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}
          <section>
            <h2 className="text-lg text-black font-semibold mt-10">
              All Prices
            </h2>
            <div className="shadow border mt-2">
              <table className="table-auto w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-xs text-gray-500 text-left">
                      Name
                    </th>
                    <th className="px-4 py-2" />
                    <th className="px-6 py-2 text-xs text-gray-500 text-right">
                      Price
                    </th>
                    <th className="px-6 py-2 text-xs text-gray-500 text-right hidden md:table-cell">
                      Change (1 day)
                    </th>
                    <th className="px-6 py-2 hidden md:table-cell" />
                    <th className="px-6 py-2" />
                  </tr>
                </thead>

                <tbody className="bg-white">
                  {prices &&
                    prices.map((coin) => (
                      <tr
                        key={coin.id}
                        className="whitespace-nowrap even:bg-gray-50"
                      >
                        <td className="px-4 py-4 whitespace-nowrap w-px">
                          <Image
                            src={coin.image}
                            height={40}
                            width={40}
                            alt={coin.symbol}
                          />
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900 font-bold">
                          {coin.name} <br />
                          <span className="font-light">
                            {coin.symbol.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 text-right">
                          {formatUSD(coin.current_price)}
                          <div className="md:hidden w-100">
                            <div
                              className={`text-sm text-gray-500 ${
                                coin.price_change_percentage_24h >= 0
                                  ? 'text-green-500'
                                  : 'text-red-500'
                              }`}
                            >
                              {formatPercent(coin.price_change_percentage_24h)}
                            </div>
                          </div>
                        </td>
                        <td
                          className={`px-6 py-4 text-sm text-gray-500 text-right hidden md:table-cell ${
                            coin.price_change_percentage_24h >= 0
                              ? 'text-green-500'
                              : 'text-red-500'
                          }`}
                        >
                          {formatPercent(coin.price_change_percentage_24h)}
                        </td>
                        <td className="px-4 py-4 hidden md:table-cell">
                          <LineChart
                            width={125}
                            height={40}
                            data={
                              // TODO(jh): handle this data on backend
                              (coin.sparkline_in_7d.price ?? [0])
                                .slice(
                                  (coin.sparkline_in_7d.price ?? [0]).length -
                                    25,
                                  coin.sparkline_in_7d.price?.length
                                )
                                .map((n) => ({
                                  n,
                                }))
                            }
                            margin={{
                              top: 10,
                              right: 10,
                              bottom: 10,
                              left: 10,
                            }}
                          >
                            <YAxis
                              type="number"
                              domain={['dataMin', 'dataMax']}
                              hide
                            />
                            <Line
                              type="linear"
                              dataKey="n"
                              stroke={
                                coin.price_change_percentage_24h >= 0
                                  ? '#22c55e'
                                  : '#ef4444'
                              }
                              dot={false}
                              isAnimationActive={false}
                            />
                          </LineChart>
                        </td>
                        {/*TODO: only show if logged in*/}
                        <td className="px-4 py-4">
                          <button
                            className="px-4 py-2 bg-green-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-300"
                            onClick={() => openBuyModal(coin.id, coin.name)}
                          >
                            Buy
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  )
}

export default Home
