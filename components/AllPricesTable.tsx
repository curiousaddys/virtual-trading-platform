import React from 'react'
import { Cell, HeaderCell, Row, Table, TableBody, TableHead } from './common/Table'
import { useAccountContext } from '../hooks/useAccount'
import { usePricesContext } from '../hooks/usePrices'
import Image from 'next/image'
import { formatUSD } from '../utils/format'
import { PrettyPercent } from './common/PrettyPercent'
import { BuySellAction } from './BuySellModal'

interface PortfolioTableProps {
  // TODO: move BuySellModal up to top of app & use Context so we don't have to pass things like this around
  onBuyButtonClick: (coinID: string, coinName: string, action: BuySellAction) => void
}

export const AllPricesTable: React.VFC<PortfolioTableProps> = (props) => {
  const { accountInfo } = useAccountContext()
  const { prices } = usePricesContext()
  return prices?.length ? (
    <Table>
      <TableHead>
        <HeaderCell label="Name" />
        <HeaderCell />
        <HeaderCell label="Price" alignRight />
        <HeaderCell label="Change (24h)" alignRight hideOnMobile />
        <HeaderCell label="Volume (24h)" alignRight hideOnMobile />
        {accountInfo ? <HeaderCell /> : null}
      </TableHead>
      <TableBody>
        {prices.map((coin) =>
          coin.id === 'USD' ? null : (
            <Row key={coin.id}>
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
              {/*Price (w/ percent change on mobile)*/}
              <Cell alignRight>
                {formatUSD(coin.current_price)}
                <div className="md:hidden w-100">
                  <PrettyPercent value={coin.price_change_percentage_24h} />
                </div>
              </Cell>
              {/*% change*/}
              <Cell alignRight hideOnMobile>
                <PrettyPercent value={coin.price_change_percentage_24h} />
              </Cell>
              <Cell alignRight hideOnMobile>
                {formatUSD(coin.total_volume, true)}
              </Cell>
              {/*BuySellModal Button*/}
              {accountInfo ? (
                <Cell alignRight>
                  <button
                    className="px-4 py-2 bg-green-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-300"
                    style={{ maxWidth: 75 }}
                    onClick={() => props.onBuyButtonClick(coin.id, coin.name, BuySellAction.Buy)}
                  >
                    Buy
                  </button>
                </Cell>
              ) : null}
            </Row>
          )
        )}
      </TableBody>
    </Table>
  ) : null
}
