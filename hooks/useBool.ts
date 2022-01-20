import { useState } from 'react'

export const useBool = (initialState: boolean = false): [boolean, () => void, () => void] => {
  const [state, setState] = useState(initialState)
  const setTrue = () => {
    setState(true)
  }
  const setFalse = () => {
    setState(false)
  }
  return [state, setTrue, setFalse]
}
