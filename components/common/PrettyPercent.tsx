import { formatPercent } from '../../utils/format'

export interface PrettyPercentProps {
  value: number
}

export const PrettyPercent = (props: PrettyPercentProps) => {
  return (
    <span className={props.value >= 0 ? 'text-green-500' : 'text-red-500'}>
      {formatPercent(props.value)}
    </span>
  )
}
