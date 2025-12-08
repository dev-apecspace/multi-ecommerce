"use client"

import { useState, useEffect } from "react"
import { TrendingUp, Users, ShoppingBag, Wallet } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAdminStatistics, useAdminReports } from "@/hooks/useSupabase"

export default function AdminReportsPage() {
  const [type, setType] = useState<string | undefined>(undefined)
  const [reportStatus, setReportStatus] = useState<string | undefined>(undefined)
  
  const { data: statsData, loading: statsLoading, error: statsError, fetchStatistics } = useAdminStatistics()
  const { data: reportsData, loading: reportsLoading, error: reportsError, fetchReports } = useAdminReports(type, reportStatus)

  useEffect(() => {
    fetchStatistics()
  }, [])

  useEffect(() => {
    fetchReports()
  }, [type, reportStatus])

  const stats = statsData || {
    totalRevenue: 2500000000,
    totalOrders: 12450,
    newUsers: 1240,
    conversionRate: 3.5,
  }

  const reports = Array.isArray(reportsData) ? reportsData : []

  if (statsLoading || reportsLoading) {
    return (
      <main className="p-6">
        <p className="text-center">Đang tải báo cáo...</p>
      </main>
    )
  }

  if (statsError || reportsError) {
    return (
      <main className="p-6">
        <p className="text-center text-red-500">Lỗi: {statsError || reportsError}</p>
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
                <p className="text-2xl font-bold text-blue-600 mt-2">{(stats.totalRevenue / 1000000000).toFixed(1)} Tỷ đ</p>
              </div>
              <Wallet className="h-8 w-8 text-blue-600 opacity-50" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">+12% so với tháng trước</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Đơn hàng</p>
                <p className="text-2xl font-bold text-green-600 mt-2">{stats.totalOrders?.toLocaleString()}</p>
              </div>
              <ShoppingBag className="h-8 w-8 text-green-600 opacity-50" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">+8% so với tháng trước</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Người dùng mới</p>
                <p className="text-2xl font-bold text-orange-600 mt-2">{stats.newUsers?.toLocaleString()}</p>
              </div>
              <Users className="h-8 w-8 text-orange-600 opacity-50" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">+5% so với tháng trước</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tỷ lệ chuyển đổi</p>
                <p className="text-2xl font-bold text-purple-600 mt-2">{stats.conversionRate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600 opacity-50" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">+0.2% so với tháng trước</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="sales">Doanh số</TabsTrigger>
          <TabsTrigger value="users">Người dùng</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Báo cáo tổng quan</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Biểu đồ và thống kê tổng quan kinh doanh</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sales">
          <Card>
            <CardHeader>
              <CardTitle>Báo cáo doanh số</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Chi tiết doanh số bán hàng theo thời gian</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Báo cáo người dùng</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Thống kê về người dùng và hành vi mua hàng</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  )
}
