import { formatPercent } from '../../utils/format'
import React from 'react'

export interface PrettyPercentProps {
  value: number
}

export const PrettyPercent: React.VFC<PrettyPercentProps> = (props) => {
  return (
    <span className={props.value >= 0 ? 'text-green-500' : 'text-red-500'}>
      {formatPercent(props.value)}
    </span>
  )
}
