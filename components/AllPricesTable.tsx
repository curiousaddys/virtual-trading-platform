import React, { useMemo, useState } from 'react'
import { Cell, HeaderCell, Row, Table, TableBody, TableHead } from './common/Table'
import { useAccountContext } from '../hooks/useAccount'
import { usePricesContext } from '../hooks/usePrices'
import Image from 'next/image'
import { formatUSD } from '../utils/format'
import { PrettyPercent } from './common/PrettyPercent'
import { BuySellAction } from './BuySellModal'
import { Price } from '../pages/api/prices'
import ReactPaginate from 'react-paginate'
import { usePagination } from '../hooks/usePagination'

interface AllPricesTableProps {
  // TODO: move BuySellModal up to top of app & use Context so we don't have to pass things like this around
  onBuyButtonClick: (coinID: string, coinName: string, action: BuySellAction) => void
}

export const AllPricesTable: React.VFC<AllPricesTableProps> = (props) => {
  const { accountInfo } = useAccountContext()
  const { prices } = usePricesContext()

  const [filterName, setFilterName] = useState<string>('')
  const filteredPrices = useMemo(
    () =>
      prices.filter(
        (price) =>
          price.name.toLowerCase().startsWith(filterName.toLowerCase()) ||
          price.symbol.toLowerCase().startsWith(filterName.toLowerCase())
      ),
    [prices, filterName]
  )

  const { currentItems, pageCount, handlePageClick } = usePagination(filteredPrices, 15)

  const item = (coin: Price) => (
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
      {accountInfo ? (
        <Cell alignRight narrow>
          <button
            className="px-4 py-2 bg-green-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-300"
            style={{ width: 75 }}
            onClick={() => props.onBuyButtonClick(coin.id, coin.name, BuySellAction.Buy)}
          >
            Buy
          </button>
        </Cell>
      ) : null}
    </Row>
  )

  return (
    <>
      <div className="flex flex-row justify-between">
        <h2 className="text-lg text-black font-semibold mt-10">All Prices</h2>
        <input
          className="shadow appearance-none border rounded-3xl py-2 px-6 text-gray-700 leading-tight focus:outline-none focus:shadow-outline place-self-end"
          style={{ minWidth: 275 }}
          type="text"
          aria-label="filter"
          value={filterName}
          placeholder="Search by name or symbol..."
          onChange={(e) => {
            setFilterName(e.target.value)
          }}
        />
      </div>
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
          {currentItems?.length ? (
            currentItems.map((coin) => (coin.id === 'USD' ? null : item(coin)))
          ) : (
            <Row>
              <Cell>No results found</Cell>
            </Row>
          )}
        </TableBody>
      </Table>
      <ReactPaginate
        breakLabel="..."
        nextLabel="next >"
        onPageChange={handlePageClick}
        pageRangeDisplayed={5}
        pageCount={pageCount}
        previousLabel="< previous"
        className="flex flex-row justify-between mx-10 mt-3 text-gray-500"
        activeClassName="font-bold text-blue-500"
        marginPagesDisplayed={1}
        renderOnZeroPageCount={() => null}
      />
    </>
  )
}
