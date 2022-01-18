import type { NextPage } from 'next'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import ky from 'ky'
import { useAccountContext } from '../hooks/useAccount'
import { formatUSD } from '../utils/format'
import { BuySellAction, BuySellModal, SelectedOption } from '../components/BuySellModal'
import { DateRangeValue } from '../components/common/DateRangePicker'
import { PortfolioBalanceHistoryResp } from './api/balance_history'
import { toast } from 'react-toastify'
import { usePricesContext } from '../hooks/usePrices'
import { Chart } from '../components/common/Chart'
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
                {chartData && (
                  <Chart
                    isLoading={!chartData}
                    data={chartData}
                    firstAvailableDate={accountInfo.portfolio.created}
                    onDateRangeOptionChange={setChartRange}
                    dateDataKey={'timestamp'}
                    valueDataKey={'balanceUSD'}
                    valueLabel={'Balance'}
                  />
                )}
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
