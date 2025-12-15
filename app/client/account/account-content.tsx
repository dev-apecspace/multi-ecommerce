"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { User, ShoppingBag, Heart, MapPin, Settings, LogOut, Package, Award } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/lib/auth-context"
import { AddressManagement } from "@/components/client/address-management"

export default function AccountContent() {
  const { user: authUser } = useAuth()
  const searchParams = useSearchParams()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [activeTab, setActiveTab] = useState("orders")

  useEffect(() => {
    if (authUser) {
      setIsLoggedIn(true)
    }
  }, [authUser])

  useEffect(() => {
    const tab = searchParams.get("tab")
    if (tab) {
      setActiveTab(tab)
    }
  }, [searchParams])

  const user = authUser ? {
    id: authUser.id,
    name: authUser.name || "Người dùng",
    email: authUser.email || "",
    phone: authUser.phone || "",
    avatar: (authUser.name || "User").charAt(0).toUpperCase(),
    joinDate: new Date().toISOString().split('T')[0],
    orders: {
      pending: 0,
      completed: 0,
      cancelled: 0,
    },
    stats: {
      points: 0,
      level: "Thành viên",
      favorites: 0,
    },
  } : null

  if (!isLoggedIn || !user) {
    return (
      <main className="min-h-screen bg-surface dark:bg-slate-950">
        <div className="container-viewport py-12">
          <div className="max-w-md mx-auto">
            <Card className="p-8">
              <CardContent className="p-0 text-center space-y-6">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <User className="h-10 w-10 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold mb-2">Chào mừng</h1>
                  <p className="text-muted-foreground">Đăng nhập để xem tài khoản và đơn hàng của bạn</p>
                </div>
                <Button size="lg" onClick={() => setIsLoggedIn(true)} className="w-full">
                  Đăng nhập
                </Button>
                <p className="text-sm text-muted-foreground">
                  Chưa có tài khoản?{" "}
                  <a href="#" className="text-primary font-semibold hover:underline">
                    Đăng ký ngay
                  </a>
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-surface dark:bg-slate-950">
      <div className="container-viewport py-6">
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold">
                  {user.avatar}
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{user.name}</h1>
                  <p className="text-muted-foreground">{user.email}</p>
                  <p className="text-sm text-muted-foreground">
                    Thành viên từ {new Date(user.joinDate).toLocaleDateString("vi-VN")}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon">
                  <Settings className="h-5 w-5" />
                </Button>
                <Button variant="outline" onClick={() => setIsLoggedIn(false)}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Đăng xuất
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <ShoppingBag className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold">{user.orders.completed}</p>
                <p className="text-xs text-muted-foreground">Đơn đã hoàn thành</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <Package className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold">{user.orders.pending}</p>
                <p className="text-xs text-muted-foreground">Đơn chờ xử lý</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <Award className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold">{user.stats.points}</p>
                <p className="text-xs text-muted-foreground">Điểm tích luỹ</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <Heart className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold">{user.stats.favorites}</p>
                <p className="text-xs text-muted-foreground">Sản phẩm yêu thích</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="orders">Đơn hàng</TabsTrigger>
            <TabsTrigger value="returns">Trả hàng</TabsTrigger>
            <TabsTrigger value="addresses">Địa chỉ</TabsTrigger>
            <TabsTrigger value="favorites">Yêu thích</TabsTrigger>
            <TabsTrigger value="settings">Cài đặt</TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="mt-4">
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-12">
                  <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Không có đơn hàng nào</p>
                  <Link href="/">
                    <Button className="mt-4">Bắt đầu mua sắm</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="returns" className="mt-4">
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">Quản lý các yêu cầu trả hàng của bạn</p>
                  <Link href="/client/returns">
                    <Button>Xem trả hàng</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="addresses" className="mt-4">
            <AddressManagement userId={user?.id || null} />
          </TabsContent>

          <TabsContent value="favorites" className="mt-4">
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-12">
                  <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Chưa có sản phẩm yêu thích</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="mt-4">
            <Card>
              <CardContent className="p-6 space-y-4">
                <div>
                  <h3 className="font-bold mb-2">Cài đặt bảo mật</h3>
                  <Button variant="outline" size="sm">
                    Đổi mật khẩu
                  </Button>
                </div>
                <div className="border-t border-border pt-4">
                  <h3 className="font-bold mb-2">Thông báo</h3>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked />
                    <span className="text-sm">Nhận thông báo qua email</span>
                  </label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
