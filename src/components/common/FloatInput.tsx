import React, { useCallback, useEffect, useState } from 'react'
import { trimToPrecision } from '../../utils/format'

interface FloatInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: number
  onValueChange: (newValue: number) => void
  precision?: number
}

export const FloatInput: React.VFC<FloatInputProps> = (props) => {
  const { value, onValueChange, precision } = props
  const [stringValue, setStringValue] = useState(() =>
    trimToPrecision(props.value.toString(), props.precision)
  )

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      // const newValue = e.target.value
      const newValue = trimToPrecision(e.target.value, precision)

      setStringValue(newValue)

      // if input is empty, default to a value of 0, otherwise parse
      const parsedValue = newValue ? parseFloat(newValue) : 0
      // only update if the newly typed value is actually numerically different
      if (!isNaN(parsedValue) && parsedValue !== value) {
        onValueChange(parsedValue)
      }
    },
    [value, onValueChange, precision]
  )

  // if they've typed any number other than 0, don't allowed 0-prefixed numbers
  useEffect(() => {
    if (stringValue && parseFloat(stringValue) !== 0 && stringValue.startsWith('0')) {
      setStringValue(parseFloat(stringValue).toString())
    }
  }, [stringValue])

  // if the user has typed something, and it differs numerically from props.value, update the input value
  useEffect(() => {
    if (stringValue && value !== parseFloat(stringValue)) {
      setStringValue(trimToPrecision(value.toString(), precision))
    }
  }, [value, precision, stringValue])

  const inputProps = { ...props, value: undefined, onValueChange: undefined }
  delete inputProps.value
  delete inputProps.onValueChange

  return <input {...inputProps} onChange={onChange} value={stringValue} />
}
