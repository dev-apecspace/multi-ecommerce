import { useState, useCallback } from 'react'

export interface PaginationState {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface UsePaginationOptions {
  initialPage?: number
  initialLimit?: number
}

export function usePagination(options: UsePaginationOptions = {}) {
  const { initialPage = 1, initialLimit = 10 } = options

  const [page, setPage] = useState(initialPage)
  const [limit, setLimit] = useState(initialLimit)
  const [total, setTotal] = useState(0)

  const totalPages = Math.ceil(total / limit)

  const goToPage = useCallback((newPage: number) => {
    const pageNum = Math.max(1, Math.min(newPage, totalPages))
    setPage(pageNum)
  }, [totalPages])

  const nextPage = useCallback(() => {
    goToPage(page + 1)
  }, [page, goToPage])

  const prevPage = useCallback(() => {
    goToPage(page - 1)
  }, [page, goToPage])

  const setPageLimit = useCallback((newLimit: number) => {
    setLimit(newLimit)
    setPage(1)
  }, [])

  const reset = useCallback(() => {
    setPage(initialPage)
    setLimit(initialLimit)
    setTotal(0)
  }, [initialPage, initialLimit])

  return {
    page,
    limit,
    total,
    totalPages,
    setPage,
    goToPage,
    nextPage,
    prevPage,
    setTotal,
    setPageLimit,
    reset,
    offset: (page - 1) * limit
  }
}
