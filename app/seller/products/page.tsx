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

import { usePagination } from "@/hooks/use-pagination"
import { Pagination } from "@/components/pagination"

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
  
  const pagination = usePagination({ initialPage: 1, initialLimit: 20 })

  useEffect(() => {
    if (user?.id) {
      fetchProducts()
    }
  }, [user?.id, pagination.page, pagination.limit])

  const fetchProducts = async () => {
    try {
      if (!refreshing) {
        setIsLoading(true)
        setLoading(true)
      }
      const response = await fetch(`/api/seller/products?limit=${pagination.limit}&offset=${pagination.offset}`, {
        credentials: 'include'
      })
      const data = await response.json()
      setProducts(data.data || [])
      pagination.setTotal(data.pagination?.total || 0)
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách sản phẩm",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setIsLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    pagination.setPage(1) // Reset to first page on refresh
    // fetchProducts will be triggered by useEffect if page changes, 
    // but if page is already 1, we need to call it manually or add refreshing to dependency?
    // Better to just call fetchProducts directly here if page doesn't change, 
    // or rely on the fact that we want to reload current page?
    // Let's just call fetchProducts directly to be safe and keep current page or reset?
    // Usually refresh means reload current view.
    // But if I want to reset to page 1, I should do that.
    // Let's keep it simple: reload current page.
    fetchProducts()
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
      <main className="p-4 md:p-6">
        <p className="text-center">Đang tải sản phẩm...</p>
      </main>
    )
  }

  return (
    <main className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Sản phẩm của tôi</h1>
        <div className="flex gap-2 w-full md:w-auto">
          <Button 
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            size="sm"
            className="flex-1 md:flex-initial text-xs md:text-sm"
          >
            <RotateCw className={`h-4 w-4 mr-1 md:mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
          <Button 
            onClick={() => router.push('/seller/products/create')}
            className="bg-orange-600 hover:bg-orange-700 flex-1 md:flex-initial text-xs md:text-sm"
          >
            <Plus className="h-4 w-4 mr-1 md:mr-2" />
            Thêm sản phẩm
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">Danh sách sản phẩm ({products.length})</CardTitle>
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
            <div className="space-y-3 md:space-y-0 md:overflow-x-auto">
              <div className="hidden md:block">
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

              <div className="md:hidden space-y-3">
                {products.map((product) => (
                  <div key={product.id} className="border rounded-lg p-3 space-y-2 bg-card">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{getStatusBadge(product.status)}</p>
                      </div>
                      <button
                        onClick={() => toggleExpandProduct(product.id)}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-slate-800 rounded flex-shrink-0"
                      >
                        {expandedProductIds.has(product.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <div className="space-y-1 text-xs border-t pt-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Giá bán:</span>
                        <span className="font-semibold">{formatPrice(product.price)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Kho:</span>
                        <span>{calculateTotalStock(product)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Bán:</span>
                        <span>{product.sold}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Đánh giá:</span>
                        <span>⭐ {(product.rating || 0).toFixed(1)}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="flex-1 text-xs"
                        onClick={() => router.push(`/seller/products/${product.id}`)}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="flex-1 text-xs"
                        onClick={() => router.push(`/seller/products/${product.id}/edit`)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="flex-1 text-xs"
                        onClick={() => handleDuplicate(product.id)}
                        disabled={duplicatingId === product.id}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="flex-1 text-destructive hover:text-destructive text-xs"
                        onClick={() => handleDelete(product.id)}
                        disabled={deletingId === product.id}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    {expandedProductIds.has(product.id) && product.ProductVariant && product.ProductVariant.length > 0 && (
                      <div className="mt-2 pt-2 border-t space-y-2">
                        {product.ProductVariant.map((variant) => (
                          <div key={`variant-${variant.id}`} className="text-xs bg-gray-50 dark:bg-slate-800 p-2 rounded">
                            <p className="font-medium">{variant.name}</p>
                            <div className="space-y-1 mt-1">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Giá:</span>
                                <span>{formatPrice(variant.price)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Kho:</span>
                                <span>{variant.stock}</span>
                              </div>
                            </div>
                            <div className="flex gap-1 mt-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="flex-1 text-xs h-7"
                                onClick={() => router.push(`/seller/products/${product.id}/edit`)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="flex-1 text-destructive hover:text-destructive text-xs h-7"
                                onClick={() => handleDeleteVariant(product.id, variant.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="mt-4">
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={pagination.goToPage}
              limit={pagination.limit}
              onLimitChange={pagination.setPageLimit}
              total={pagination.total}
            />
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
