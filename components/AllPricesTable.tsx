import React, { useCallback } from 'react'
import { Cell, Row, Table, TableHeader } from './common/Table'
import { useAccountContext } from '../hooks/useAccount'
import { usePricesContext } from '../hooks/usePrices'
import Image from 'next/image'
import { formatUSD } from '../utils/format'
import { PrettyPercent } from './common/PrettyPercent'
import { BuySellAction } from './BuySellModal'
import { Price } from '../pages/api/prices'

const allPricesTableHeaders: TableHeader[] = [
  { label: 'Name', accessor: 'name' },
  {},
  { label: 'Price', accessor: 'current_price', alignRight: true },
  {
    label: 'Change (24h)',
    accessor: 'price_change_percentage_24h',
    alignRight: true,
    hideOnMobile: true,
  },
  { label: 'Volume (24h)', accessor: 'total_volume', alignRight: true, hideOnMobile: true },
  {},
]

interface AllPricesTableProps {
  // TODO: move BuySellModal up to top of app & use Context so we don't have to pass things like this around
  onBuyButtonClick: (coinID: string, coinName: string, action: BuySellAction) => void
}

export const AllPricesTable: React.VFC<AllPricesTableProps> = (props) => {
  const { accountInfo } = useAccountContext()
  const { prices } = usePricesContext()

  const renderTableRow = useCallback(
    (coin: Price) =>
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
          {/*Volume*/}
          <Cell alignRight hideOnMobile>
            {formatUSD(coin.total_volume, true)}
          </Cell>
          {/*BuySellModal Button*/}

          <Cell alignRight narrow>
            {accountInfo ? (
              <button
                className="px-4 py-2 bg-green-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-300"
                style={{ width: 75 }}
                onClick={() => props.onBuyButtonClick(coin.id, coin.name, BuySellAction.Buy)}
              >
                Buy
              </button>
            ) : null}
          </Cell>
        </Row>
      ),
    [accountInfo, props]
  )

  return (
    <Table
      title="All Prices"
      headers={allPricesTableHeaders}
      data={prices}
      renderRow={renderTableRow}
      limitPerPage={15}
      filterOn={['name', 'symbol']}
      sortBy="current_price"
    />
  )
}
