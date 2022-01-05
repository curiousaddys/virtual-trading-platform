import React, { Dispatch, SetStateAction } from 'react'

export const DAY_VALUES = {
  hour: '1 hour',
  '1': '1 day',
  '7': '7 days',
  '30': '30 days',
  '365': '1 year',
  max: 'all',
}

export type DateRangeValues = keyof typeof DAY_VALUES

export interface DateRangePickerProps {
  selectedDays: DateRangeValues
  onSelectionChange: Dispatch<SetStateAction<DateRangeValues>>
}

export const DateRangePicker: React.FC<DateRangePickerProps> = (props) => {
  return (
    <div className="w-100 flex flex-row justify-end gap-2 pr-3">
      {Object.keys(DAY_VALUES).map((k) => (
        <div
          className={`uppercase bg-gray-300 rounded py-1 px-3 cursor-pointer select-none ${
            props.selectedDays === k && 'bg-blue-700 text-gray-100'
          }`}
          onClick={() => props.onSelectionChange(k as DateRangeValues)}
          key={k}
        >
          {DAY_VALUES[k as DateRangeValues]}
        </div>
      ))}
    </div>
  )
}
