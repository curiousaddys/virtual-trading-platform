import type { NextPage } from 'next'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import ky from 'ky'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useAccountContext } from '../hooks/useAccount'
import { formatUSD } from '../utils/format'
import dayjs from 'dayjs'
import { BuySellAction, BuySellModal, SelectedOption } from '../components/BuySellModal'
import { DateRangePicker, DateRangeValue } from '../components/common/DateRangePicker'
import { PortfolioBalanceHistoryResp } from './api/balance_history'
import { toast } from 'react-toastify'
import { usePricesContext } from '../hooks/usePrices'
import { PortfolioTable } from '../components/PortfolioTable'
import { AllPricesTable } from '../components/AllPricesTable'
import { PageWrapper } from '../components/common/PageWrapper'

const Home: NextPage = () => {
  const { accountInfo, accountError } = useAccountContext()
  const [chartRange, setChartRange] = useState<DateRangeValue>(DateRangeValue.SevenDays)
  const [chartData, setChartData] = useState<PortfolioBalanceHistoryResp | null>(null)
  const { prices, pricesLoading, pricesError } = usePricesContext()
  const [modalOpen, setModalOpen] = useState(false)
  const [buySellCurrency, setBuySellCurrency] = useState<SelectedOption>()
  const [buySellAction, setBuySellAction] = useState<BuySellAction>(BuySellAction.Buy)

  const totalPortfolioBalanceUSD = useMemo(() => {
    if (!prices || !accountInfo?.portfolio.holdings) return 0
    return accountInfo.portfolio.holdings.reduce(
      (acc, cur) =>
        acc + (prices.find((price) => price.id === cur.currency)?.current_price ?? 1) * cur.amount,
      0
    )
  }, [prices, accountInfo])

  const openBuySellModal = useCallback((value: string, label: string, action: BuySellAction) => {
    setBuySellCurrency({ value, label })
    setBuySellAction(action)
    setModalOpen(true)
  }, [])

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
    <PageWrapper>
      {pricesLoading ? (
        <div className="text-center">Loading...</div>
      ) : (
        <>
          {modalOpen ? (
            <BuySellModal
              currency={buySellCurrency}
              onClose={() => setModalOpen(false)}
              action={buySellAction}
            />
          ) : null}
          {prices && accountInfo ? (
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
          ) : null}
          {accountInfo ? (
            <PortfolioTable
              totalPortfolioBalanceUSD={totalPortfolioBalanceUSD}
              // TODO: move BuySellModal up to top of app & use Context so we don't have to pass things like this around
              onSellButtonClick={openBuySellModal}
            />
          ) : null}
          <AllPricesTable onBuyButtonClick={openBuySellModal} />
        </>
      )}
    </PageWrapper>
  )
}

export default Home
