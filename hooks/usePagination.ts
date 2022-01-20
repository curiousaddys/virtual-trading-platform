import { useEffect, useMemo, useState } from 'react'

export const usePagination = <Type>(itemsPerPage: number) => {
  const [allItems, setAllItems] = useState<Type[]>([] as Type[])
  const [currentItems, setCurrentItems] = useState<Type[]>([])
  const [pageNumber, setPageNumber] = useState(0)
  const pageCount = useMemo(() => {
    return Math.floor(allItems.length / itemsPerPage)
  }, [allItems.length, itemsPerPage])

  useEffect(() => {
    const startOffset = (pageNumber * itemsPerPage) % allItems.length
    const endOffset = startOffset + itemsPerPage
    setCurrentItems(allItems.slice(startOffset, endOffset))
  }, [allItems, allItems.length, itemsPerPage, pageNumber])

  return { currentItems, setAllItems, pageCount, pageNumber, setPageNumber }
}
