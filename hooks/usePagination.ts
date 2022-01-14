import { useEffect, useMemo, useState } from 'react'

export const usePagination = <Type>(items: Type[], itemsPerPage: number) => {
  const [currentItems, setCurrentItems] = useState<null | Type[]>(null)
  const [itemOffset, setItemOffset] = useState(0)
  const pageCount = useMemo(() => {
    return Math.floor(items.length / itemsPerPage)
  }, [items.length, itemsPerPage])

  useEffect(() => {
    const endOffset = itemOffset + itemsPerPage
    setCurrentItems(items.slice(itemOffset, endOffset))
  }, [itemOffset, items, itemsPerPage])

  const handlePageClick = (event: { selected: number }) => {
    const newOffset = (event.selected * itemsPerPage) % items.length
    setItemOffset(newOffset)
  }

  return { currentItems, pageCount, handlePageClick }
}
