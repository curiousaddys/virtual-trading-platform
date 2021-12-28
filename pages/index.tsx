import type { NextPage } from 'next'
import Image from 'next/image'
import { useContext, useEffect, useState } from 'react'
import React from 'react'
import ky from 'ky'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { UserContext } from '../hooks/useUser'
import { Account } from '../db/accounts'
import { formatPercent, formatUSD } from '../utils/format'
import { ONE_MINUTE_MS } from '../utils/constants'
import { GeckoPrices } from '../api/CoinGecko/markets'
import { PortfolioBalance } from '../db/portfolioHistory_minutely'
import { Container } from 'postcss'
import dayjs from 'dayjs'

const Home: NextPage = () => {
  const [isLoading, setIsLoading] = useState(true)
  // TODO(jh): consider making hooks for api calls like you did for ALC API?
  const [prices, setPrices] = useState<GeckoPrices[] | null>(null)
  const [account, setAccount] = useState<Account | null>(null)
  const [balance, setBalance] = useState<PortfolioBalance[] | null>(null)
  const { user } = useContext(UserContext)

  useEffect(() => {
    if (!user) {
      return setAccount(null)
    }
    // TODO(jh): handle errors (clear user if 401)
    ;(async () => {
      const data = await ky.get('/api/account').json<Account>()
      // TODO(jh): remove logging
      console.log(data)
      setAccount(data)
    })()
    // TODO(jh): handle errors (clear user if 401)
    ;(async () => {
      const data = await ky.get('/api/balance').json<PortfolioBalance[]>()
      // TODO(jh): remove logging
      console.log(data)
      setBalance(data)
    })()
  }, [user])

  const getPrices = async () => {
    // TODO(jh): handle errors
    const data = await ky.get('/api/prices').json<GeckoPrices[]>()
    // TODO(jh): remove logging
    console.log(data)
    setPrices(data)
  }

  useEffect(() => {
    // Get prices from API on first render.
    ;(async () => {
      await getPrices()
      setIsLoading(false)
    })()
    // Get new price data from API every minute.
    const interval = setInterval(() => {
      getPrices()
    }, ONE_MINUTE_MS)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="container justify-center mx-auto my-10 px-2 sm:px-5 max-w-screen-md">
      {isLoading ? (
        <div className="text-center">Loading...</div>
      ) : (
        <>
          {account && balance && (
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
                      data={balance}
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
                  Your Portfolio ({account?.address})
                </h2>
                <div className="shadow border mt-2">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-xs text-gray-500 text-left">
                          Name
                        </th>
                        <th className="px-6 py-2 text-xs text-gray-500 text-right">
                          Amount
                        </th>
                      </tr>
                    </thead>

                    <tbody className="bg-white">
                      {account.portfolios[0]?.holdings?.map((h) => (
                        <tr
                          key={h.currency}
                          className="whitespace-nowrap even:bg-gray-50"
                        >
                          <td className="px-4 py-4 text-sm text-gray-900 font-bold">
                            {h.currency}{' '}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 text-right">
                            {h.amount}
                          </td>
                        </tr>
                      ))}
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
                    <th className="px-6 py-2 text-xs text-gray-500 text-right">
                      Change (1 day)
                    </th>
                    <th className="px-6 py-2 hidden md:block" />
                  </tr>
                </thead>

                <tbody className="bg-white">
                  {prices &&
                    prices.map((coin) => (
                      <tr
                        key={coin.id}
                        className="whitespace-nowrap even:bg-gray-50"
                      >
                        <td className="px-4 py-4">
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
                        </td>
                        <td
                          className={`px-6 py-4 text-sm text-gray-500 text-right ${
                            coin.price_change_percentage_24h >= 0
                              ? 'text-green-500'
                              : 'text-red-500'
                          }`}
                        >
                          {formatPercent(coin.price_change_percentage_24h)}%
                        </td>
                        <td className="hidden md:block">
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
