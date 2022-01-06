import { useEffect, useState } from 'react'

export const useQueryString = (name: string) => {
  const [value, setValue] = useState<string>('')

  useEffect(() => {
    const queryString = window.location.search
    const urlParams = new URLSearchParams(queryString)
    setValue(urlParams.get(name) ?? '')
  }, [name])

  return value
}
