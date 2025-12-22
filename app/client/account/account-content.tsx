"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { User, ShoppingBag, Heart, MapPin, Settings, LogOut, Package, Award, ChevronRight, Trash2, Edit2, Camera } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useAuth } from "@/lib/auth-context"
import { useLoading } from "@/hooks/use-loading"
import { useToast } from "@/hooks/use-toast"
import { AddressManagement } from "@/components/client/address-management"
import Image from "next/image"

interface Order {
  id: number
  orderNumber: string
  status: string
  total: number
  date: string
  Vendor: { id: number; name: string }
  OrderItem: Array<{
    id: number
    quantity: number
    Product: { id: number; name: string; image?: string }
  }>
}

interface ReturnRequest {
  id: number
  status: string
  requestedAt: string
}

export default function AccountContent() {
  const { user: authUser, refreshUser } = useAuth()
  const { setIsLoading } = useLoading()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [activeTab, setActiveTab] = useState("orders")
  const [userId, setUserId] = useState<number | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [returnedOrders, setReturnedOrders] = useState<Order[]>([])
  const [returns, setReturns] = useState<ReturnRequest[]>([])
  const [exchanges, setExchanges] = useState<ReturnRequest[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [loadingReturns, setLoadingReturns] = useState(false)
  
  const [favorites, setFavorites] = useState<any[]>([])
  const [loadingFavorites, setLoadingFavorites] = useState(false)

  const [followedShops, setFollowedShops] = useState<any[]>([])
  const [loadingFollowedShops, setLoadingFollowedShops] = useState(false)
  
  // Profile Edit State
  const [editProfileOpen, setEditProfileOpen] = useState(false)
  const [profileForm, setProfileForm] = useState({ name: "", phone: "", email: "" })
  
  // Password Change State
  const [passwordForm, setPasswordForm] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" })
  const [changingPassword, setChangingPassword] = useState(false)

  useEffect(() => {
    if (authUser) {
      setIsLoggedIn(true)
      setUserId(Number(authUser.id))
    } else {
      const storedUserId = localStorage.getItem('userId')
      if (storedUserId) {
        setUserId(parseInt(storedUserId))
      }
    }
  }, [authUser])

  useEffect(() => {
    const tab = searchParams.get("tab")
    if (tab) {
      setActiveTab(tab)
    }
  }, [searchParams])

  useEffect(() => {
    if (userId && isLoggedIn) {
      fetchOrders()
      fetchReturns()
      fetchFavorites()
      fetchFollowedShops()
    }
  }, [userId, isLoggedIn])

  const fetchOrders = async () => {
    try {
      setIsLoading(true)
      setLoadingOrders(true)
      const response = await fetch(`/api/client/orders?userId=${userId}`)
      const result = await response.json()
      const allOrders = result.data || []
      
      const activeOrders = allOrders.filter((o: Order) => o.status !== 'returned')
      const returned = allOrders.filter((o: Order) => o.status === 'returned')
      
      setOrders(activeOrders.slice(0, 5))
      setReturnedOrders(returned)
    } catch (error) {
      toast({ title: "Lỗi", description: "Không thể tải đơn hàng", variant: "destructive" })
    } finally {
      setLoadingOrders(false)
      setIsLoading(false)
    }
  }

  const fetchReturns = async () => {
    try {
      setIsLoading(true)
      setLoadingReturns(true)
      const response = await fetch(`/api/client/returns?userId=${userId}&limit=100`)
      const result = await response.json()
      const allReturns = result.data || []
      setReturns(allReturns.filter((r: any) => r.returnType === "return"))
      setExchanges(allReturns.filter((r: any) => r.returnType === "exchange"))
    } catch (error) {
      toast({ title: "Lỗi", description: "Không thể tải trả hàng", variant: "destructive" })
    } finally {
      setLoadingReturns(false)
      setIsLoading(false)
    }
  }

  const fetchFavorites = async () => {
    try {
      setLoadingFavorites(true)
      const response = await fetch(`/api/favorites?userId=${userId}`)
      const data = await response.json()
      setFavorites(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Error fetching favorites:", error)
    } finally {
      setLoadingFavorites(false)
    }
  }

  const fetchFollowedShops = async () => {
    try {
      setLoadingFollowedShops(true)
      const response = await fetch(`/api/shop-follows?userId=${userId}`)
      const data = await response.json()
      setFollowedShops(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Error fetching followed shops:", error)
    } finally {
      setLoadingFollowedShops(false)
    }
  }

  const handleRemoveFavorite = async (productId: number) => {
    try {
      const response = await fetch(`/api/favorites?userId=${userId}&productId=${productId}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        toast({ title: "Thành công", description: "Đã xóa khỏi yêu thích" })
        fetchFavorites()
      }
    } catch (error) {
      toast({ title: "Lỗi", description: "Không thể xóa yêu thích", variant: "destructive" })
    }
  }

  const handleUnfollowShop = async (vendorId: number) => {
    try {
      const response = await fetch(`/api/shop-follows?userId=${userId}&vendorId=${vendorId}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        toast({ title: "Thành công", description: "Đã hủy theo dõi shop" })
        fetchFollowedShops()
      }
    } catch (error) {
      toast({ title: "Lỗi", description: "Không thể hủy theo dõi", variant: "destructive" })
    }
  }

  const handleOpenEditProfile = () => {
    if (authUser) {
      setProfileForm({
        name: authUser.name || "",
        phone: authUser.phone || "",
        email: authUser.email || ""
      })
      setEditProfileOpen(true)
    }
  }

  const handleUpdateProfile = async () => {
    try {
      setIsLoading(true)
      
      const response = await fetch(`/api/users?id=${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profileForm.name,
          phone: profileForm.phone
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to update")
      }
      
      toast({ title: "Thành công", description: "Cập nhật thông tin thành công" })
      setEditProfileOpen(false)
      
      await refreshUser()
    } catch (error: any) {
      toast({ title: "Lỗi", description: error.message || "Không thể cập nhật thông tin", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({ title: "Lỗi", description: "Mật khẩu xác nhận không khớp", variant: "destructive" })
      return
    }
    
    if (passwordForm.newPassword.length < 6) {
      toast({ title: "Lỗi", description: "Mật khẩu phải có ít nhất 6 ký tự", variant: "destructive" })
      return
    }

    try {
      setChangingPassword(true)
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          oldPassword: passwordForm.oldPassword,
          newPassword: passwordForm.newPassword
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to change password")
      }
      
      toast({ title: "Thành công", description: "Đổi mật khẩu thành công" })
      setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" })
    } catch (error: any) {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" })
    } finally {
      setChangingPassword(false)
    }
  }

  const user = authUser ? {
    id: authUser.id,
    name: authUser.name || "Người dùng",
    email: authUser.email || "",
    phone: authUser.phone || "",
    avatar: (authUser.name || "User").charAt(0).toUpperCase(),
    joinDate: new Date().toISOString().split('T')[0],
    orders: {
      pending: orders.filter(o => o.status === 'pending' || o.status === 'processing').length,
      completed: orders.filter(o => o.status === 'delivered').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
    },
    stats: {
      points: 0,
      level: "Thành viên",
      returns: returns.length,
      exchanges: exchanges.length,
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
                <Button variant="outline" size="icon" onClick={handleOpenEditProfile}>
                  <Edit2 className="h-5 w-5" />
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
                <Package className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold">{user.stats.returns}</p>
                <p className="text-xs text-muted-foreground">Yêu cầu trả hàng</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <Package className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold">{user.stats.exchanges}</p>
                <p className="text-xs text-muted-foreground">Yêu cầu đổi hàng</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="orders">Đơn hàng</TabsTrigger>
            <TabsTrigger value="returns">Trả hàng</TabsTrigger>
            <TabsTrigger value="exchanges">Đổi hàng</TabsTrigger>
            <TabsTrigger value="addresses">Địa chỉ</TabsTrigger>
            <TabsTrigger value="favorites">Yêu thích</TabsTrigger>
            <TabsTrigger value="following">Đang theo dõi</TabsTrigger>
            <TabsTrigger value="settings">Cài đặt</TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="mt-4 space-y-4">
            {loadingOrders ? (
              <Card><CardContent className="p-6 text-center">Đang tải đơn hàng...</CardContent></Card>
            ) : orders.length === 0 ? (
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
            ) : (
              <>
                {orders.map((order) => (
                  <Card key={order.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <p className="font-semibold">Đơn #{order.orderNumber}</p>
                            <span className={`text-xs px-2 py-1 rounded font-semibold ${
                              order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                              order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                              order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {order.status === 'delivered' ? 'Đã giao' :
                               order.status === 'processing' ? 'Đang xử lý' :
                               order.status === 'pending' ? 'Chờ xác nhận' :
                               'Đã hủy'}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{order.Vendor.name}</p>
                          <p className="text-sm">
                            {order.OrderItem.length} sản phẩm
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-orange-600">{order.total.toLocaleString('vi-VN')}₫</p>
                          <Link href={`/client/orders/${order.id}`}>
                            <Button variant="ghost" size="sm" className="mt-2">
                              Chi tiết <ChevronRight className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {orders.length > 0 && (
                  <Link href="/client/order-history" className="block">
                    <Button variant="outline" className="w-full">Xem tất cả đơn hàng</Button>
                  </Link>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="returns" className="mt-4 space-y-4">
            {loadingReturns || loadingOrders ? (
              <Card><CardContent className="p-6 text-center">Đang tải trả hàng...</CardContent></Card>
            ) : returnedOrders.length === 0 && returns.length === 0 ? (
              <Card>
                <CardContent className="p-6">
                  <div className="text-center py-12">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">Không có yêu cầu trả hàng nào</p>
                    <Link href="/client/returns">
                      <Button>Xem trả hàng</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                {returnedOrders.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg">Đơn hàng đã trả</h3>
                    {returnedOrders.map((order) => (
                      <Card key={order.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <p className="font-semibold">Đơn #{order.orderNumber}</p>
                                <span className="text-xs px-2 py-1 rounded font-semibold bg-orange-100 text-orange-800">
                                  Đã trả
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">{order.Vendor.name}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-orange-600">{order.total.toLocaleString('vi-VN')}₫</p>
                              <Link href={`/client/orders/${order.id}`}>
                                <Button variant="ghost" size="sm" className="mt-2">
                                  Chi tiết <ChevronRight className="h-4 w-4" />
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {returns.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg">Yêu cầu trả hàng</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="p-4 text-center">
                          <p className="text-2xl font-bold text-yellow-600">{returns.filter(r => r.status === 'pending').length}</p>
                          <p className="text-xs text-muted-foreground">Chờ xử lý</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <p className="text-2xl font-bold text-blue-600">{returns.filter(r => r.status === 'approved').length}</p>
                          <p className="text-xs text-muted-foreground">Đã duyệt</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <p className="text-2xl font-bold text-green-600">{returns.filter(r => r.status === 'completed').length}</p>
                          <p className="text-xs text-muted-foreground">Hoàn thành</p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}

                <Link href="/client/returns" className="block">
                  <Button className="w-full">Xem chi tiết trả hàng</Button>
                </Link>
              </>
            )}
          </TabsContent>

          <TabsContent value="exchanges" className="mt-4">
            {loadingReturns ? (
              <Card><CardContent className="p-6 text-center">Đang tải đổi hàng...</CardContent></Card>
            ) : exchanges.length === 0 ? (
              <Card>
                <CardContent className="p-6">
                  <div className="text-center py-12">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">Không có yêu cầu đổi hàng nào</p>
                    <Link href="/client/exchanges">
                      <Button>Xem đổi hàng</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-yellow-600">{exchanges.filter(e => e.status === 'pending').length}</p>
                      <p className="text-xs text-muted-foreground">Chờ liên hệ</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-blue-600">{exchanges.filter(e => e.status === 'approved').length}</p>
                      <p className="text-xs text-muted-foreground">Đã duyệt</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-green-600">{exchanges.filter(e => e.status === 'completed').length}</p>
                      <p className="text-xs text-muted-foreground">Hoàn thành</p>
                    </CardContent>
                  </Card>
                </div>
                <Link href="/client/exchanges" className="block">
                  <Button className="w-full">Xem chi tiết đổi hàng</Button>
                </Link>
              </div>
            )}
          </TabsContent>

          <TabsContent value="addresses" className="mt-4">
            <AddressManagement userId={user?.id ? Number(user.id) : null} />
          </TabsContent>

          <TabsContent value="favorites" className="mt-4">
            {loadingFavorites ? (
              <Card><CardContent className="p-6 text-center">Đang tải yêu thích...</CardContent></Card>
            ) : favorites.length === 0 ? (
              <Card>
                <CardContent className="p-6">
                  <div className="text-center py-12">
                    <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">Chưa có sản phẩm yêu thích</p>
                    <Link href="/">
                      <Button>Bắt đầu thêm yêu thích</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {favorites.map((item: any) => (
                  <Card key={item.id} className="hover:shadow-md transition-shadow overflow-hidden">
                    <div className="aspect-square relative bg-gray-100">
                      {item.Product?.image ? (
                        <Image
                          src={item.Product.image}
                          alt={item.Product.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-sm line-clamp-2 mb-2">
                        {item.Product?.name}
                      </h3>
                      <p className="text-lg font-bold text-orange-600 mb-3">
                        {item.Product?.price?.toLocaleString('vi-VN')}₫
                      </p>
                      <div className="flex gap-2">
                        <Link href={`/products/${item.Product?.id}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full">
                            Xem chi tiết
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFavorite(item.Product?.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="following" className="mt-4 space-y-4">
            {loadingFollowedShops ? (
              <Card><CardContent className="p-6 text-center">Đang tải danh sách theo dõi...</CardContent></Card>
            ) : followedShops.length === 0 ? (
              <Card>
                <CardContent className="p-6">
                  <div className="text-center py-12">
                    <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Bạn chưa theo dõi shop nào</p>
                    <Link href="/client/shop">
                      <Button className="mt-4">Khám phá cửa hàng</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {followedShops.map((item) => (
                  <Card key={item.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-full overflow-hidden flex-shrink-0 border">
                          {item.Vendor?.logo ? (
                            <img src={item.Vendor.logo} alt={item.Vendor.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold text-xl">
                              {item.Vendor?.name?.charAt(0) || 'S'}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <Link href={`/client/shop/${item.Vendor?.slug || item.Vendor?.id}`} className="hover:underline">
                            <h3 className="font-bold text-lg truncate">{item.Vendor?.name}</h3>
                          </Link>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Award className="h-3 w-3" /> {item.Vendor?.rating || 0}
                            </span>
                            <span>•</span>
                            <span>{item.Vendor?.followers || 0} người theo dõi</span>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleUnfollowShop(item.vendorId)}
                        >
                          Bỏ theo dõi
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="settings" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Cài đặt bảo mật</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Label htmlFor="old-password">Mật khẩu cũ</Label>
                  <Input
                    id="old-password"
                    type="password"
                    placeholder="Nhập mật khẩu cũ"
                    value={passwordForm.oldPassword}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, oldPassword: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="new-password">Mật khẩu mới</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="Nhập mật khẩu mới"
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Mật khẩu phải có ít nhất 6 ký tự
                  </p>
                </div>
                <div className="space-y-3">
                  <Label htmlFor="confirm-password">Xác nhận mật khẩu</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Xác nhận mật khẩu mới"
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                    }
                  />
                </div>
                <Button
                  onClick={handleChangePassword}
                  disabled={changingPassword}
                  className="w-full"
                >
                  {changingPassword ? "Đang cập nhật..." : "Đổi mật khẩu"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Thông báo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer p-3 hover:bg-muted rounded">
                  <input type="checkbox" defaultChecked className="w-4 h-4" />
                  <div className="flex-1">
                    <p className="font-semibold text-sm">Thông báo qua email</p>
                    <p className="text-xs text-muted-foreground">
                      Nhận cập nhật về đơn hàng và khuyến mãi
                    </p>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer p-3 hover:bg-muted rounded">
                  <input type="checkbox" defaultChecked className="w-4 h-4" />
                  <div className="flex-1">
                    <p className="font-semibold text-sm">Thông báo SMS</p>
                    <p className="text-xs text-muted-foreground">
                      Nhận tin nhắn SMS về trạng thái đơn hàng
                    </p>
                  </div>
                </label>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={editProfileOpen} onOpenChange={setEditProfileOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Chỉnh sửa thông tin cá nhân</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Họ tên</Label>
                <Input
                  id="edit-name"
                  value={profileForm.name}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, name: e.target.value })
                  }
                  placeholder="Nhập họ tên"
                />
              </div>
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={profileForm.email}
                  disabled
                  placeholder="Email"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Email không thể thay đổi
                </p>
              </div>
              <div>
                <Label htmlFor="edit-phone">Số điện thoại</Label>
                <Input
                  id="edit-phone"
                  value={profileForm.phone}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, phone: e.target.value })
                  }
                  placeholder="Nhập số điện thoại"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditProfileOpen(false)}
              >
                Hủy
              </Button>
              <Button 
                onClick={handleUpdateProfile}
                disabled={!userId || !profileForm.name}
              >
                Lưu thay đổi
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  )
}
