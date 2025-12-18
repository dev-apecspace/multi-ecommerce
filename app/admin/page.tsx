"use client"

import { useState, useEffect } from "react"
import { CheckCircle2, XCircle, Clock, AlertCircle, Eye, Download, User, Store, Users, ShoppingCart, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("pending")
  const [selectedVendor, setSelectedVendor] = useState<any>(null)
  const [stats, setStats] = useState<any>({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0,
    users: 0,
    products: 0,
    orders: 0,
    revenue: 0,
  })
  const [vendors, setVendors] = useState<any>({ pending: [], approved: [], rejected: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [statsRes, pendingRes, approvedRes, rejectedRes] = await Promise.all([
          fetch('/api/admin/statistics'),
          fetch('/api/admin/vendors?status=pending&limit=10'),
          fetch('/api/admin/vendors?status=approved&limit=10'),
          fetch('/api/admin/vendors?status=rejected&limit=10'),
        ])

        const statsData = await statsRes.json()
        const pendingData = await pendingRes.json()
        const approvedData = await approvedRes.json()
        const rejectedData = await rejectedRes.json()

        setStats({
          pending: statsData.vendors?.pending || 0,
          approved: statsData.vendors?.approved || 0,
          rejected: statsData.vendors?.rejected || 0,
          total: statsData.vendors?.total || 0,
          users: statsData.users?.total || 0,
          products: statsData.products?.total || 0,
          orders: statsData.orders?.total || 0,
          revenue: statsData.orders?.totalRevenue || 0,
        })

        setVendors({
          pending: pendingData.data || [],
          approved: approvedData.data || [],
          rejected: rejectedData.data || [],
        })
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <main className="min-h-screen bg-surface dark:bg-slate-950">
      <div className="px-4 md:px-6 py-4 md:py-6">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold">Bảng điều khiển quản lý</h1>
          <p className="text-sm md:text-base text-muted-foreground">Quản lý người bán, danh mục, đơn hàng</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">CHỜ DUYỆT</p>
                  <p className="text-3xl font-bold mt-1">{stats.pending}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">ĐÃ PHÁT HÀNH</p>
                  <p className="text-3xl font-bold mt-1">{stats.approved}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">TỪ CHỐI</p>
                  <p className="text-3xl font-bold mt-1">{stats.rejected}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">TỔNG NGƯỜI BÁN</p>
                  <p className="text-3xl font-bold mt-1">{stats.total}</p>
                </div>
                <Store className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">NGƯỜI DÙNG</p>
                  <p className="text-3xl font-bold mt-1">{stats.users}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">SẢN PHẨM</p>
                  <p className="text-3xl font-bold mt-1">{stats.products}</p>
                </div>
                <ShoppingCart className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">ĐƠN HÀNG</p>
                  <p className="text-3xl font-bold mt-1">{stats.orders}</p>
                </div>
                <ShoppingCart className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">TỔNG DOANH THU</p>
                  <p className="text-2xl font-bold mt-1">{(stats.revenue / 1000000).toFixed(1)}M₫</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Phân phối người bán</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Chờ duyệt', value: stats.pending },
                      { name: 'Đã phát hành', value: stats.approved },
                      { name: 'Từ chối', value: stats.rejected },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    <Cell fill="#eab308" />
                    <Cell fill="#22c55e" />
                    <Cell fill="#ef4444" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Thống kê nền tảng</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={[
                    { name: 'Người dùng', value: stats.users },
                    { name: 'Sản phẩm', value: stats.products },
                    { name: 'Đơn hàng', value: stats.orders },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="pending">Chờ duyệt ({stats.pending})</TabsTrigger>
            <TabsTrigger value="approved">Đã phát hành ({stats.approved})</TabsTrigger>
            <TabsTrigger value="rejected">Từ chối ({stats.rejected})</TabsTrigger>
            <TabsTrigger value="charts">Biểu đồ</TabsTrigger>
            <TabsTrigger value="categories">Danh mục</TabsTrigger>
          </TabsList>

          {/* Pending Vendors */}
          <TabsContent value="pending" className="mt-6">
            <div className="space-y-4">
              {vendors.pending.map((vendor: any) => (
                <Card key={vendor.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="h-5 w-5 text-primary" />
                          <h3 className="font-bold text-lg">{vendor.shopName || vendor.name}</h3>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-3">
                          <div>
                            <p className="text-muted-foreground text-xs">Chủ sở hữu</p>
                            <p className="font-medium">{vendor.ownerName || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Email</p>
                            <p className="font-medium text-xs">{vendor.Shop?.ShopDetail?.email || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Điện thoại</p>
                            <p className="font-medium">{vendor.Shop?.ShopDetail?.phone || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Mã số thuế</p>
                            <p className="font-medium text-xs">{vendor.Shop?.ShopDetail?.taxId || 'N/A'}</p>
                          </div>
                        </div>

                        {/* Document Status */}
                        <div className="mt-4 pt-4 border-t border-border">
                          <p className="text-xs font-semibold mb-2 text-muted-foreground">TRẠNG THÁI TÀI LIỆU</p>
                          <div className="flex gap-4 text-xs">
                            {vendor.Shop?.ShopDetail?.businessLicense ? (
                              <div className="flex items-center gap-1">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                <span>Giấy phép kinh doanh</span>
                              </div>
                            ) : null}
                            {vendor.Shop?.ShopDetail?.bankAccount ? (
                              <div className="flex items-center gap-1">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                <span>Tài khoản ngân hàng</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <AlertCircle className="h-4 w-4 text-yellow-500" />
                                <span>Tài khoản ngân hàng</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setSelectedVendor(vendor)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Chi tiết
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>{selectedVendor?.shopName || selectedVendor?.name}</DialogTitle>
                              <DialogDescription>Thông tin chi tiết của người bán</DialogDescription>
                            </DialogHeader>
                            {selectedVendor && (
                              <div className="space-y-4">
                                <div>
                                  <p className="text-sm font-semibold mb-1">Tên cửa hàng</p>
                                  <p className="text-sm">{selectedVendor.shopName || selectedVendor.name}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-semibold mb-1">Email</p>
                                  <p className="text-sm text-xs">{selectedVendor.Shop?.ShopDetail?.email || 'N/A'}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-semibold mb-1">Điện thoại</p>
                                  <p className="text-sm">{selectedVendor.Shop?.ShopDetail?.phone || 'N/A'}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-semibold mb-1">Mã số thuế</p>
                                  <p className="text-sm text-xs">{selectedVendor.Shop?.ShopDetail?.taxId || 'N/A'}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-semibold mb-1">Trạng thái</p>
                                  <p className="text-sm capitalize">{selectedVendor.status}</p>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => alert("Đã phê duyệt: " + (vendor.shopName || vendor.name))}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Phê duyệt
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => alert("Đã từ chối: " + (vendor.shopName || vendor.name))}>
                        <XCircle className="h-4 w-4 mr-2" />
                        Từ chối
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Tài liệu
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Approved Vendors */}
          <TabsContent value="approved" className="mt-6">
            <div className="space-y-4">
              {vendors.approved.map((vendor: any) => (
                <Card key={vendor.id} className="border-green-200 dark:border-green-900">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                          <h3 className="font-bold text-lg">{vendor.shopName || vendor.name}</h3>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-3">
                          <div>
                            <p className="text-muted-foreground text-xs">Chủ sở hữu</p>
                            <p className="font-medium">{vendor.ownerName || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Sản phẩm</p>
                            <p className="font-medium">{vendor.products || 0}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Đánh giá</p>
                            <p className="font-medium">{vendor.rating || 0}★</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Ngày phê duyệt</p>
                            <p className="font-medium text-xs">{vendor.approvedDate ? new Date(vendor.approvedDate).toLocaleDateString('vi-VN') : 'N/A'}</p>
                          </div>
                        </div>
                      </div>

                      <Button variant="outline" size="sm">
                        Quản lý
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Rejected Vendors */}
          <TabsContent value="rejected" className="mt-6">
            <div className="space-y-4">
              {vendors.rejected.map((vendor: any) => (
                <Card key={vendor.id} className="border-red-200 dark:border-red-900">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <XCircle className="h-5 w-5 text-red-500" />
                          <h3 className="font-bold text-lg">{vendor.shopName || vendor.name}</h3>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <p className="text-muted-foreground text-xs">Chủ sở hữu</p>
                            <p className="font-medium">{vendor.ownerName || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Lý do từ chối</p>
                            <p className="font-medium text-red-600">{vendor.rejectionReason || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Ngày từ chối</p>
                            <p className="font-medium text-xs">{vendor.rejectedDate ? new Date(vendor.rejectedDate).toLocaleDateString('vi-VN') : 'N/A'}</p>
                          </div>
                        </div>
                      </div>

                      <Button variant="outline" size="sm">
                        Hồi quy
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Charts Tab */}
          <TabsContent value="charts" className="mt-6">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Doanh thu theo người bán</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={[
                        { name: 'Người bán', value: stats.total },
                        { name: 'Doanh thu trung bình', value: stats.revenue / Math.max(stats.total, 1) },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value: any) => {
                        if (value > 1000000) return `${(value / 1000000).toFixed(1)}M₫`
                        return `${value.toLocaleString('vi-VN')}₫`
                      }} />
                      <Bar dataKey="value" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tổng doanh thu nền tảng</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <p className="text-5xl font-bold text-primary">{(stats.revenue / 1000000).toFixed(1)}M₫</p>
                    <p className="text-muted-foreground mt-2">Tổng cộng từ {stats.orders} đơn hàng</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Quản lý danh mục</CardTitle>
                <Button>Thêm danh mục</Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {["Thời trang", "Điện tử", "Nhà cửa & đời sống", "Sức khỏe & sắc đẹp", "Mẹ & bé"].map((cat, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-4 bg-surface dark:bg-slate-800 rounded-lg"
                    >
                      <span className="font-medium">{cat}</span>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          Sửa
                        </Button>
                        <Button size="sm" variant="outline" className="text-destructive bg-transparent">
                          Xóa
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
