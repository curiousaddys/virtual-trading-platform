import { DateRangePicker, DateRangeValue } from './DateRangePicker'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import dayjs from 'dayjs'
import { formatUSD } from '../../utils/format'
import React, { useEffect, useMemo, useState } from 'react'

const formatUnixTimestampSingleDay = (t: number) => dayjs.unix(t / 1000).format('hh:mm A')
const formatUnixTimestamp = (t: number) => dayjs.unix(t / 1000).format('MMM D, YYYY')
const formatDateTimestampSingleDay = (t: number) => dayjs(t).format('hh:mm A')
const formatDateTimestamp = (t: number) => dayjs(t).format('MMM D, YYYY')

interface ChartProps {
  data: any[] // TODO: use more specific type?
  dateDataKey: string
  dateIsUnixtime?: boolean
  valueDataKey: number | string
  valueLabel: string
  firstAvailableDate?: Date
  onDateRangeOptionChange: (days: DateRangeValue) => void
  showHourOption?: boolean
  placeholder: React.ReactFragment // Displayed when there is no data.
  minValue?: number
}

export const Chart: React.VFC<ChartProps> = ({
  data,
  onDateRangeOptionChange,
  dateDataKey,
  dateIsUnixtime,
  valueDataKey,
  firstAvailableDate,
  valueLabel,
  showHourOption,
  placeholder,
  minValue,
}) => {
  const [chartRange, setChartRange] = useState<DateRangeValue>(DateRangeValue.SevenDays)

  useEffect(() => {
    onDateRangeOptionChange(chartRange)
  }, [chartRange, onDateRangeOptionChange])

  const tickFormatter = useMemo(() => {
    if (chartRange === DateRangeValue.Hour || chartRange === DateRangeValue.Day) {
      return dateIsUnixtime ? formatUnixTimestampSingleDay : formatDateTimestampSingleDay
    }
    return dateIsUnixtime ? formatUnixTimestamp : formatDateTimestamp
  }, [chartRange, dateIsUnixtime])

  return (
    <div className="rounded pt-3 shadow-lg bg-white mb-10">
      <div className="pr-3">
        <DateRangePicker
          selectedDays={chartRange}
          onSelectionChange={setChartRange}
          minDate={firstAvailableDate}
          showHourOption={showHourOption}
        />
      </div>
      <div className="px-2">
        {!data.length ? (
          <div className="flex text-xl w-full h-[400px]">
            <div className="m-auto">{placeholder}</div>
          </div>
        ) : data.length ? (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart
              data={data}
              margin={{
                top: 10,
                right: 10,
                bottom: 10,
                left: 10,
              }}
            >
              <XAxis
                dataKey={dateDataKey}
                tickFormatter={tickFormatter}
                type="category"
                domain={['dataMin', 'dataMax']}
                minTickGap={15}
                tickMargin={10}
              />
              <YAxis
                domain={[
                  (dataMin: number) => minValue ?? dataMin * 0.9,
                  (dataMax: number) => dataMax * 1.1,
                ]}
                hide
              />
              <Tooltip
                formatter={(value: number) => formatUSD(value)}
                labelFormatter={(t) =>
                  dateIsUnixtime
                    ? dayjs.unix(t / 1000).format('MMM D, YYYY [at] hh:mm A')
                    : dayjs(t).format('MMM D, YYYY [at] hh:mm A')
                }
              />
              <Line
                type="linear"
                dataKey={valueDataKey}
                stroke={'#00008B'}
                dot={false}
                isAnimationActive={true}
                animationDuration={500}
                name={valueLabel}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : null}
      </div>
    </div>
  )
}
