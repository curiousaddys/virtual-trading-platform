import type { NextPage } from 'next'
import React, { useEffect, useMemo, useState } from 'react'
import ky from 'ky'
import { useAccountContext } from '../hooks/useAccount'
import { formatUSD } from '../utils/format'
import { DateRangeValue } from '../components/common/DateRangePicker'
import { PortfolioBalanceHistoryResp } from './api/balance_history'
import { toast } from 'react-toastify'
import { usePricesContext } from '../hooks/usePrices'
import { Chart } from '../components/common/Chart'
import { PortfolioTable } from '../components/PortfolioTable'
import { AllPricesTable } from '../components/AllPricesTable'
import { PageWrapper } from '../components/common/PageWrapper'
import dayjs from 'dayjs'
import { WelcomeModal } from '../components/WelcomeModal'

const Home: NextPage = () => {
  const [welcomeModalOpen, setWelcomeModalOpen] = useState<boolean>(false)
  const [welcomeModelSeen, setWelcomeModelSeen] = useState<boolean>(false)
  const { accountInfo, accountError } = useAccountContext()
  const [chartRange, setChartRange] = useState<DateRangeValue>(DateRangeValue.SevenDays)
  const [chartData, setChartData] = useState<PortfolioBalanceHistoryResp | null>(null)
  const [chartDataLoading, setChartDataLoading] = useState<boolean>(false)
  const { prices, pricesLoading, pricesError } = usePricesContext()

  const totalPortfolioBalanceUSD = useMemo(() => {
    if (!prices || !accountInfo?.portfolio.holdings) return 0
    return accountInfo.portfolio.holdings.reduce(
      (acc, cur) =>
        acc + (prices.find((price) => price.id === cur.currency)?.current_price ?? 1) * cur.amount,
      0
    )
  }, [prices, accountInfo])

  // Get fresh data for portfolio price history graph whenever balance changes.
  useEffect(() => {
    if (!totalPortfolioBalanceUSD) {
      return
    }
    setChartDataLoading(true)
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
      } finally {
        setChartDataLoading(false)
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

  // Show the welcome model if the account is less than 1 min old & they haven't set a nickname
  // or dismissed the model since the page loaded.
  useEffect(() => {
    if (!accountInfo?.joined || accountInfo.nickname !== 'Anonymous User' || welcomeModelSeen)
      return
    const joinDateSecAgo = dayjs().diff(accountInfo.joined, 'seconds')
    if (joinDateSecAgo < 60) {
      setWelcomeModalOpen(true)
    }
  }, [accountInfo?.joined, accountInfo?.nickname, welcomeModelSeen])

  return (
    <PageWrapper>
      {pricesLoading ? (
        <div className="text-center">Loading...</div>
      ) : (
        <>
          {prices && accountInfo ? (
            <>
              <section className="mb-2">
                <h2 className="text-3xl text-black font-semibold mt-10">
                  Portfolio Balance: {formatUSD(totalPortfolioBalanceUSD)}
                </h2>
                <p className="text-gray-500">{accountInfo?.address}</p>
              </section>
              <section>
                {chartData ? (
                  <Chart
                    data={chartData}
                    firstAvailableDate={accountInfo.portfolio.created}
                    showHourOption={true}
                    onDateRangeOptionChange={setChartRange}
                    dateDataKey={'timestamp'}
                    valueDataKey={'balanceUSD'}
                    valueLabel={'Balance'}
                    placeholder={chartDataLoading ? 'Loading...' : 'No data'}
                  />
                ) : null}
              </section>
            </>
          ) : null}
          {accountInfo ? (
            <PortfolioTable totalPortfolioBalanceUSD={totalPortfolioBalanceUSD} />
          ) : null}
          <AllPricesTable />
        </>
      )}
      {welcomeModalOpen ? (
        <WelcomeModal
          onClose={() => {
            setWelcomeModelSeen(true)
            setWelcomeModalOpen(false)
          }}
        />
      ) : null}
    </PageWrapper>
  )
}

export default Home
