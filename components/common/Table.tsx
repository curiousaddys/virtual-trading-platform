import React from 'react'

export const Table: React.FC = ({ children }) => (
  <div className="shadow border mt-2">
    <table className="table-auto w-full">{children}</table>
  </div>
)

interface TableHeaderOptions {
  label: string
  align: 'left' | 'right'
  hideOnMobile?: boolean
}

export const TableHead: React.VFC<{ headers: TableHeaderOptions[] }> = ({ headers }) => (
  <thead className="bg-gray-50">
    <tr>
      {headers.map((header) => (
        <th
          key={header.label}
          className={`px-4 py-2 text-xs text-gray-500 text-${header.align} ${
            header.hideOnMobile ? 'hidden md:table-cell' : ''
          }`}
        >
          {header.label}
        </th>
      ))}
    </tr>
  </thead>
)

export const TableBody: React.FC = ({ children }) => (
  // TODO: WIP
  <tbody className="bg-white">{children}</tbody>
)

export const TableRow: React.FC = ({ children }) => (
  // TODO: WIP
  <tr className="even:bg-gray-50">{children}</tr>
)

interface TableCellOptions {
  align: 'left' | 'right'
  hideOnMobile?: boolean
  bold?: boolean // TODO: use this
  disabled?: boolean // TODO: use this
  isLink?: boolean // TODO: use this
  narrow?: boolean // TODO: use this
  noWrap?: boolean // TODO: use this
}

export const TableCell: React.FC<{ options: TableCellOptions }> = ({ options, children }) => (
  // TODO: WIP
  <td
    className={`
      px-4 py-4 text-sm
      text-${options.align}
      text-gray-${options.bold ? '900 font-bold' : '500'}
      ${options.noWrap ? 'whitespace-nowrap' : ''}
      ${options.isLink ? 'cursor-pointer' : ''} ${options.narrow ? 'w-px' : ''}
      ${options.disabled ? 'opacity-50 cursor-not-allowed' : ''}
      ${options.hideOnMobile ? 'hidden md:table-cell' : ''}
    `}
  >
    {children}
  </td>
)
