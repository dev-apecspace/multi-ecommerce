"use client"

import { useState, useEffect } from "react"
import { TrendingUp, Users, ShoppingBag, Wallet, LineChart, BarChart, PieChart } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LineChart as LineChartComponent, Line, BarChart as BarChartComponent, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

export default function AdminReportsPage() {
  const [stats, setStats] = useState<any>({
    vendors: { total: 0, approved: 0, pending: 0, rejected: 0 },
    users: { total: 0, active: 0 },
    products: { total: 0 },
    orders: { total: 0, totalRevenue: 0, averageOrderValue: 0 },
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/admin/statistics')
        if (!response.ok) throw new Error('Failed to fetch statistics')
        const data = await response.json()
        setStats(data)
      } catch (error) {
        console.error('Error fetching statistics:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const monthlyData = [
    { month: 'Jan', revenue: 450000000, orders: 300, users: 150 },
    { month: 'Feb', revenue: 520000000, orders: 350, users: 180 },
    { month: 'Mar', revenue: 480000000, orders: 320, users: 160 },
    { month: 'Apr', revenue: 610000000, orders: 410, users: 220 },
    { month: 'May', revenue: 987500000, orders: 580, users: 340 },
    { month: 'Jun', revenue: 1254500000, orders: 650, users: 410 },
  ]

  if (loading) {
    return (
      <main className="p-6">
        <p className="text-center">Đang tải báo cáo...</p>
      </main>
    )
  }

  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold mb-8">Báo cáo & Thống kê</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Doanh thu</p>
                <p className="text-2xl font-bold text-blue-600 mt-2">{(stats.orders?.totalRevenue / 1000000000).toFixed(1)} Tỷ đ</p>
              </div>
              <Wallet className="h-8 w-8 text-blue-600 opacity-50" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Từ {stats.orders?.total || 0} đơn hàng</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Đơn hàng</p>
                <p className="text-2xl font-bold text-green-600 mt-2">{stats.orders?.total?.toLocaleString()}</p>
              </div>
              <ShoppingBag className="h-8 w-8 text-green-600 opacity-50" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Trung bình: {(stats.orders?.averageOrderValue / 1000000).toFixed(1)}M₫</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Người dùng</p>
                <p className="text-2xl font-bold text-orange-600 mt-2">{stats.users?.total?.toLocaleString()}</p>
              </div>
              <Users className="h-8 w-8 text-orange-600 opacity-50" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Hoạt động: {stats.users?.active || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sản phẩm</p>
                <p className="text-2xl font-bold text-purple-600 mt-2">{stats.products?.total?.toLocaleString()}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600 opacity-50" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Tổng cộng</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="revenue">Doanh số</TabsTrigger>
          <TabsTrigger value="users">Người dùng</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Doanh thu 6 tháng</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChartComponent data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value: any) => `${(value / 1000000).toFixed(1)}M₫`} />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#3b82f6" name="Doanh thu" strokeWidth={2} />
                  </LineChartComponent>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>So sánh chỉ số chính</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChartComponent data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="orders" fill="#10b981" name="Đơn hàng" />
                    <Bar dataKey="users" fill="#f59e0b" name="Người dùng mới" />
                  </BarChartComponent>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Chi tiết doanh số</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChartComponent data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => {
                    if (typeof value === 'number') {
                      return `${(value / 1000000).toFixed(1)}M₫`
                    }
                    return value
                  }} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#3b82f6" name="Doanh thu" strokeWidth={2} />
                </LineChartComponent>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Tăng trưởng người dùng</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChartComponent data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="users" fill="#f59e0b" name="Người dùng mới" />
                </BarChartComponent>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  )
}
