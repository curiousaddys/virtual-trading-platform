import React, { useMemo } from 'react'
import { usePricesContext } from '../hooks/usePrices'
import { Table, TableBody, Cell, TableHead, HeaderCell, Row } from './common/Table'
import Image from 'next/image'
import { formatFloat, formatPercent, formatUSD } from '../utils/format'
import { PrettyPercent } from './common/PrettyPercent'
import { Holding } from '../db/portfolios'
import { BuySellAction } from './BuySellModal'
import { useAccountContext } from '../hooks/useAccount'

interface PortfolioTableProps {
  totalPortfolioBalanceUSD: number
  // TODO: move BuySellModal up to top of app & use Context so we don't have to pass things like this around
  onSellButtonClick: (coinID: string, coinName: string, action: BuySellAction) => void
}

export const PortfolioTable: React.VFC<PortfolioTableProps> = (props) => {
  const { accountInfo } = useAccountContext()
  const { prices } = usePricesContext()
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

  return !prices || !holdingsData ? null : (
    <Table>
      <TableHead>
        <HeaderCell label="Name" />
        <HeaderCell />
        <HeaderCell label="Balance" alignRight />
        <HeaderCell label="Total Profit/Loss" alignRight hideOnMobile />
        <HeaderCell label="Allocation" alignRight hideOnMobile />
        <HeaderCell />
      </TableHead>
      <TableBody>
        {holdingsData.map((h) => {
          const coin = prices.find((price) => price.id === h.currency)
          return !coin ? null : (
            <Row key={h.currency}>
              {/*Image*/}
              <Cell
                narrow
                noWrap
                disabled={coin.id === 'USD'}
                href={coin.id !== 'USD' ? `/details/${coin.id}` : undefined}
              >
                <Image src={coin.image} height={40} width={40} alt={coin.symbol} />
              </Cell>
              {/*Name & Symbol*/}
              <Cell
                disabled={coin.id === 'USD'}
                href={coin.id !== 'USD' ? `/details/${coin.id}` : undefined}
              >
                <span className="font-bold text-gray-800">{coin.name}</span>
                <br />
                <span className="font-medium">{coin.symbol.toUpperCase()}</span>
              </Cell>
              {/*Balance*/}
              <Cell alignRight>
                <span className="font-bold text-gray-700 text-base">
                  {formatUSD(coin.current_price * h.amount)}
                </span>
                <br />
                {formatFloat(h.amount)} {coin.symbol.toUpperCase()}
              </Cell>
              {/*P&L*/}
              <Cell alignRight hideOnMobile>
                {coin.id !== 'USD' ? (
                  <>
                    {formatUSD(h.amount * coin.current_price - h.amount * h.avgBuyCost)}
                    <br />
                    {Math.abs(h.amount * coin.current_price - h.amount * h.avgBuyCost).toFixed(
                      2
                    ) !== '0.00' && (
                      <PrettyPercent
                        value={
                          ((h.amount * coin.current_price - h.amount * h.avgBuyCost) /
                            (h.amount * h.avgBuyCost)) *
                          100
                        }
                      />
                    )}
                  </>
                ) : null}
              </Cell>
              {/*Allocation*/}
              <Cell alignRight hideOnMobile>
                {formatPercent(
                  ((coin.current_price * h.amount) / props.totalPortfolioBalanceUSD) * 100,
                  false
                )}
              </Cell>
              {/*BuySellModal Button*/}
              <Cell alignRight>
                {coin.id !== 'USD' ? (
                  <button
                    className="px-4 py-2 bg-green-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-300"
                    style={{ width: 75 }}
                    onClick={() => props.onSellButtonClick(coin.id, coin.name, BuySellAction.Sell)}
                  >
                    Sell
                  </button>
                ) : null}
              </Cell>
            </Row>
          )
        })}
      </TableBody>
    </Table>
  )
}
