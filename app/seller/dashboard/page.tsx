"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Plus, Settings, Bell, LogOut, TrendingUp, Eye, Download, AlertCircle, ShoppingCart, Users, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useSellerDashboard } from "@/hooks/useSupabase"
import { useAuth } from "@/lib/auth-context"
import { useLoading } from "@/hooks/use-loading"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

export default function SellerDashboardPage() {
  const { user } = useAuth()
  const { setIsLoading } = useLoading()
  const [activeTab, setActiveTab] = useState("overview")
  const { data: dashboardData, loading, error, fetchDashboard } = useSellerDashboard(user?.vendorId || null)
  
  const isPending = user?.status === 'pending' || user?.status === 'pending_approval'

  useEffect(() => {
    if (user?.vendorId) {
      setIsLoading(true)
      fetchDashboard().finally(() => setIsLoading(false))
    }
  }, [user?.vendorId, fetchDashboard])

  const seller = {
    shopName: dashboardData?.vendor?.shopName ?? "Shop của tôi",
    revenue: dashboardData?.vendor?.revenue ?? 0,
    revenueLastMonth: dashboardData?.vendor?.revenueLastMonth ?? 0,
    orders: dashboardData?.vendor?.orders ?? 0,
    ordersThisMonth: dashboardData?.vendor?.ordersThisMonth ?? 0,
    products: dashboardData?.vendor?.products ?? 0,
    ratings: dashboardData?.vendor?.ratings ?? 0,
    followers: dashboardData?.vendor?.followers ?? 0,
  }

  const recentOrders = dashboardData?.recentOrders || []
  const topProducts = dashboardData?.topProducts || []
  const monthlyData = [
    { month: "Jan", revenue: 45000000, orders: 300 },
    { month: "Feb", revenue: 52000000, orders: 350 },
    { month: "Mar", revenue: 48000000, orders: 320 },
    { month: "Apr", revenue: 61000000, orders: 410 },
    { month: "May", revenue: 98750000, orders: 580 },
    { month: "Jun", revenue: 125450000, orders: 650 },
  ]

  if (loading) {
    return (
      <main className="min-h-screen bg-surface dark:bg-slate-950">
        <div className="container-viewport py-6 text-center">
          <p>Đang tải bảng điều khiển...</p>
        </div>
      </main>
    )
  }

  const stats = {
    productCount: dashboardData?.stats?.productCount ?? 0,
    orderCount: dashboardData?.stats?.orderCount ?? 0,
    completedOrders: dashboardData?.stats?.completedOrders ?? 0,
    totalRevenue: dashboardData?.stats?.totalRevenue ?? 0,
    averageRating: dashboardData?.stats?.averageRating ?? 0,
    followers: dashboardData?.stats?.followers ?? 0,
  }

  return (
    <main className="min-h-screen bg-surface dark:bg-slate-950">
      <div className="px-4 md:px-6 py-4 md:py-6">
        {isPending && (
          <Alert className="mb-4 md:mb-6 border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
            <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0" />
            <AlertDescription>
              <div className="text-yellow-800 dark:text-yellow-300">
                <p className="font-semibold mb-2 text-sm md:text-base">⏳ Hồ sơ đang chờ phê duyệt</p>
                <p className="text-xs md:text-sm mb-3">
                  Bạn có thể tiếp tục hoàn thành hồ sơ và tải lên tài liệu. Các tính năng khác sẽ được mở khóa sau khi phê duyệt.
                </p>
                <div className="flex gap-2 flex-col md:flex-row">
                  <Link href="/seller/documents" className="flex-1 md:flex-initial">
                    <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700 w-full md:w-auto">
                      Quản lý tài liệu
                    </Button>
                  </Link>
                  <Link href="/seller/pending-approval" className="flex-1 md:flex-initial">
                    <Button size="sm" variant="outline" className="bg-yellow-100 dark:bg-yellow-900/30 w-full md:w-auto">
                      Xem chi tiết
                    </Button>
                  </Link>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 md:mb-8">
          <div className="min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold truncate">{seller.shopName}</h1>
            <p className="text-xs md:text-base text-muted-foreground">Bảng điều khiển bán hàng {isPending && '(Chờ duyệt)'}</p>
          </div>
          <div className="flex gap-2 w-full md:w-auto flex-shrink-0">
            <Button variant="outline" size="icon" className="h-9 w-9 md:h-10 md:w-10">
              <Bell className="h-4 md:h-5 w-4 md:w-5" />
            </Button>
            <Button variant="outline" size="icon" className="h-9 w-9 md:h-10 md:w-10">
              <Settings className="h-4 md:h-5 w-4 md:w-5" />
            </Button>
            <Button variant="outline" className="hidden md:flex gap-2">
              <LogOut className="h-4 w-4" />
              Đăng xuất
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-6 md:mb-8">
          <Card>
            <CardContent className="p-3 md:p-6">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs md:text-xs text-muted-foreground font-medium">DOANH THU THÁNG NÀY</p>
                  <p className="text-lg md:text-2xl font-bold mt-1">{(stats.totalRevenue / 1000000).toFixed(1)}M₫</p>
                  <p className="text-xs text-green-600 font-semibold mt-1 md:mt-2 hidden md:block">↑ 26%</p>
                </div>
                <TrendingUp className="h-6 w-6 md:h-8 md:w-8 text-green-500 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 md:p-6">
              <div>
                <p className="text-xs md:text-xs text-muted-foreground font-medium">ĐƠN HÀNG THÁNG NÀY</p>
                <p className="text-lg md:text-2xl font-bold mt-1">{stats.completedOrders}</p>
                <p className="text-xs text-muted-foreground mt-1 md:mt-2">{stats.orderCount} tổng</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 md:p-6">
              <div>
                <p className="text-xs md:text-xs text-muted-foreground font-medium">SẢN PHẨM</p>
                <p className="text-lg md:text-2xl font-bold mt-1">{stats.productCount}</p>
                <Button size="sm" variant="link" className="mt-1 md:mt-2 px-0 text-xs p-0 h-auto">
                  <Plus className="h-3 w-3 mr-1" /> Thêm
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 md:p-6">
              <div>
                <p className="text-xs md:text-xs text-muted-foreground font-medium">ĐÁNH GIÁ</p>
                <p className="text-lg md:text-2xl font-bold mt-1">{stats.averageRating}★</p>
                <p className="text-xs text-muted-foreground mt-1 md:mt-2 truncate">
                  {(stats.followers / 1000).toFixed(0)}K người
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex flex-wrap">
            <TabsTrigger value="overview">Tổng quan</TabsTrigger>
            <TabsTrigger value="orders">Đơn hàng</TabsTrigger>
            <TabsTrigger value="products">Sản phẩm</TabsTrigger>
            <TabsTrigger value="wallet">Ví tiền</TabsTrigger>
            <TabsTrigger value="analytics">Phân tích</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Orders */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Đơn hàng gần đây</CardTitle>
                    <Link href="/seller/dashboard?tab=orders">
                      <Button variant="outline" size="sm">
                        Xem tất cả
                      </Button>
                    </Link>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {recentOrders.map((order: any) => (
                        <div
                          key={order.id}
                          className="p-3 bg-surface dark:bg-slate-800 rounded-lg border border-border hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-semibold text-sm">#{order.id}</p>
                              <p className="text-xs text-muted-foreground mt-1">{order.date}</p>
                            </div>
                            <span
                              className={`text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap ml-2 ${
                                order.status === "delivered" || order.status === "completed"
                                  ? "bg-green-100 text-green-600 dark:bg-green-900/30"
                                  : order.status === "processing"
                                    ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30"
                                    : "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30"
                              }`}
                            >
                              {order.status === "delivered" || order.status === "completed"
                                ? "Đã giao"
                                : order.status === "processing"
                                  ? "Đang xử lý"
                                  : "Chờ xử lý"}
                            </span>
                          </div>
                          <div className="mb-2">
                            <p className="text-xs text-muted-foreground">Khách hàng</p>
                            <p className="text-sm font-medium">{order.buyer}</p>
                          </div>
                          <div className="mb-2">
                            <p className="text-xs text-muted-foreground">Sản phẩm ({order.productCount})</p>
                            <p className="text-sm line-clamp-2">{order.products}</p>
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t border-border">
                            <p className="font-bold text-primary">{order.amount.toLocaleString("vi-VN")}₫</p>
                            <Button variant="ghost" size="sm" className="text-xs">
                              Xem chi tiết
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Top Products */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Sản phẩm bán chạy</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topProducts.map((product: any) => (
                      <div key={product.id} className="pb-4 border-b border-border last:border-b-0">
                        <p className="font-semibold text-sm line-clamp-2">{product.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">{product.sales} bán</p>
                        <p className="text-sm font-bold text-primary mt-2">
                          {(product.revenue / 1000000).toFixed(1)}M₫
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Quản lý đơn hàng</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentOrders.map((order: any) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-4 bg-surface dark:bg-slate-800 rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex-1">
                        <p className="font-bold">{order.id}</p>
                        <p className="text-sm text-muted-foreground">{order.buyer}</p>
                        <p className="text-xs text-muted-foreground mt-1">{order.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">{order.amount.toLocaleString("vi-VN")}₫</p>
                        <Button size="sm" variant="outline" className="mt-2 bg-transparent">
                          Chi tiết
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Quản lý sản phẩm</CardTitle>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm sản phẩm
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topProducts.map((product: any) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-4 bg-surface dark:bg-slate-800 rounded-lg"
                    >
                      <div>
                        <p className="font-bold">{product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {product.sales} bán · {product.revenue.toLocaleString("vi-VN")}₫
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          Sửa
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Wallet Tab */}
          <TabsContent value="wallet" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Ví tiền của bạn</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-gradient-to-r from-primary to-primary-dark text-white p-6 rounded-lg">
                    <p className="text-sm opacity-90">Số dư khả dụng</p>
                    <p className="text-3xl font-bold mt-2">{(seller.revenue / 1000000).toFixed(1)}M₫</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b border-border">
                      <span>Doanh thu tháng này</span>
                      <span className="font-bold">+{seller.revenue.toLocaleString("vi-VN")}₫</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border">
                      <span>Hoa hồng (5%)</span>
                      <span className="font-bold">-{(seller.revenue * 0.05).toLocaleString("vi-VN")}₫</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border">
                      <span>Rút tiền</span>
                      <span className="font-bold text-red-600">-0₫</span>
                    </div>
                  </div>

                  <Button className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Rút tiền
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Thống kê</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Hoa hồng</p>
                    <p className="text-lg font-bold text-orange-500">5%</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Đơn hàng hôm nay</p>
                    <p className="text-lg font-bold">12</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Sản phẩm hoạt động</p>
                    <p className="text-lg font-bold">{seller.products}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="mt-6">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Doanh thu 6 tháng</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value: any) => `${(value / 1000000).toFixed(1)}M₫`} />
                      <Legend />
                      <Line type="monotone" dataKey="revenue" stroke="#3b82f6" name="Doanh thu" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Số lượng đơn hàng 6 tháng</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="orders" fill="#10b981" name="Đơn hàng" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {topProducts.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Sản phẩm bán chạy</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={topProducts}
                          dataKey="sales"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label
                        >
                          {topProducts.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b'][index % 3]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: any) => `${value} bán`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
