"use client"

import React, { useEffect } from "react"
import { Plus, Edit, Trash2, Eye, Copy, ChevronDown, ChevronRight, RotateCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
import { useLoading } from "@/hooks/use-loading"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { formatPrice, calculateTotalStock } from "@/lib/utils"

interface ProductVariant {
  id: number
  name: string
  price: number
  originalPrice?: number | null
  stock: number
}

interface Product {
  id: number
  name: string
  price: number
  originalPrice?: number | null
  stock: number
  sold: number
  rating: number
  status: 'pending' | 'approved' | 'rejected'
  taxApplied?: boolean
  taxRate?: number
  taxIncluded?: boolean
  ProductVariant?: ProductVariant[]
}

export default function SellerProductsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const { setIsLoading } = useLoading()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [duplicatingId, setDuplicatingId] = useState<number | null>(null)
  const [expandedProductIds, setExpandedProductIds] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (user?.id) {
      fetchProducts()
    }
  }, [user?.id])

  const fetchProducts = async () => {
    try {
      setIsLoading(true)
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
      setIsLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    setIsLoading(true)
    try {
      const response = await fetch(`/api/seller/products`, {
        credentials: 'include'
      })
      const data = await response.json()
      setProducts(data.data || [])
      toast({
        title: "Thành công",
        description: "Đã cập nhật danh sách sản phẩm",
      })
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật danh sách sản phẩm",
        variant: "destructive",
      })
    } finally {
      setRefreshing(false)
      setIsLoading(false)
    }
  }

  const handleDelete = async (productId: number) => {
    if (!confirm('Bạn chắc chắn muốn xóa sản phẩm này?')) return

    try {
      setIsLoading(true)
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
      setIsLoading(false)
    }
  }

  const handleDuplicate = async (productId: number) => {
    try {
      setIsLoading(true)
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
      setIsLoading(false)
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

  const toggleExpandProduct = (productId: number) => {
    const newExpanded = new Set(expandedProductIds)
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId)
    } else {
      newExpanded.add(productId)
    }
    setExpandedProductIds(newExpanded)
  }

  const handleDeleteVariant = async (productId: number, variantId: number) => {
    if (!confirm('Bạn chắc chắn muốn xóa variant này?')) return

    try {
      setIsLoading(true)
      const response = await fetch(`/api/seller/products/${productId}/variants/${variantId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Không thể xóa variant')
      }

      toast({
        title: "Thành công",
        description: "Variant đã được xóa",
      })

      setProducts(products.map(p => 
        p.id === productId 
          ? { ...p, ProductVariant: (p.ProductVariant || []).filter(v => v.id !== variantId) }
          : p
      ))
    } catch (error) {
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Không thể xóa variant",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
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
        <div className="flex gap-2">
          <Button 
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            size="sm"
          >
            <RotateCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
          <Button 
            onClick={() => router.push('/seller/products/create')}
            className="bg-orange-600 hover:bg-orange-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Thêm sản phẩm
          </Button>
        </div>
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
                    <th className="text-left py-3 px-2 w-8"></th>
                    <th className="text-left py-3 px-4">Sản phẩm</th>
                    <th className="text-left py-3 px-4">Giá gốc</th>
                    <th className="text-left py-3 px-4">Giá bán</th>
                    <th className="text-left py-3 px-4">Giá sau thuế</th>
                    <th className="text-left py-3 px-4">Kho</th>
                    <th className="text-left py-3 px-4">Bán</th>
                    <th className="text-left py-3 px-4">Đánh giá</th>
                    <th className="text-left py-3 px-4">Trạng thái</th>
                    <th className="text-left py-3 px-4">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <React.Fragment key={`product-${product.id}`}>
                      <tr className="border-b border-border hover:bg-surface dark:hover:bg-slate-900">
                        <td className="py-3 px-2">
                          <button
                            onClick={() => toggleExpandProduct(product.id)}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-slate-800 rounded"
                          >
                            {expandedProductIds.has(product.id) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                        </td>
                        <td className="py-3 px-4">
                          <div className="max-w-md truncate">{product.name}</div>
                        </td>
                        <td className="py-3 px-4 font-semibold">{formatPrice(product.originalPrice || product.price)}</td>
                        <td className="py-3 px-4 font-semibold">{formatPrice(product.price)}</td>
                        <td className="py-3 px-4">
                          {product.taxApplied && product.taxRate ? (
                            formatPrice(
                              product.taxIncluded 
                                ? product.price 
                                : product.price * (1 + product.taxRate / 100)
                            )
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="py-3 px-4">{calculateTotalStock(product)}</td>
                        <td className="py-3 px-4">{product.sold}</td>
                        <td className="py-3 px-4">⭐ {(product.rating || 0).toFixed(1)}</td>
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
                      {expandedProductIds.has(product.id) && product.ProductVariant && product.ProductVariant.length > 0 && (
                        <>
                          {product.ProductVariant.map((variant) => (
                            <tr key={`variant-${variant.id}`} className="border-b border-border bg-gray-50 dark:bg-slate-800/50">
                              <td colSpan={2} className="py-3 px-4 pl-12">
                                <div className="text-sm font-medium">{variant.name}</div>
                              </td>
                              <td className="py-3 px-4">{formatPrice(variant.originalPrice || variant.price)}</td>
                              <td className="py-3 px-4">{formatPrice(variant.price)}</td>
                              <td className="py-3 px-4">-</td>
                              <td className="py-3 px-4">{variant.stock}</td>
                              <td colSpan={3}></td>
                              <td className="py-3 px-4">
                                <div className="flex gap-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    title="Chỉnh sửa variant"
                                    onClick={() => router.push(`/seller/products/${product.id}/edit`)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    className="text-destructive hover:text-destructive"
                                    title="Xóa variant"
                                    onClick={() => handleDeleteVariant(product.id, variant.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </>
                      )}
                    </React.Fragment>
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
