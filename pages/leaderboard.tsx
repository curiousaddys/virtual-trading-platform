import { NextPage } from 'next'
import React, { useEffect } from 'react'
import { useTopPortfolios } from '../hooks/useTopPortfolios'
import { toast } from 'react-toastify'
import { formatUSD } from '../utils/format'
import { PageWrapper } from '../components/common/PageWrapper'

const Settings: NextPage = () => {
  const { topPortfolios, topPortfoliosLoading, topPortfoliosError } = useTopPortfolios()

  useEffect(() => {
    if (!topPortfoliosError) return
    console.error(topPortfoliosError)
    toast('Error loading top portfolio info!', { type: 'error' })
  }, [topPortfoliosError])

  return (
    <PageWrapper title="Top Portfolios">
      <h2 className="text-2xl text-gray-800 font-semibold ml-1">Top Portfolios</h2>
      {/*TODO: improve loading message*/}
      {topPortfoliosLoading && <div>Loading</div>}
      {topPortfoliosError && <div>Error loading account info. Please try again.</div>}
      {topPortfolios && (
        <section className="rounded-2xl border-2 border-gray-200 p-4 bg-white mt-3 mb-6">
          {topPortfolios.map((portfolio, i) => (
            <div key={portfolio._id.toString()} className="grid grid-cols-2 my-4 text-lg">
              <div>
                {i + 1}. <span className="font-bold">{portfolio.accountNickname}</span>
              </div>
              <div>{formatUSD(portfolio.balanceUSD)}</div>
            </div>
          ))}
        </section>
      )}
    </PageWrapper>
  )
}

export default Settings
