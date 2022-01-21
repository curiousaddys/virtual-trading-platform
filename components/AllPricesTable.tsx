import React, { useCallback, useMemo, useState } from 'react'
import { Cell, Row, Table, TableHeader } from './common/Table'
import { useAccountContext } from '../hooks/useAccount'
import { usePricesContext } from '../hooks/usePrices'
import Image from 'next/image'
import { formatUSD } from '../utils/format'
import { PrettyPercent } from './common/PrettyPercent'
import { Price } from '../pages/api/prices'
import { useBuySellModalContext } from '../hooks/useBuySellModal'
import { DateRangePicker, DateRangeValue } from './common/DateRangePicker'

const PeriodAccessors = {
  [DateRangeValue.Hour]: { accessor: 'price_change_percentage_1h_in_currency', label: '1 hr' },
  [DateRangeValue.Day]: { accessor: 'price_change_percentage_24h_in_currency', label: '24 hr' },
  [DateRangeValue.SevenDays]: { accessor: 'price_change_percentage_7d_in_currency', label: '7 d' },
  [DateRangeValue.ThirtyDays]: {
    accessor: 'price_change_percentage_30d_in_currency',
    label: '30 d',
  },
  [DateRangeValue.Year]: { accessor: 'price_change_percentage_1y_in_currency', label: '1 yr' },
  [DateRangeValue.Max]: { accessor: 'price_change_percentage_1y_in_currency', label: 'max' },
} as const

export const AllPricesTable: React.VFC = () => {
  const { accountInfo } = useAccountContext()
  const { prices } = usePricesContext()
  const { openBuyModal } = useBuySellModalContext()
  const [period, setPeriod] = useState<DateRangeValue>(DateRangeValue.Day)

  const allPricesTableHeaders: TableHeader[] = useMemo(
    () => [
      { label: 'Name', accessor: 'name' },
      {},
      { label: 'Price', accessor: 'current_price', alignRight: true },
      {
        label: `Change (${PeriodAccessors[period].label})`,
        accessor: PeriodAccessors[period].accessor,
        alignRight: true,
        hideOnMobile: true,
      },
      { label: 'Volume (24 hr)', accessor: 'total_volume', alignRight: true, hideOnMobile: true },
      {},
    ],
    [period]
  )

  const renderTableRow = useCallback(
    (coin: Price, period: DateRangeValue, userIsLoggedIn: boolean) =>
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
              <PrettyPercent value={coin[PeriodAccessors[period].accessor]} />
            </div>
          </Cell>
          {/*% change*/}
          <Cell alignRight hideOnMobile>
            <PrettyPercent value={coin[PeriodAccessors[period].accessor]} />
          </Cell>
          {/*Volume*/}
          <Cell alignRight hideOnMobile>
            {formatUSD(coin.total_volume, true)}
          </Cell>
          {/*BuySellModal Button*/}

          <Cell alignRight narrow>
            {userIsLoggedIn ? (
              <button
                className={`px-4 py-2 bg-green-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-300 w-[75px]`}
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
    <>
      <div className="mb-2">
        <DateRangePicker
          selectedDays={period}
          onSelectionChange={setPeriod}
          showHourOption={true}
          hideMaxOption={true}
        />
      </div>
      <Table
        title="All Prices"
        headers={allPricesTableHeaders}
        data={prices}
        renderRow={(data) => renderTableRow(data, period, !!accountInfo)}
        limitPerPage={15}
        filterOn={['name', 'symbol']}
        sortBy="total_volume"
      />
    </>
  )
}
