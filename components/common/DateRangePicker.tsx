import React, { Dispatch, SetStateAction } from 'react'
import { DateRangeValues, DAY_VALUES } from '../../utils/constants'

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
