import type { TableHeader } from './common/Table'
import { Cell, Row, Table } from './common/Table'
import React, { useEffect } from 'react'
import { useTopPortfolios } from '../hooks/useTopPortfolios'
import type { TopPortfolio } from '../db/portfolioHistory'
import { formatUSD } from '../utils/format'
import { toast } from 'react-toastify'
import { TailSpin } from 'react-loader-spinner'

const leaderboardHeaders: TableHeader[] = [
  { label: 'Rank', accessor: 'rowNumber' }, // TODO: return rank # from backend
  { label: 'User', accessor: 'accountNickname' },
  { label: 'Portfolio', accessor: 'portfolioName', hideOnMobile: true },
  { label: 'Balance', accessor: 'balanceUSD', alignRight: true },
]

const renderTableRow = (portfolio: TopPortfolio) => (
  <Row key={portfolio._id.toString()}>
    <Cell narrow>{portfolio.rowNumber}</Cell>
    <Cell>
      <span className="font-bold">{portfolio.accountNickname ?? 'Anonymous User'}</span>
    </Cell>
    <Cell hideOnMobile>{portfolio.portfolioName}</Cell>
    <Cell alignRight={true}>{formatUSD(portfolio.balanceUSD)}</Cell>
  </Row>
)

export const LeaderboardTable = () => {
  const { topPortfolios, topPortfoliosLoading, topPortfoliosError } = useTopPortfolios()

  useEffect(() => {
    if (!topPortfoliosError) return
    console.error(topPortfoliosError)
    toast('Error loading top portfolio info!', { type: 'error' })
  }, [topPortfoliosError])

  return topPortfoliosLoading ? (
    <div className="flex flex-row justify-center">
      <TailSpin height="100" width="100" color="grey" ariaLabel="loading" />
    </div>
  ) : (
    <Table
      title={`Top Portfolios`}
      headers={leaderboardHeaders}
      data={topPortfolios ?? []}
      renderRow={renderTableRow}
      sortBy="balanceUSD"
    />
  )
}
