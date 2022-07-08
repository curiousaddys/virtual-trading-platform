import { useMemo, useState } from 'react'

export const usePagination = <Type>(itemsPerPage: number) => {
  const [allItems, setAllItems] = useState<Type[]>([] as Type[])
  const [pageNumber, setPageNumber] = useState(0)

  const pageCount = useMemo(() => {
    return Math.floor(allItems.length / itemsPerPage)
  }, [allItems.length, itemsPerPage])

  const currentItems = useMemo(() => {
    const startOffset = (pageNumber * itemsPerPage) % allItems.length
    const endOffset = startOffset + itemsPerPage
    return allItems.slice(startOffset, endOffset)
  }, [allItems, itemsPerPage, pageNumber])

  return { currentItems, setAllItems, pageCount, pageNumber, setPageNumber }
}
