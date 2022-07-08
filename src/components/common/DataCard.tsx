import React from 'react'
import { PrettyPercent } from './PrettyPercent'
import { formatUSD } from '../../utils/format'

type NumberFormatOption = 'percent' | 'usd' | 'usdNoCents' | 'int'

interface DataCardProps {
  title: string
  value: number | string
  format?: NumberFormatOption
  className?: React.HTMLAttributes<HTMLDivElement>['className']
}

const renderValueWithFormat = (value: number | string, format: NumberFormatOption | undefined) => {
  if (typeof value === 'string') return value
  switch (format) {
    case 'int':
      return parseInt(value.toString())
    case 'percent':
      return <PrettyPercent value={value} />
    case 'usd':
      return formatUSD(value)
    case 'usdNoCents':
      return formatUSD(value, true)
  }
}

export const DataCard: React.VFC<DataCardProps> = (props) => (
  <div className={props.className}>
    <div className="overflow-hidden">
      <div className="px-6 py-4 text-center">
        <div className="font-normal text-lg mb-2 text-gray-700">{props.title}</div>
        <div className="text-2xl font-medium text-gray-800">
          {renderValueWithFormat(props.value, props.format)}
        </div>
      </div>
    </div>
  </div>
)
