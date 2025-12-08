"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Plus, Settings, Bell, LogOut, TrendingUp, Eye, Download, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useSellerDashboard } from "@/hooks/useSupabase"
import { useAuth } from "@/lib/auth-context"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function SellerDashboardPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("overview")
  const { data: dashboardData, loading, error, fetchDashboard } = useSellerDashboard(user?.vendorId || null)
  
  const isPending = user?.status === 'pending' || user?.status === 'pending_approval'

  useEffect(() => {
    if (user?.vendorId) {
      fetchDashboard()
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

  const monthlyData = [
    { month: "Jan", revenue: 45000000, orders: 300 },
    { month: "Feb", revenue: 52000000, orders: 350 },
    { month: "Mar", revenue: 48000000, orders: 320 },
    { month: "Apr", revenue: 61000000, orders: 410 },
    { month: "May", revenue: 98750000, orders: 580 },
    { month: "Jun", revenue: 125450000, orders: 650 },
  ]

  const recentOrders = [
    {
      id: "ORD001",
      buyer: "Nguyễn Văn A",
      products: "Điện thoại Samsung Galaxy A15",
      amount: 4999000,
      status: "Delivered",
      date: "2025-01-15",
    },
    {
      id: "ORD002",
      buyer: "Trần Thị B",
      products: "Tai nghe Bluetooth",
      amount: 999000,
      status: "Processing",
      date: "2025-01-14",
    },
    {
      id: "ORD003",
      buyer: "Phạm Công C",
      products: "Laptop ASUS VivoBook",
      amount: 18990000,
      status: "Pending",
      date: "2025-01-13",
    },
  ]

  const topProducts = [
    {
      id: 1,
      name: "Điện thoại Samsung Galaxy A15",
      sales: 450,
      revenue: 2249550000,
    },
    {
      id: 2,
      name: "Tai nghe Bluetooth",
      sales: 320,
      revenue: 319680000,
    },
    {
      id: 3,
      name: "Laptop ASUS VivoBook",
      sales: 85,
      revenue: 1614150000,
    },
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
      <div className="container-viewport py-6">
        {isPending && (
          <Alert className="mb-6 border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription>
              <div className="text-yellow-800 dark:text-yellow-300">
                <p className="font-semibold mb-2">⏳ Hồ sơ đang chờ phê duyệt</p>
                <p className="text-sm mb-3">
                  Bạn có thể tiếp tục hoàn thành hồ sơ và tải lên tài liệu. Các tính năng khác sẽ được mở khóa sau khi phê duyệt.
                </p>
                <div className="flex gap-2">
                  <Link href="/seller/documents">
                    <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700">
                      Quản lý tài liệu
                    </Button>
                  </Link>
                  <Link href="/seller/pending-approval">
                    <Button size="sm" variant="outline" className="bg-yellow-100 dark:bg-yellow-900/30">
                      Xem chi tiết
                    </Button>
                  </Link>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">{seller.shopName}</h1>
            <p className="text-muted-foreground">Bảng điều khiển bán hàng {isPending && '(Chừa duyệt)'}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
            <Button variant="outline" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
            <Button variant="outline">
              <LogOut className="h-4 w-4 mr-2" />
              Đăng xuất
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">DOANH THU THÁNG NÀY</p>
                  <p className="text-2xl font-bold mt-1">{(stats.totalRevenue / 1000000).toFixed(1)}M₫</p>
                  <p className="text-xs text-green-600 font-semibold mt-2">↑ 26% so với tháng trước</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div>
                <p className="text-xs text-muted-foreground font-medium">ĐƠN HÀNG THÁNG NÀY</p>
                <p className="text-2xl font-bold mt-1">{stats.completedOrders}</p>
                <p className="text-xs text-muted-foreground mt-2">{stats.orderCount} tổng cộng</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div>
                <p className="text-xs text-muted-foreground font-medium">SẢN PHẨM</p>
                <p className="text-2xl font-bold mt-1">{stats.productCount}</p>
                <Button size="sm" variant="link" className="mt-2 px-0 text-xs">
                  <Plus className="h-3 w-3 mr-1" /> Thêm sản phẩm
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div>
                <p className="text-xs text-muted-foreground font-medium">ĐÁNH GIÁ</p>
                <p className="text-2xl font-bold mt-1">{stats.averageRating}★</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {stats.followers.toLocaleString("vi-VN")} người theo dõi
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
                      {recentOrders.map((order) => (
                        <div
                          key={order.id}
                          className="flex items-center justify-between p-3 bg-surface dark:bg-slate-800 rounded-lg"
                        >
                          <div className="flex-1">
                            <p className="font-semibold text-sm">{order.id}</p>
                            <p className="text-xs text-muted-foreground">
                              {order.buyer} · {order.products}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-sm">{order.amount.toLocaleString("vi-VN")}₫</p>
                            <span
                              className={`text-xs font-semibold px-2 py-1 rounded-full ${
                                order.status === "Delivered"
                                  ? "bg-green-100 text-green-600"
                                  : order.status === "Processing"
                                    ? "bg-blue-100 text-blue-600"
                                    : "bg-yellow-100 text-yellow-600"
                              }`}
                            >
                              {order.status === "Delivered"
                                ? "Đã giao"
                                : order.status === "Processing"
                                  ? "Đang xử lý"
                                  : "Chờ xử lý"}
                            </span>
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
                    {topProducts.map((product) => (
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
                  {recentOrders.map((order) => (
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
                  {topProducts.map((product) => (
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
            <Card>
              <CardHeader>
                <CardTitle>Phân tích 6 tháng</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  <div>
                    <p className="font-semibold mb-4">Doanh thu</p>
                    <div className="flex items-end gap-2 h-40">
                      {monthlyData.map((data, idx) => {
                        const maxRevenue = Math.max(...monthlyData.map((d) => d.revenue))
                        const height = (data.revenue / maxRevenue) * 100
                        return (
                          <div key={idx} className="flex-1">
                            <div
                              className="bg-primary rounded-t-lg transition-all hover:bg-primary-dark"
                              style={{ height: `${height}%` }}
                            />
                            <p className="text-xs text-center mt-2 text-muted-foreground">{data.month}</p>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div>
                    <p className="font-semibold mb-4">Đơn hàng</p>
                    <div className="grid grid-cols-6 gap-2">
                      {monthlyData.map((data, idx) => (
                        <div key={idx} className="text-center">
                          <p className="font-bold text-lg">{data.orders}</p>
                          <p className="text-xs text-muted-foreground">{data.month}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
