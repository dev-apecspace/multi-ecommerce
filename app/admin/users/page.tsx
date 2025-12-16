"use client"

import { useEffect, useState } from "react"
import { Search, Filter, Lock, LockOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Pagination } from "@/components/pagination"
import { usePagination } from "@/hooks/use-pagination"

interface Customer {
  id: number
  name: string
  email: string
  phone: string
  joinDate: string
  status: 'active' | 'locked'
  totalSpent: number
  orders: number
}

export default function AdminUsersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'locked'>('all')
  const [totalCount, setTotalCount] = useState(0)
  const [activeCount, setActiveCount] = useState(0)
  const [lockedCount, setLockedCount] = useState(0)
  const [updating, setUpdating] = useState<number | null>(null)
  const pagination = usePagination({ initialPage: 1, initialLimit: 10 })

  useEffect(() => {
    fetchCustomers()
  }, [search, statusFilter, pagination.page, pagination.limit])

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      params.append('page', String(pagination.page))
      params.append('limit', String(pagination.limit))

      const response = await fetch(`/api/admin/customers?${params}`)
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
        status: user.status as 'active' | 'locked',
        totalSpent: user.totalSpent || 0,
        orders: user.orders || 0
      }))

      setCustomers(formattedData)
      pagination.setTotal(result.pagination?.total || 0)
      setTotalCount(result.pagination?.total || 0)

      const activeCustomers = formattedData.filter(c => c.status === 'active').length
      const lockedCustomers = formattedData.filter(c => c.status === 'locked').length
      setActiveCount(activeCustomers)
      setLockedCount(lockedCustomers)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const displayTotalOrders = customers.reduce((sum, c) => sum + c.orders, 0)
  const displayTotalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0)

  const handleToggleStatus = async (customerId: number, currentStatus: 'active' | 'locked') => {
    try {
      setUpdating(customerId)
      const newStatus = currentStatus === 'active' ? 'locked' : 'active'

      const response = await fetch('/api/admin/customers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: customerId, status: newStatus })
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Failed to update customer status')
      }

      setCustomers(customers.map(c =>
        c.id === customerId ? { ...c, status: newStatus } : c
      ))

      const newActive = customers.filter(c => (c.id === customerId ? newStatus === 'active' : c.status === 'active')).length
      const newLocked = customers.filter(c => (c.id === customerId ? newStatus === 'locked' : c.status === 'locked')).length
      setActiveCount(newActive)
      setLockedCount(newLocked)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status')
    } finally {
      setUpdating(null)
    }
  }

  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold mb-8">Người dùng khách hàng</h1>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Tổng người dùng</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">{totalCount.toLocaleString('vi-VN')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Đang hoạt động</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{activeCount.toLocaleString('vi-VN')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Bị khóa</p>
            <p className="text-3xl font-bold text-red-600 mt-2">{lockedCount.toLocaleString('vi-VN')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Tổng đơn hàng</p>
            <p className="text-3xl font-bold text-yellow-600 mt-2">{displayTotalOrders.toLocaleString('vi-VN')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Tổng doanh số</p>
            <p className="text-3xl font-bold text-purple-600 mt-2">{displayTotalRevenue.toLocaleString('vi-VN')} ₫</p>
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
            <CardTitle>Danh sách người dùng</CardTitle>
            <div className="flex gap-2">
              <Input 
                placeholder="Tìm kiếm..." 
                className="w-48"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select
                className="px-3 py-2 border border-border rounded-md text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'locked')}
              >
                <option value="all">Tất cả</option>
                <option value="active">Đang hoạt động</option>
                <option value="locked">Bị khóa</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            {loading ? (
              <p className="text-center py-6 text-muted-foreground">Đang tải dữ liệu...</p>
            ) : customers.length === 0 ? (
              <p className="text-center py-6 text-muted-foreground">Không có dữ liệu</p>
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
                    <th className="text-left py-3 px-4">Chi tiêu</th>
                    <th className="text-left py-3 px-4">Trạng thái</th>
                    <th className="text-left py-3 px-4">Hành động</th>
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
                      <td className="py-3 px-4">{customer.totalSpent.toLocaleString('vi-VN')} ₫</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          customer.status === "active" 
                            ? "bg-green-100 text-green-800" 
                            : "bg-red-100 text-red-800"
                        }`}>
                          {customer.status === 'active' ? 'Đang hoạt động' : 'Bị khóa'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleStatus(customer.id, customer.status)}
                          disabled={updating === customer.id}
                          className="p-1 hover:bg-muted rounded transition-colors disabled:opacity-50"
                          title={customer.status === 'active' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                        >
                          {customer.status === 'active' ? (
                            <Lock className="h-4 w-4 text-yellow-600" />
                          ) : (
                            <LockOpen className="h-4 w-4 text-green-600" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {customers.length > 0 && (
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={pagination.goToPage}
              limit={pagination.limit}
              onLimitChange={pagination.setPageLimit}
              total={pagination.total}
            />
          )}
        </CardContent>
      </Card>
    </main>
  )
}
