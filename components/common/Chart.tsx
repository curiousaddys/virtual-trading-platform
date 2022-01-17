import { DateRangePicker, DateRangeValue } from './DateRangePicker'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import dayjs from 'dayjs'
import { formatUSD } from '../../utils/format'
import React, { useEffect, useState } from 'react'

interface ChartProps {
  data: any[] // TODO: use more specific type?
  dateDataKey: string
  dateIsUnixtime?: boolean
  valueDataKey: number | string
  valueLabel: string
  isLoading: boolean
  firstAvailableDate?: Date
  onDateRangeOptionChange: (days: DateRangeValue) => void
}

export const Chart: React.VFC<ChartProps> = ({
  data,
  isLoading,
  onDateRangeOptionChange,
  dateDataKey,
  dateIsUnixtime,
  valueDataKey,
  firstAvailableDate,
  valueLabel,
}) => {
  const [chartRange, setChartRange] = useState<DateRangeValue>(DateRangeValue.SevenDays)

  useEffect(() => {
    onDateRangeOptionChange(chartRange)
  }, [chartRange, onDateRangeOptionChange])

  return (
    <div className="rounded pt-3 shadow-lg bg-white">
      <DateRangePicker
        selectedDays={chartRange}
        onSelectionChange={setChartRange}
        minDate={firstAvailableDate}
      />
      <div className="px-2">
        {isLoading ? (
          // TODO: add nicer loading indicator
          <div style={{ height: 400, width: '100%' }} className="flex text-xl">
            <div className="m-auto">Loading...</div>
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
                tickFormatter={(t) => {
                  if (dateIsUnixtime) {
                    return chartRange === DateRangeValue.Day
                      ? dayjs.unix(t / 1000).format('hh:mm A')
                      : dayjs.unix(t / 1000).format('MMM D, YYYY')
                  }
                  return chartRange === DateRangeValue.Hour || chartRange === DateRangeValue.Day
                    ? dayjs(t).format('hh:mm A')
                    : dayjs(t).format('MMM D, YYYY')
                }}
                type="category"
                domain={['dataMin', 'dataMax']}
                minTickGap={15}
                tickMargin={10}
              />
              <YAxis
                domain={[(dataMin: number) => dataMin * 0.9, (dataMax: number) => dataMax * 1.1]}
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
