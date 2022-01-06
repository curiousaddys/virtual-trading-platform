import React, { Dispatch, SetStateAction } from 'react'

export enum DateRangeValue {
  Hour = 'hour',
  Day = '1',
  SevenDays = '7',
  ThirtyDays = '30',
  Year = '365',
  Max = 'max',
}

const dayValues = [
  { value: DateRangeValue.Hour, text: '1 hour' },
  { value: DateRangeValue.Day, text: '1 day' },
  { value: DateRangeValue.SevenDays, text: '7 days' },
  { value: DateRangeValue.ThirtyDays, text: '30 days' },
  { value: DateRangeValue.Year, text: '1 year' },
  { value: DateRangeValue.Max, text: 'all' },
]

export interface DateRangePickerProps {
  selectedDays: DateRangeValue
  onSelectionChange: Dispatch<SetStateAction<DateRangeValue>>
  showHourOption?: boolean
}

export const DateRangePicker: React.FC<DateRangePickerProps> = (props) => {
  return (
    <div className="w-100 flex flex-row justify-end gap-2 pr-3">
      {dayValues.map(({ text, value }) => {
        if (value === DateRangeValue.Hour && !props.showHourOption) {
          return
        }
        return (
          <div
            className={`uppercase bg-gray-300 rounded py-1 px-3 cursor-pointer disabled:cursor-auto select-none text-center ${
              props.selectedDays === value && 'bg-blue-700 text-gray-100'
            }`}
            style={{ width: 88 }}
            onClick={() => {
              props.onSelectionChange(value)
            }}
            key={text}
          >
            {text}
          </div>
        )
      })}
    </div>
  )
}
