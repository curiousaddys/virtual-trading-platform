import type { NextPage } from 'next'
import Image from 'next/image'
import Head from 'next/head'
import { useContext, useEffect, useState } from 'react'
import React from 'react'
import { GeckoPrices } from './api/prices'
import ky from 'ky'
import { Line, LineChart, YAxis } from 'recharts'
import { UserContext } from '../hooks/useUser'
import { Account } from '../db/accounts'
import { formatPercent, formatUSD } from '../utils/format'

const Home: NextPage = () => {
  const [isLoading, setIsLoading] = useState(true)
  // TODO(jh): consider making hooks for api calls like you did for ALC API?
  const [prices, setPrices] = useState<GeckoPrices[] | null>(null)
  const [account, setAccount] = useState<Account | null>(null)
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
  }, [user])

  useEffect(() => {
    // TODO(jh): handle errors
    ;(async () => {
      const data = await ky.get('/api/prices').json<GeckoPrices[]>()
      // TODO(jh): remove logging
      console.log(data)
      setPrices(data)
      setIsLoading(false)
    })()
  }, [])

  return (
    <div>
      <Head>
        <title>Virtual Trading Platform</title>
        <meta name="description" content="Curious Addys' Trading Club" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="container flex justify-center mx-auto">
        {isLoading ? (
          <p>Loading...</p>
        ) : (
          <div className="flex flex-col">
            {account && (
              <div>
                <div className="mb-1">{account.address}</div>
                <div className="text-lg font-bold">Portfolio:</div>
                {account.portfolios[0].holdings.map((h) => (
                  <div key={h.currency}>
                    <span className="font-bold">{h.currency}:</span>{' '}
                    {formatUSD(h.amount)}
                  </div>
                ))}
              </div>
            )}
            <div className="w-full">
              <div className="shadow rounded-lg border my-20">
                <table className="table-auto w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-xs text-gray-500 rounded-tl-lg">
                        Name
                      </th>
                      <th className="px-4 py-2" />
                      <th className="px-6 py-2 text-xs text-gray-500 text-right">
                        Price
                      </th>
                      <th className="px-6 py-2 text-xs text-gray-500 text-right">
                        Change (1 day)
                      </th>
                      <th className="px-6 py-2 rounded-tr-lg" />
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
                            {coin.name}{' '}
                            <span className="font-light ml-3">
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
                          <td>
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
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Home
