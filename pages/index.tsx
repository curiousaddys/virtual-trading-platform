import type { NextPage } from 'next'
import Image from 'next/image'
import Head from 'next/head'
import { useEffect, useState } from 'react'
import React from 'react'
import { GeckoPrices } from './api/prices'
import ky from 'ky'
import { Line, LineChart, YAxis } from 'recharts'

const Home: NextPage = () => {
  const [isLoading, setIsLoading] = useState(true)
  // TODO(jh): maybe make a hook like you did for ALC API?
  const [prices, setPrices] = useState<GeckoPrices[] | null>(null)

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
            <div className="w-full">
              <div className="shadow rounded-lg border my-20">
                {/*TODO: style table nicer*/}
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
                            $
                            {coin.current_price.toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td
                            className={`px-6 py-4 text-sm text-gray-500 text-right ${
                              coin.price_change_percentage_24h >= 0
                                ? 'text-green-500'
                                : 'text-red-500'
                            }`}
                          >
                            {coin.price_change_percentage_24h.toLocaleString(
                              'en-US',
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                                signDisplay: 'always',
                              }
                            )}
                            %
                          </td>
                          <td>
                            <LineChart
                              width={125}
                              height={40}
                              data={(coin.sparkline_in_7d.price ?? [0])
                                .slice(
                                  (coin.sparkline_in_7d.price ?? [0]).length -
                                    25,
                                  coin.sparkline_in_7d.price?.length
                                )
                                .map((x) => ({
                                  x,
                                }))}
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
                                dataKey="x"
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
