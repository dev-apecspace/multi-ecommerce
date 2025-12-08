"use client"

import { useState, useEffect } from "react"
import { Check, X, Clock, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { formatPrice } from "@/lib/utils"
import { useRouter } from "next/navigation"

interface Product {
  id: number
  name: string
  price: number
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  Vendor?: {
    id: number
    name: string
  }
  Category?: {
    name: string
  }
}

export default function AdminProductsPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('pending')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  useEffect(() => {
    fetchProducts()
  }, [activeTab])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/products?status=${activeTab}`)
      const data = await response.json()
      setProducts(data.data || [])
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách sản phẩm",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const statuses = ['pending', 'approved', 'rejected']
      const newStats = { pending: 0, approved: 0, rejected: 0, total: 0 }

      for (const status of statuses) {
        const response = await fetch(`/api/admin/products?status=${status}&limit=1`)
        const data = await response.json()
        newStats[status as keyof typeof newStats] = data.pagination?.total || 0
        newStats.total += newStats[status as keyof typeof newStats]
      }

      setStats(newStats)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  const handleApprove = async (product: Product) => {
    try {
      const response = await fetch('/api/admin/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          status: 'approved',
        }),
      })

      if (response.ok) {
        toast({
          title: "Thành công",
          description: `Đã phê duyệt sản phẩm: ${product.name}`,
        })
        setProducts(prev => prev.filter(p => p.id !== product.id))
        fetchStats()
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể phê duyệt sản phẩm",
        variant: "destructive",
      })
    }
  }

  const handleReject = async (product: Product) => {
    try {
      const response = await fetch('/api/admin/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          status: 'rejected',
        }),
      })

      if (response.ok) {
        toast({
          title: "Thành công",
          description: `Đã từ chối sản phẩm: ${product.name}`,
        })
        setProducts(prev => prev.filter(p => p.id !== product.id))
        fetchStats()
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể từ chối sản phẩm",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      pending: { label: 'Chờ duyệt', color: 'bg-yellow-100 text-yellow-800' },
      approved: { label: 'Đã duyệt', color: 'bg-green-100 text-green-800' },
      rejected: { label: 'Từ chối', color: 'bg-red-100 text-red-800' },
    }
    const style = statusMap[status] || statusMap.pending
    return <span className={`${style.color} px-2 py-1 rounded text-xs`}>{style.label}</span>
  }

  return (
    <main className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Quản lý sản phẩm</h1>
        <p className="text-muted-foreground">Phê duyệt sản phẩm do nhà bán hàng đăng tải</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Tổng sản phẩm</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Đã duyệt</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{stats.approved}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Từ chối</p>
            <p className="text-3xl font-bold text-red-600 mt-2">{stats.rejected}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Chờ duyệt</p>
            <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.pending}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách sản phẩm</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="pending">Chờ duyệt ({stats.pending})</TabsTrigger>
              <TabsTrigger value="approved">Đã duyệt ({stats.approved})</TabsTrigger>
              <TabsTrigger value="rejected">Từ chối ({stats.rejected})</TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="mt-6">
              {loading ? (
                <p className="text-center text-muted-foreground py-8">Đang tải...</p>
              ) : products.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-2 opacity-50" />
                  <p className="text-muted-foreground">Không có sản phẩm nào chờ duyệt</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {products.map((product) => (
                    <div key={product.id} className="border rounded-lg p-4 hover:bg-muted">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h3 className="font-semibold text-lg mb-1">{product.name}</h3>
                          <p className="text-sm text-muted-foreground">Shop: {product.Vendor?.name || 'N/A'}</p>
                          <p className="text-sm text-muted-foreground">Danh mục: {product.Category?.name || 'N/A'}</p>
                          <p className="text-sm text-muted-foreground">
                            Ngày gửi: {new Date(product.createdAt).toLocaleDateString('vi-VN')}
                          </p>
                        </div>
                        <div className="flex flex-col justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Giá bán</p>
                            <p className="text-2xl font-bold text-blue-600">
                              {formatPrice(product.price)}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => router.push(`/admin/products/${product.id}`)}
                              size="sm"
                              variant="outline"
                              className="flex-1"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Xem chi tiết
                            </Button>
                            <Button
                              onClick={() => handleApprove(product)}
                              className="flex-1 bg-green-600 hover:bg-green-700"
                            >
                              <Check className="h-4 w-4 mr-2" />
                              Phê duyệt
                            </Button>
                            <Button
                              onClick={() => handleReject(product)}
                              variant="outline"
                              className="flex-1 text-red-600 hover:text-red-700"
                            >
                              <X className="h-4 w-4 mr-2" />
                              Từ chối
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="approved" className="mt-6">
              {loading ? (
                <p className="text-center text-muted-foreground py-8">Đang tải...</p>
              ) : products.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Không có sản phẩm nào được duyệt</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4">Sản phẩm</th>
                        <th className="text-left py-3 px-4">Shop</th>
                        <th className="text-left py-3 px-4">Giá</th>
                        <th className="text-left py-3 px-4">Trạng thái</th>
                        <th className="text-left py-3 px-4">Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((product) => (
                        <tr key={product.id} className="border-b border-border hover:bg-muted">
                          <td className="py-3 px-4">{product.name}</td>
                          <td className="py-3 px-4">{product.Vendor?.name || 'N/A'}</td>
                          <td className="py-3 px-4 font-semibold">{formatPrice(product.price)}</td>
                          <td className="py-3 px-4">{getStatusBadge(product.status)}</td>
                          <td className="py-3 px-4">
                            <Button
                              onClick={() => router.push(`/admin/products/${product.id}`)}
                              size="sm"
                              variant="ghost"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="rejected" className="mt-6">
              {loading ? (
                <p className="text-center text-muted-foreground py-8">Đang tải...</p>
              ) : products.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Không có sản phẩm nào bị từ chối</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4">Sản phẩm</th>
                        <th className="text-left py-3 px-4">Shop</th>
                        <th className="text-left py-3 px-4">Giá</th>
                        <th className="text-left py-3 px-4">Trạng thái</th>
                        <th className="text-left py-3 px-4">Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((product) => (
                        <tr key={product.id} className="border-b border-border hover:bg-muted">
                          <td className="py-3 px-4">{product.name}</td>
                          <td className="py-3 px-4">{product.Vendor?.name || 'N/A'}</td>
                          <td className="py-3 px-4 font-semibold">{formatPrice(product.price)}</td>
                          <td className="py-3 px-4">{getStatusBadge(product.status)}</td>
                          <td className="py-3 px-4">
                            <Button
                              onClick={() => router.push(`/admin/products/${product.id}`)}
                              size="sm"
                              variant="ghost"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </main>
  )
}
