import React, { ReactNode, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import ReactPaginate from 'react-paginate'
import { usePagination } from '../../hooks/usePagination'

export interface TableProps {
  title?: string
  headers: TableHeader[]
  data: any[] // TODO: consider using generics
  renderRow: (value: any, index: number) => ReactNode
  limitPerPage?: number
  filterOn?: string[]
  sortBy?: string
}

export const Table: React.VFC<TableProps> = (props) => {
  const { setAllItems, currentItems, pageCount, pageNumber, setPageNumber } = usePagination(
    props.limitPerPage ?? props.data.length
  )

  // TODO: consider moving sorting & filtering to a hook
  const [filterQuery, setFilterQuery] = useState<string>('')
  const [sortField, setSortField] = useState(props.sortBy ?? 0)
  const [sortDesc, setSortDesc] = useState<boolean>(true)
  // Sort & filter.
  useEffect(() => {
    console.log('Running')
    setPageNumber(0)
    setAllItems(
      props.data
        .filter((item) => {
          if (!props.filterOn?.length) return true
          return props.filterOn?.some((filter) =>
            item[filter].toLowerCase().startsWith(filterQuery.toLowerCase())
          )
        })
        .sort((a, b) => {
          if (typeof a[sortField] === 'string') {
            return sortDesc
              ? b[sortField].localeCompare(a[sortField])
              : a[sortField].localeCompare(b[sortField])
          }
          return sortDesc ? b[sortField] - a[sortField] : a[sortField] - b[sortField]
        })
    )
  }, [props.filterOn, props.data, filterQuery, sortField, sortDesc, setAllItems, setPageNumber])

  const handleHeaderClick = useCallback(
    (accessor: string) => {
      if (sortField === accessor) {
        setSortDesc((prev) => !prev)
      }
      setSortField(accessor)
    },
    [sortField]
  )

  return (
    <>
      <div className="flex flex-row justify-between">
        {/*Title*/}
        <h2 className="text-lg text-black font-semibold">{props.title}</h2>
        {/*Search field*/}
        {!props.filterOn ? null : (
          <div className="flex flex-col justify-end">
            <input
              className="shadow appearance-none border rounded-3xl py-2 px-6 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              style={{ minWidth: 275 }}
              type="text"
              aria-label="filter"
              value={filterQuery}
              placeholder="Search..." // TODO: consider adding a proper for search field (i.e. Search by name or symbol...)
              onChange={(e) => {
                setFilterQuery(e.target.value)
              }}
            />
          </div>
        )}
      </div>
      <div className="mb-10">
        <div className="shadow border mt-2 bg-white">
          <table className="table-auto w-full">
            <thead className="bg-gray-50">
              <tr>
                {props.headers.map((header, i) => (
                  <HeaderCell
                    key={i}
                    isSortedAsc={!sortDesc && sortField === header.accessor}
                    isSortedDesc={sortDesc && sortField === header.accessor}
                    {...header}
                    onClick={handleHeaderClick}
                  />
                ))}
              </tr>
            </thead>
            <tbody className="bg-white">
              {currentItems.length ? (
                currentItems.map(props.renderRow)
              ) : filterQuery ? (
                <Row>
                  <Cell>No results found.</Cell>
                </Row>
              ) : null}
            </tbody>
          </table>
        </div>
        {props.limitPerPage ? (
          <ReactPaginate
            breakLabel="..."
            nextLabel="next >"
            onPageChange={(e) => setPageNumber(e.selected)}
            pageRangeDisplayed={5}
            pageCount={pageCount}
            previousLabel="< previous"
            // TODO: improve styling
            className="flex flex-row justify-between mx-10 mt-3 text-gray-500"
            activeClassName="font-bold text-blue-500"
            marginPagesDisplayed={1}
            renderOnZeroPageCount={() => null}
            forcePage={pageNumber}
          />
        ) : null}
      </div>
    </>
  )
}

export interface TableHeader {
  label?: string
  accessor?: string // TODO: use keyof type of data in table?
  hideOnMobile?: boolean
  onClick?: (accessor: string) => void
  alignRight?: boolean
  isSortedAsc?: boolean
  isSortedDesc?: boolean
}

const HeaderCell: React.VFC<TableHeader> = (props) => (
  <th
    className={`px-4 py-2 text-xs text-gray-500 text-${props.alignRight ? 'right' : 'left'} ${
      props.hideOnMobile ? 'hidden md:table-cell' : ''
    } ${props.accessor ? 'cursor-pointer' : ''}`}
    onClick={() => {
      props.onClick && props.accessor ? props.onClick(props.accessor) : undefined
    }}
  >
    {props.label} {props.isSortedAsc && '⬆️'} {props.isSortedDesc && '⬇️'}
  </th>
)

export const Row: React.FC = ({ children }) => <tr className="even:bg-gray-50">{children}</tr>

export interface CellProps {
  alignRight?: boolean
  hideOnMobile?: boolean
  disabled?: boolean
  narrow?: boolean
  noWrap?: boolean
  href?: string
}

export const Cell: React.FC<CellProps> = (props) => {
  const td = (
    <td
      className={`
      px-4 py-4 text-sm text-gray-500
      text-${props.alignRight ? 'right' : 'left'}
      ${props.noWrap ? 'whitespace-nowrap' : ''}
      ${props.href ? 'cursor-pointer' : ''} ${props.narrow ? 'w-px' : ''}
      ${props.disabled ? 'opacity-50 cursor-not-allowed' : ''}
      ${props.hideOnMobile ? 'hidden md:table-cell' : ''}
    `}
    >
      {props.children}
    </td>
  )
  return props.href ? (
    <Link href={props.href} passHref>
      {td}
    </Link>
  ) : (
    td
  )
}
