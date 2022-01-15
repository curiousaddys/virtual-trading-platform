import React from 'react'
import Link from 'next/link'

export const Table: React.FC = ({ children }) => (
  <div className="shadow border mt-2 bg-white">
    <table className="table-auto w-full">{children}</table>
  </div>
)

export const TableHead: React.FC = ({ children }) => (
  <thead className="bg-gray-50">
    <tr>{children}</tr>
  </thead>
)

interface HeaderCellProps {
  label?: string
  alignRight?: boolean
  hideOnMobile?: boolean
}

export const HeaderCell: React.VFC<HeaderCellProps> = (props) => (
  <th
    className={`px-4 py-2 text-xs text-gray-500 text-${props.alignRight ? 'right' : 'left'} ${
      props.hideOnMobile ? 'hidden md:table-cell' : ''
    }`}
  >
    {props.label}
  </th>
)

export const TableBody: React.FC = ({ children }) => <tbody className="bg-white">{children}</tbody>

export const Row: React.FC = ({ children }) => <tr className="even:bg-gray-50">{children}</tr>

interface CellProps {
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
