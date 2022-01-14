import React from 'react'
import { usePricesContext } from '../hooks/usePrices'
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from './common/Table'
import Image from 'next/image'
import { formatFloat, formatPercent, formatUSD } from '../utils/format'
import { PrettyPercent } from './common/PrettyPercent'
import { Holding } from '../db/portfolios'
import { BuySellAction } from './BuySellModal'

interface PortfolioTableProps {
  holdings: Holding[]
  totalPortfolioBalanceUSD: number
  // TODO: move BuySellModal up to top of app & use Context so we don't have to pass things like this around
  onSellButtonClick: (coinID: string, coinName: string, action: BuySellAction) => void
}

export const PortfolioTable: React.VFC<PortfolioTableProps> = (props) => {
  const { prices } = usePricesContext()
  return !prices || !props.holdings ? null : (
    <Table>
      <TableHead>
        <TableHeaderCell label="Name" />
        <TableHeaderCell />
        <TableHeaderCell label="Balance" alignRight />
        <TableHeaderCell label="Total Profit/Loss" alignRight hideOnMobile />
        <TableHeaderCell label="Allocation" alignRight hideOnMobile />
        <TableHeaderCell />
      </TableHead>
      <TableBody>
        {props.holdings.map((h) => {
          const coin = prices.find((price) => price.id === h.currency)
          return !coin ? null : (
            <TableRow key={h.currency}>
              {/*Image*/}
              <TableCell
                narrow
                noWrap
                disabled={coin.id === 'USD'}
                href={coin.id !== 'USD' ? `/details/${coin.id}` : undefined}
              >
                <Image src={coin.image} height={40} width={40} alt={coin.symbol} />
              </TableCell>
              {/*Name & Symbol*/}
              <TableCell
                disabled={coin.id === 'USD'}
                href={coin.id !== 'USD' ? `/details/${coin.id}` : undefined}
              >
                <span className="font-bold text-gray-800">{coin.name}</span>
                <br />
                <span className="font-medium">{coin.symbol.toUpperCase()}</span>
              </TableCell>
              {/*Balance*/}
              <TableCell alignRight>
                <span className="font-bold text-gray-700 text-base">
                  {formatUSD(coin.current_price * h.amount)}
                </span>
                <br />
                {formatFloat(h.amount)} {coin.symbol.toUpperCase()}
              </TableCell>
              {/*P&L*/}
              <TableCell alignRight hideOnMobile>
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
              </TableCell>
              {/*Allocation*/}
              <TableCell alignRight hideOnMobile>
                {formatPercent(
                  ((coin.current_price * h.amount) / props.totalPortfolioBalanceUSD) * 100,
                  false
                )}
              </TableCell>
              {/*BuySellModal*/}
              <TableCell alignRight>
                {coin.id !== 'USD' && (
                  <button
                    className="px-4 py-2 bg-green-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-300"
                    style={{ maxWidth: 75 }}
                    onClick={() => props.onSellButtonClick(coin.id, coin.name, BuySellAction.Sell)}
                  >
                    Sell
                  </button>
                )}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
