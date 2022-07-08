import type { Dispatch, SetStateAction } from 'react'
import React, { useMemo } from 'react'
import dayjs from 'dayjs'

export enum DateRangeValue {
  Hour = 'hour',
  Day = '1',
  SevenDays = '7',
  ThirtyDays = '30',
  Year = '365',
  Max = 'max',
}

const dayValues = [
  { value: DateRangeValue.Hour, text: '1 hr', daysRequiredToShow: 0 },
  { value: DateRangeValue.Day, text: '1 d', daysRequiredToShow: 0 },
  // 7 days is currently the default period shown, so we should always at least up to the 7 days button.
  { value: DateRangeValue.SevenDays, text: '7 d', daysRequiredToShow: 0 },
  { value: DateRangeValue.ThirtyDays, text: '30 d', daysRequiredToShow: 7 },
  { value: DateRangeValue.Year, text: '1 yr', daysRequiredToShow: 30 },
  { value: DateRangeValue.Max, text: 'all', daysRequiredToShow: 365 },
]

export interface DateRangePickerProps {
  selectedDays: DateRangeValue
  onSelectionChange: Dispatch<SetStateAction<DateRangeValue>>
  showHourOption?: boolean
  hideMaxOption?: boolean
  minDate?: Date
}

export const DateRangePicker: React.VFC<DateRangePickerProps> = ({
  selectedDays,
  onSelectionChange,
  showHourOption,
  hideMaxOption,
  minDate,
}) => {
  const minDataDaysAgo = useMemo(() => dayjs().diff(minDate, 'day', true), [minDate])

  return (
    <div className="flex flex-row justify-end gap-2">
      {dayValues.map(({ text, value, daysRequiredToShow }) => {
        if (value === DateRangeValue.Hour && !showHourOption) {
          return
        }
        if (value === DateRangeValue.Max && hideMaxOption) {
          return
        }
        return !minDate || minDataDaysAgo >= daysRequiredToShow ? (
          <div
            className={`flex justify-center items-center uppercase bg-gray-300 rounded py-1 px-2 cursor-pointer disabled:cursor-auto select-none text-center text-sm whitespace-nowrap ${
              selectedDays === value && 'bg-blue-700 text-gray-100'
            }`}
            onClick={() => {
              onSelectionChange(value)
            }}
            key={text}
          >
            <div>{text}</div>
          </div>
        ) : null
      })}
    </div>
  )
}
