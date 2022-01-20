import React, { useCallback } from 'react'
import { Cell, Row, Table, TableHeader } from './common/Table'
import { useAccountContext } from '../hooks/useAccount'
import { usePricesContext } from '../hooks/usePrices'
import Image from 'next/image'
import { formatUSD } from '../utils/format'
import { PrettyPercent } from './common/PrettyPercent'
import { Price } from '../pages/api/prices'
import { useBuySellModalContext } from '../hooks/useBuySellModal'

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
  // TODO: delete this once sure you don't need to pass any props
}

export const AllPricesTable: React.VFC<AllPricesTableProps> = () => {
  const { accountInfo } = useAccountContext()
  const { prices } = usePricesContext()
  const { openBuyModal } = useBuySellModalContext()

  const renderTableRow = useCallback(
    (coin: Price, userIsLoggedIn: boolean) =>
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
            {userIsLoggedIn ? (
              <button
                className={`px-4 py-2 bg-green-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-300`}
                style={{ width: 75 }}
                onClick={() => {
                  openBuyModal({ value: coin.id, label: coin.name })
                }}
              >
                Buy
              </button>
            ) : null}
          </Cell>
        </Row>
      ),
    [openBuyModal]
  )

  return (
    <Table
      title="All Prices"
      headers={allPricesTableHeaders}
      data={prices}
      renderRow={(data) => renderTableRow(data, !!accountInfo)}
      limitPerPage={15}
      filterOn={['name', 'symbol']}
      sortBy="total_volume"
    />
  )
}
