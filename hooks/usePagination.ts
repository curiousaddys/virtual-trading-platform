import { useEffect, useMemo, useState } from 'react'

export const usePagination = <Type>(itemsPerPage: number) => {
  const [allItems, setAllItems] = useState<Type[]>([] as Type[])
  const [currentItems, setCurrentItems] = useState<Type[]>([])
  const [itemOffset, setItemOffset] = useState(0)
  const pageCount = useMemo(() => {
    return Math.floor(allItems.length / itemsPerPage)
  }, [allItems.length, itemsPerPage])

  useEffect(() => {
    const endOffset = itemOffset + itemsPerPage
    setCurrentItems(allItems.slice(itemOffset, endOffset))
  }, [itemOffset, allItems, itemsPerPage])

  const handlePageClick = (event: { selected: number }) => {
    const newOffset = (event.selected * itemsPerPage) % allItems.length
    setItemOffset(newOffset)
  }

  return { currentItems, setAllItems, pageCount, handlePageClick }
}
