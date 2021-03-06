import Image from 'next/image'
import React, { useCallback, useMemo } from 'react'
import type { Holding } from '../db/portfolios'
import { useAccountContext } from '../hooks/useAccount'
import { useBuySellModalContext } from '../hooks/useBuySellModal'
import { usePricesContext } from '../hooks/usePrices'
import type { Price } from '../pages/api/prices'
import { formatFloat, formatPercent, formatUSD } from '../utils/format'
import { PrettyPercent } from './common/PrettyPercent'
import type { TableHeader } from './common/Table'
import { Cell, Row, Table } from './common/Table'

interface PortfolioTableRow {
  id: string
  name: string
  symbol: string
  image: string
  balanceAmount: number
  balanceValue: number
  profitAmt: number
  profitPct: number
  allocation: number
}

const portfolioTableHeaders: TableHeader[] = [
  { label: 'Name', accessor: 'name' },
  {},
  { label: 'Balance', accessor: 'balanceValue', alignRight: true },
  { label: 'Total Profit/Loss', accessor: 'profitAmt', alignRight: true, hideOnMobile: true },
  { label: 'Allocation', accessor: 'allocation', alignRight: true, hideOnMobile: true },
  {},
]

const calculateTableData = (
  holdings: Holding[],
  prices: Price[],
  totalBalance: number
): PortfolioTableRow[] =>
  holdings.flatMap((h) => {
    const coin = prices.find((price) => price.id === h.currency)
    if (!coin || !h.amount) return []
    return {
      id: coin.id,
      name: coin.name,
      symbol: coin.symbol.toUpperCase(),
      image: coin.image,
      balanceAmount: h.amount,
      balanceValue: coin.current_price * h.amount,
      profitAmt: h.amount * coin.current_price - h.amount * h.avgBuyCost,
      profitPct:
        ((h.amount * coin.current_price - h.amount * h.avgBuyCost) / (h.amount * h.avgBuyCost)) *
        100,
      allocation: ((coin.current_price * h.amount) / totalBalance) * 100,
    }
  })

interface PortfolioTableProps {
  totalPortfolioBalanceUSD: number
}

export const PortfolioTable: React.VFC<PortfolioTableProps> = (props) => {
  const { accountInfo } = useAccountContext()
  const { prices } = usePricesContext()
  const { openSellModal } = useBuySellModalContext()

  const tableData = useMemo(
    (): PortfolioTableRow[] =>
      !accountInfo
        ? []
        : calculateTableData(
            accountInfo.portfolio.holdings,
            prices,
            props.totalPortfolioBalanceUSD
          ),
    [accountInfo, prices, props.totalPortfolioBalanceUSD]
  )

  const renderTableRow = useCallback(
    (data: PortfolioTableRow) => (
      <Row key={data.id}>
        {/*Image*/}
        <Cell
          narrow
          noWrap
          disabled={data.id === 'USD'}
          href={data.id !== 'USD' ? `/details/${data.id}` : undefined}
        >
          <Image src={data.image} height={40} width={40} alt={data.symbol} />
        </Cell>
        {/*Name & Symbol*/}
        <Cell
          disabled={data.id === 'USD'}
          href={data.id !== 'USD' ? `/details/${data.id}` : undefined}
        >
          <span className="font-bold text-gray-800">{data.name}</span>
          <br />
          <span className="font-medium">{data.symbol.toUpperCase()}</span>
        </Cell>
        {/*Balance*/}
        <Cell alignRight>
          <span className="font-bold text-gray-700 text-base">{formatUSD(data.balanceValue)}</span>
          <br />
          {formatFloat(data.balanceAmount)} {data.symbol.toUpperCase()}
        </Cell>
        {/*P&L*/}
        <Cell alignRight hideOnMobile>
          {data.id !== 'USD' ? (
            <>
              {formatUSD(data.profitAmt)}
              <br />
              {Math.abs(data.profitAmt) > 0 ? <PrettyPercent value={data.profitPct} /> : null}
            </>
          ) : null}
        </Cell>
        {/*Allocation*/}
        <Cell alignRight hideOnMobile>
          {formatPercent(data.allocation, false)}
        </Cell>
        {/*BuySellModal Button*/}
        <Cell alignRight>
          {data.id !== 'USD' ? (
            // <BuySellModal currency={{ value: data.id, label: data.name }} action={BuySellAction.Sell} />
            <button
              className="px-4 py-2 bg-green-500 text-white text-base font-medium rounded-md shadow-sm hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-300 w-[75px]"
              onClick={() => {
                openSellModal({ value: data.id, label: data.name })
              }}
            >
              Sell
            </button>
          ) : null}
        </Cell>
      </Row>
    ),
    [openSellModal]
  )

  return !accountInfo || !tableData ? null : (
    <Table
      title={`Your Portfolio: ${accountInfo.portfolio.name}`}
      headers={portfolioTableHeaders}
      data={tableData}
      renderRow={renderTableRow}
      filterOn={['name', 'symbol']}
      sortBy="balanceValue"
    />
  )
}
