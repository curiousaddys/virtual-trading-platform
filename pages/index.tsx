import type { NextPage } from 'next'
import Image from 'next/image'
import React, { useEffect, useMemo, useState } from 'react'
import ky from 'ky'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useAccountContext } from '../hooks/useAccount'
import { formatUSD } from '../utils/format'
import dayjs from 'dayjs'
import { BuySellAction, BuySellModal, SelectedOption } from '../components/BuySellModal'
import Link from 'next/link'
import { PrettyPercent } from '../components/common/PrettyPercent'
import { DateRangePicker, DateRangeValue } from '../components/common/DateRangePicker'
import { PortfolioBalanceHistoryResp } from './api/balance_history'
import { toast } from 'react-toastify'
import { usePricesContext } from '../hooks/usePrices'
import { Holding } from '../db/portfolios'
import { PortfolioTable } from '../components/PortfolioTable'

const Home: NextPage = () => {
  const { accountInfo, accountError } = useAccountContext()
  const [chartRange, setChartRange] = useState<DateRangeValue>(DateRangeValue.SevenDays)
  const [chartData, setChartData] = useState<PortfolioBalanceHistoryResp | null>(null)
  const { prices, pricesLoading, pricesError } = usePricesContext()
  const [modalOpen, setModalOpen] = useState(false)
  const [buySellCurrency, setBuySellCurrency] = useState<SelectedOption>()
  const [buySellAction, setBuySellAction] = useState<BuySellAction>(BuySellAction.Buy)

  const holdingsData = useMemo((): Holding[] => {
    if (!accountInfo || !prices) return [] as Holding[]
    return accountInfo.portfolio.holdings
      .sort((a, b) => {
        // TODO: allow custom sorting in the table
        const aCurrentPrice = prices.find((price) => price.id === a.currency)?.current_price ?? 0
        const bCurrentPrice = prices.find((price) => price.id === b.currency)?.current_price ?? 0
        return bCurrentPrice * b.amount - aCurrentPrice * a.amount
      })
      .filter((h) => h.amount > 0)
  }, [accountInfo, prices])

  const totalPortfolioBalanceUSD = useMemo(() => {
    if (!prices || !accountInfo?.portfolio.holdings) return 0
    return accountInfo.portfolio.holdings.reduce(
      (acc, cur) =>
        acc + (prices.find((price) => price.id === cur.currency)?.current_price ?? 1) * cur.amount,
      0
    )
  }, [prices, accountInfo])

  const openBuySellModal = (value: string, label: string, action: BuySellAction) => {
    setBuySellCurrency({ value, label })
    setBuySellAction(action)
    setModalOpen(true)
  }

  // Get fresh data for portfolio price history graph whenever balance changes.
  useEffect(() => {
    if (!totalPortfolioBalanceUSD) {
      return
    }
    ;(async () => {
      try {
        const data = await ky
          .get(`/api/balance_history?days=${chartRange}`)
          .json<PortfolioBalanceHistoryResp>()
        // If length is 0 (i.e. it's new portfolio w/o any history yet), just use current price so graph isn't empty).
        if (data.length === 0) {
          data.push({
            timestamp: new Date(),
            balanceUSD: totalPortfolioBalanceUSD,
          })
        }
        setChartData(data)
      } catch (err) {
        console.error(err)
        toast('Error getting portfolio balance history!', { type: 'error' })
      }
    })()
  }, [totalPortfolioBalanceUSD, chartRange])

  // Handle errors from hooks that fetch data.
  useEffect(() => {
    if (accountError) {
      console.error(accountError)
      toast('Error loading account info!', { type: 'error' })
    }
    if (pricesError) {
      console.error(pricesError)
      toast('Error loading current market data!', { type: 'error' })
    }
  }, [accountError, pricesError])

  return (
    <div className="container justify-center mx-auto my-10 px-2 sm:px-5 max-w-screen-lg">
      {pricesLoading ? (
        <div className="text-center">Loading...</div>
      ) : (
        <>
          {modalOpen && (
            <BuySellModal
              currency={buySellCurrency}
              onClose={() => setModalOpen(false)}
              action={buySellAction}
            />
          )}
          {prices && accountInfo && (
            <>
              <section className="mb-2">
                <h2 className="text-3xl text-black font-semibold mt-10">
                  Portfolio Balance: {formatUSD(totalPortfolioBalanceUSD)}
                </h2>
                <p className="text-gray-500">{accountInfo?.address}</p>
              </section>
              <section>
                <div className="rounded-md pt-3 shadow-lg bg-white">
                  <DateRangePicker
                    selectedDays={chartRange}
                    onSelectionChange={setChartRange}
                    showHourOption
                  />
                  <div className="px-2">
                    {!chartData && (
                      // TODO: nicer loading indicator
                      <div style={{ height: 400, width: '100%' }} className="flex text-xl">
                        <div className="m-auto">Loading...</div>
                      </div>
                    )}
                    {chartData && (
                      <ResponsiveContainer width="100%" height={400}>
                        <LineChart
                          data={chartData ?? []}
                          margin={{
                            top: 10,
                            right: 10,
                            bottom: 10,
                            left: 10,
                          }}
                        >
                          <XAxis
                            dataKey="timestamp"
                            tickFormatter={(t) =>
                              chartRange === DateRangeValue.Hour ||
                              chartRange === DateRangeValue.Day
                                ? dayjs(t).format('hh:mm A')
                                : dayjs(t).format('MMM D, YYYY')
                            }
                            type="category"
                            domain={['dataMin', 'dataMax']}
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
                            labelFormatter={(t) => dayjs(t).format('MMM D, YYYY [at] hh:mm A')}
                          />

                          <Line
                            type="linear"
                            dataKey="balanceUSD"
                            stroke={'#00008B'}
                            dot={false}
                            isAnimationActive={true}
                            animationDuration={500}
                            name={'Balance'}
                            strokeWidth={2}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </section>
            </>
          )}
          {accountInfo && (
            <section>
              <h2 className="text-lg text-black font-semibold mt-10">
                Your Portfolio: {accountInfo.portfolio.name}
              </h2>
              <PortfolioTable
                holdings={holdingsData}
                totalPortfolioBalanceUSD={totalPortfolioBalanceUSD}
                // TODO: move BuySellModal up to top of app & use Context so we don't have to pass things like this around
                onSellButtonClick={openBuySellModal}
              />
            </section>
          )}
          <section>
            <h2 className="text-lg text-black font-semibold mt-10">All Prices</h2>
            <div className="shadow border mt-2">
              <table className="table-auto w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-xs text-gray-500 text-left">Name</th>
                    <th className="px-4 py-2" />
                    <th className="px-4 py-2 text-xs text-gray-500 text-right">Price</th>
                    <th className="px-4 py-2 text-xs text-gray-500 text-right hidden md:table-cell">
                      Change (24h)
                    </th>
                    <th className="px-4 py-2 text-xs text-gray-500 text-right hidden md:table-cell">
                      Volume (24h)
                    </th>
                    {accountInfo && <th className="px-4 py-2" />}
                  </tr>
                </thead>

                <tbody className="bg-white">
                  {prices &&
                    prices.map((coin) => (
                      <tr className="even:bg-gray-50" key={coin.id}>
                        <Link href={`/details/${coin.id}`} passHref>
                          <td className="px-4 py-4 whitespace-nowrap w-px cursor-pointer">
                            <Image src={coin.image} height={40} width={40} alt={coin.symbol} />
                          </td>
                        </Link>
                        <Link href={`/details/${coin.id}`} passHref>
                          <td className="px-4 py-4 text-sm text-gray-900 font-bold cursor-pointer">
                            {coin.name} <br />
                            <span className="font-light">{coin.symbol.toUpperCase()}</span>
                          </td>
                        </Link>
                        <td className="px-4 py-4 text-sm text-gray-500 text-right">
                          {formatUSD(coin.current_price)}
                          <div className="md:hidden w-100">
                            <PrettyPercent value={coin.price_change_percentage_24h} />
                          </div>
                        </td>
                        <td
                          className={`px-4 py-4 text-sm text-gray-500 text-right hidden md:table-cell`}
                        >
                          <PrettyPercent value={coin.price_change_percentage_24h} />
                        </td>
                        <td
                          className="px-4 py-4 text-sm text-gray-500 text-right hidden md:table-cell"
                          style={{ maxWidth: 150 }}
                        >
                          {formatUSD(coin.total_volume, true)}
                        </td>
                        {accountInfo && (
                          <td className="px-4 py-4 text-right">
                            <button
                              className="px-4 py-2 bg-green-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-300"
                              style={{ maxWidth: 75 }}
                              onClick={() =>
                                openBuySellModal(coin.id, coin.name, BuySellAction.Buy)
                              }
                            >
                              Buy
                            </button>
                          </td>
                        )}
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
