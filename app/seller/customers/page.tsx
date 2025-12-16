"use client"

import { useEffect, useState } from "react"
import { Search } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/auth-context"
import { usePagination } from "@/hooks/use-pagination"
import { Pagination } from "@/components/pagination"

interface Customer {
  id: number
  name: string
  email: string
  phone: string
  joinDate: string
  totalSpent: number
  orders: number
}

export default function SellerCustomersPage() {
  const { user } = useAuth()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [totalCount, setTotalCount] = useState(0)
  const [totalStats, setTotalStats] = useState({
    totalSpent: 0,
    totalOrders: 0
  })

  const pagination = usePagination({ initialPage: 1, initialLimit: 20 })
  const vendorId = user?.vendorId

  useEffect(() => {
    if (vendorId) {
      fetchCustomers()
    }
  }, [vendorId, search, pagination.page, pagination.limit])

  const fetchCustomers = async () => {
    if (!vendorId) return

    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('vendorId', vendorId.toString())
      params.append('limit', pagination.limit.toString())
      params.append('offset', pagination.offset.toString())
      if (search) params.append('search', search)

      const response = await fetch(`/api/seller/customers?${params}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch customers')
      }

      const formattedData: Customer[] = (result.data || []).map((user: any) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || 'N/A',
        joinDate: new Date(user.joinDate).toLocaleDateString('vi-VN'),
        totalSpent: user.totalSpent || 0,
        orders: user.orders || 0
      }))

      setCustomers(formattedData)
      setTotalCount(result.pagination?.total || 0)
      pagination.setTotal(result.pagination?.total || 0)
      
      // Note: Total stats (total spent, total orders) are calculated from the current page only if we don't get them from API.
      // Ideally API should return global stats.
      // For now, let's just sum up what we have on the page, or we need another API call for stats.
      // The previous implementation summed up ALL customers because it fetched ALL.
      // Now we only fetch a page.
      // Let's assume for now we only show stats for visible customers or we need to fix this later.
      // Or we can calculate stats in the API and return them.
      // Let's update the API to return stats if possible, or just accept this limitation for now.
      // I'll update the state with current page stats for now.
      setTotalStats({
        totalSpent: formattedData.reduce((sum, c) => sum + c.totalSpent, 0),
        totalOrders: formattedData.reduce((sum, c) => sum + c.orders, 0)
      })

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold mb-8">Khách hàng của tôi</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Tổng khách hàng</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">{totalCount.toLocaleString('vi-VN')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Doanh số (Trang này)</p>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {totalStats.totalSpent.toLocaleString('vi-VN')} ₫
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Đơn hàng (Trang này)</p>
            <p className="text-3xl font-bold text-yellow-600 mt-2">
              {totalStats.totalOrders.toLocaleString('vi-VN')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Đơn hàng TB/khách</p>
            <p className="text-3xl font-bold text-purple-600 mt-2">
              {customers.length > 0 ? (totalStats.totalOrders / customers.length).toFixed(1) : '0'}
            </p>
          </CardContent>
        </Card>
      </div>

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="p-6">
            <p className="text-sm text-red-800">{error}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Danh sách khách hàng</CardTitle>
            <Input 
              placeholder="Tìm kiếm..." 
              className="w-48"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                pagination.setPage(1)
              }}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            {loading ? (
              <p className="text-center py-6 text-muted-foreground">Đang tải dữ liệu...</p>
            ) : customers.length === 0 ? (
              <p className="text-center py-6 text-muted-foreground">Chưa có khách hàng</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4">ID</th>
                    <th className="text-left py-3 px-4">Tên</th>
                    <th className="text-left py-3 px-4">Email</th>
                    <th className="text-left py-3 px-4">Điện thoại</th>
                    <th className="text-left py-3 px-4">Ngày tham gia</th>
                    <th className="text-left py-3 px-4">Đơn hàng</th>
                    <th className="text-left py-3 px-4">Tổng chi tiêu</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr key={customer.id} className="border-b border-border hover:bg-muted">
                      <td className="py-3 px-4">{customer.id}</td>
                      <td className="py-3 px-4 font-semibold">{customer.name}</td>
                      <td className="py-3 px-4">{customer.email}</td>
                      <td className="py-3 px-4">{customer.phone}</td>
                      <td className="py-3 px-4">{customer.joinDate}</td>
                      <td className="py-3 px-4">{customer.orders}</td>
                      <td className="py-3 px-4 font-semibold text-green-600">
                        {customer.totalSpent.toLocaleString('vi-VN')} ₫
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          
          <div className="mt-4">
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={pagination.goToPage}
              limit={pagination.limit}
              onLimitChange={pagination.setPageLimit}
              total={pagination.total}
            />
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
