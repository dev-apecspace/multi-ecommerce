import { ChevronLeft, ChevronRight } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  limit?: number
  onLimitChange?: (limit: number) => void
  total?: number
  variant?: 'default' | 'minimal'
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  limit,
  onLimitChange,
  total,
  variant = 'default'
}: PaginationProps) {
  const startItem = limit ? (currentPage - 1) * limit + 1 : 0
  const endItem = limit && total ? Math.min(currentPage * limit, total) : 0

  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisible = 5

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i)
        pages.push('...')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1)
        pages.push('...')
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i)
      } else {
        pages.push(1)
        pages.push('...')
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i)
        pages.push('...')
        pages.push(totalPages)
      }
    }

    return pages
  }

  if (variant === 'minimal') {
    return (
      <div className="flex items-center justify-center gap-2 py-8">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            currentPage === 1
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </button>

        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, i) => (
            <button
              key={i}
              onClick={() => typeof page === 'number' && onPageChange(page)}
              disabled={page === '...'}
              className={`min-w-[32px] h-8 flex items-center justify-center rounded-md text-sm font-medium transition-all ${
                page === currentPage
                  ? 'bg-white text-primary shadow-sm border border-gray-200'
                  : page === '...'
                  ? 'cursor-default text-gray-400'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {page}
            </button>
          ))}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            currentPage === totalPages
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 py-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <span className="text-sm text-gray-600">
          Hiển thị kết quả từ <span className="font-medium">{startItem}</span> - <span className="font-medium">{endItem}</span> trên tổng <span className="font-medium">{total}</span>
        </span>
        
        {limit && onLimitChange && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Hiển thị</span>
            <Select value={String(limit)} onValueChange={(val) => onLimitChange(Number(val))}>
              <SelectTrigger className="w-[70px] border border-gray-300 rounded-md">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="200">200</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-gray-600">kết quả</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`flex items-center gap-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            currentPage === 1
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <ChevronLeft className="h-4 w-4" />
          Trang trước
        </button>

        <div className="flex gap-1">
          {getPageNumbers().map((page, i) => (
            <button
              key={i}
              onClick={() => typeof page === 'number' && onPageChange(page)}
              disabled={page === '...'}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                page === currentPage
                  ? 'bg-blue-500 text-white shadow-sm'
                  : page === '...'
                  ? 'cursor-default text-gray-500'
                  : 'text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {page}
            </button>
          ))}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`flex items-center gap-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            currentPage === totalPages
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          Trang sau
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
