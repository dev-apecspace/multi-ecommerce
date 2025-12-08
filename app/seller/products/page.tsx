"use client"

import { useEffect } from "react"
import { Plus, Edit, Trash2, Eye, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { formatPrice } from "@/lib/utils"

interface Product {
  id: number
  name: string
  price: number
  stock: number
  sold: number
  rating: number
  status: 'pending' | 'approved' | 'rejected'
}

export default function SellerProductsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [duplicatingId, setDuplicatingId] = useState<number | null>(null)

  useEffect(() => {
    if (user?.id) {
      fetchProducts()
    }
  }, [user?.id])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/seller/products`, {
        credentials: 'include'
      })
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

  const handleDelete = async (productId: number) => {
    if (!confirm('Bạn chắc chắn muốn xóa sản phẩm này?')) return

    try {
      setDeletingId(productId)
      const response = await fetch(`/api/seller/products/${productId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Không thể xóa sản phẩm')
      }

      toast({
        title: "Thành công",
        description: "Sản phẩm đã được xóa",
      })

      setProducts(products.filter(p => p.id !== productId))
    } catch (error) {
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Không thể xóa sản phẩm",
        variant: "destructive",
      })
    } finally {
      setDeletingId(null)
    }
  }

  const handleDuplicate = async (productId: number) => {
    try {
      setDuplicatingId(productId)
      const response = await fetch(`/api/seller/products/${productId}/duplicate`, {
        method: 'POST',
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Không thể nhân bản sản phẩm')
      }

      const data = await response.json()
      toast({
        title: "Thành công",
        description: "Sản phẩm đã được nhân bản",
      })

      fetchProducts()
    } catch (error) {
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Không thể nhân bản sản phẩm",
        variant: "destructive",
      })
    } finally {
      setDuplicatingId(null)
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

  if (loading) {
    return (
      <main className="p-6">
        <p className="text-center">Đang tải sản phẩm...</p>
      </main>
    )
  }

  return (
    <main className="p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Sản phẩm của tôi</h1>
        <Button 
          onClick={() => router.push('/seller/products/create')}
          className="bg-orange-600 hover:bg-orange-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Thêm sản phẩm
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách sản phẩm ({products.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">Bạn chưa có sản phẩm nào</p>
              <Button 
                onClick={() => router.push('/seller/products/create')}
                className="bg-orange-600 hover:bg-orange-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Thêm sản phẩm đầu tiên
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4">Sản phẩm</th>
                    <th className="text-left py-3 px-4">Giá</th>
                    <th className="text-left py-3 px-4">Kho</th>
                    <th className="text-left py-3 px-4">Bán</th>
                    <th className="text-left py-3 px-4">Đánh giá</th>
                    <th className="text-left py-3 px-4">Trạng thái</th>
                    <th className="text-left py-3 px-4">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="border-b border-border hover:bg-surface dark:hover:bg-slate-900">
                      <td className="py-3 px-4">
                        <div className="max-w-md truncate">{product.name}</div>
                      </td>
                      <td className="py-3 px-4 font-semibold">{formatPrice(product.price)}</td>
                      <td className="py-3 px-4">{product.stock}</td>
                      <td className="py-3 px-4">{product.sold}</td>
                      <td className="py-3 px-4">⭐ {product.rating.toFixed(1)}</td>
                      <td className="py-3 px-4">{getStatusBadge(product.status)}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            title="Xem chi tiết"
                            onClick={() => router.push(`/seller/products/${product.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            title="Chỉnh sửa"
                            onClick={() => router.push(`/seller/products/${product.id}/edit`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            title="Nhân bản"
                            onClick={() => handleDuplicate(product.id)}
                            disabled={duplicatingId === product.id}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-destructive hover:text-destructive"
                            title="Xóa"
                            onClick={() => handleDelete(product.id)}
                            disabled={deletingId === product.id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
