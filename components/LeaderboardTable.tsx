import { Cell, Row, Table, TableHeader } from './common/Table'
import React, { useEffect } from 'react'
import { useTopPortfolios } from '../hooks/useTopPortfolios'
import { TopPortfolio } from '../db/portfolioHistory'
import { formatUSD } from '../utils/format'
import { toast } from 'react-toastify'

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
      <span className="font-bold">{portfolio.accountNickname}</span>
    </Cell>
    <Cell>{portfolio.portfolioName}</Cell>
    <Cell alignRight={true}>{formatUSD(portfolio.balanceUSD)}</Cell>
  </Row>
)

export const LeaderboardTable = () => {
  const { topPortfolios, topPortfoliosError } = useTopPortfolios()

  useEffect(() => {
    if (!topPortfoliosError) return
    console.error(topPortfoliosError)
    toast('Error loading top portfolio info!', { type: 'error' })
  }, [topPortfoliosError])

  return (
    <Table
      title={`Top Portfolios`}
      headers={leaderboardHeaders}
      data={topPortfolios ?? []}
      renderRow={renderTableRow}
      sortBy="balanceUSD"
    />
  )
}
