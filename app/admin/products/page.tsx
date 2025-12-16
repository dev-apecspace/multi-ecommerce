"use client"

import React, { useState, useEffect } from "react"
import { Check, X, Clock, Eye, ChevronDown, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Pagination } from "@/components/pagination"
import { usePagination } from "@/hooks/use-pagination"
import { formatPrice } from "@/lib/utils"
import { useRouter } from "next/navigation"

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
  stock?: number
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  taxApplied?: boolean
  taxIncluded?: boolean
  taxRate?: number
  Vendor?: {
    id: number
    name: string
  }
  Category?: {
    name: string
  }
  ProductVariant?: ProductVariant[]
}

export default function AdminProductsPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('pending')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [expandedProductIds, setExpandedProductIds] = useState<Set<number>>(new Set())
  const pagination = usePagination({ initialPage: 1, initialLimit: 10 })

  useEffect(() => {
    fetchProducts()
  }, [activeTab, pagination.page, pagination.limit])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const url = new URL('/api/admin/products', window.location.origin)
      url.searchParams.append('status', activeTab)
      url.searchParams.append('page', String(pagination.page))
      url.searchParams.append('limit', String(pagination.limit))
      
      const response = await fetch(url.toString())
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

  const toggleExpandProduct = (productId: number) => {
    const newExpanded = new Set(expandedProductIds)
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId)
    } else {
      newExpanded.add(productId)
    }
    setExpandedProductIds(newExpanded)
  }

  const getDisplayPrice = (product: Product) => {
    if (!product.taxApplied || !product.taxRate) {
      return formatPrice(product.price)
    }
    
    if (product.taxIncluded) {
      return formatPrice(product.price)
    }
    
    return formatPrice(product.price * (1 + product.taxRate / 100))
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
                <>
                  <div className="space-y-4">
                    {products.map((product) => (
                      <div key={product.id}>
                        <div className="border rounded-lg p-4 hover:bg-muted">
                          <div className="flex items-start gap-4">
                            <button
                              onClick={() => toggleExpandProduct(product.id)}
                              className="p-1 hover:bg-gray-200 dark:hover:bg-slate-800 rounded mt-1"
                            >
                              {expandedProductIds.has(product.id) ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </button>
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                  <p className="text-sm text-muted-foreground">Giá bán {product.taxApplied && '(sau thuế)'}</p>
                                  <p className="text-2xl font-bold text-blue-600">
                                    {getDisplayPrice(product)}
                                  </p>
                                  {product.taxApplied && product.taxRate && (
                                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                                      Thuế: {product.taxRate}%
                                    </p>
                                  )}
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
                        </div>
                        {expandedProductIds.has(product.id) && product.ProductVariant && product.ProductVariant.length > 0 && (
                          <div className="border-l-2 border-b border-r rounded-b-lg p-4 bg-gray-50 dark:bg-slate-800/50 space-y-2">
                            {product.ProductVariant.map((variant) => (
                              <div key={`variant-${variant.id}`} className="pl-4">
                                <p className="text-sm font-medium">{variant.name}</p>
                                <p className="text-sm text-muted-foreground">Giá: {formatPrice(variant.price)}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {products.length > 0 && (
                    <Pagination
                      currentPage={pagination.page}
                      totalPages={pagination.totalPages}
                      onPageChange={pagination.goToPage}
                      limit={pagination.limit}
                      onLimitChange={pagination.setPageLimit}
                      total={pagination.total}
                    />
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="approved" className="mt-6">
              {loading ? (
                <p className="text-center text-muted-foreground py-8">Đang tải...</p>
              ) : products.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Không có sản phẩm nào được duyệt</p>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-2 w-8"></th>
                          <th className="text-left py-3 px-4">Sản phẩm</th>
                          <th className="text-left py-3 px-4">Shop</th>
                          <th className="text-left py-3 px-4">Giá</th>
                          <th className="text-left py-3 px-4">Trạng thái</th>
                          <th className="text-left py-3 px-4">Hành động</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((product) => (
                          <React.Fragment key={product.id}>
                            <tr className="border-b border-border hover:bg-muted">
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
                              <td className="py-3 px-4">{product.name}</td>
                              <td className="py-3 px-4">{product.Vendor?.name || 'N/A'}</td>
                              <td className="py-3 px-4 font-semibold">
                                {getDisplayPrice(product)}
                                {product.taxApplied && product.taxRate && (
                                  <span className="text-xs text-amber-600 dark:text-amber-400 ml-1">({product.taxRate}%)</span>
                                )}
                              </td>
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
                            {expandedProductIds.has(product.id) && product.ProductVariant && product.ProductVariant.length > 0 && (
                              <>
                                {product.ProductVariant.map((variant) => (
                                  <tr key={`variant-${variant.id}`} className="border-b border-border bg-gray-50 dark:bg-slate-800/50">
                                    <td colSpan={2} className="py-3 px-4 pl-12">
                                      <div className="text-sm font-medium">{variant.name}</div>
                                    </td>
                                    <td className="py-3 px-4"></td>
                                    <td className="py-3 px-4">{formatPrice(variant.price)}</td>
                                    <td colSpan={2}></td>
                                  </tr>
                                ))}
                              </>
                            )}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {products.length > 0 && (
                    <Pagination
                      currentPage={pagination.page}
                      totalPages={pagination.totalPages}
                      onPageChange={pagination.goToPage}
                      limit={pagination.limit}
                      onLimitChange={pagination.setPageLimit}
                      total={pagination.total}
                    />
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="rejected" className="mt-6">
              {loading ? (
                <p className="text-center text-muted-foreground py-8">Đang tải...</p>
              ) : products.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Không có sản phẩm nào bị từ chối</p>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-2 w-8"></th>
                          <th className="text-left py-3 px-4">Sản phẩm</th>
                          <th className="text-left py-3 px-4">Shop</th>
                          <th className="text-left py-3 px-4">Giá</th>
                          <th className="text-left py-3 px-4">Trạng thái</th>
                          <th className="text-left py-3 px-4">Hành động</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((product) => (
                          <React.Fragment key={product.id}>
                            <tr className="border-b border-border hover:bg-muted">
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
                              <td className="py-3 px-4">{product.name}</td>
                              <td className="py-3 px-4">{product.Vendor?.name || 'N/A'}</td>
                              <td className="py-3 px-4 font-semibold">
                                {getDisplayPrice(product)}
                                {product.taxApplied && product.taxRate && (
                                  <span className="text-xs text-amber-600 dark:text-amber-400 ml-1">({product.taxRate}%)</span>
                                )}
                              </td>
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
                            {expandedProductIds.has(product.id) && product.ProductVariant && product.ProductVariant.length > 0 && (
                              <>
                                {product.ProductVariant.map((variant) => (
                                  <tr key={`variant-${variant.id}`} className="border-b border-border bg-gray-50 dark:bg-slate-800/50">
                                    <td colSpan={2} className="py-3 px-4 pl-12">
                                      <div className="text-sm font-medium">{variant.name}</div>
                                    </td>
                                    <td className="py-3 px-4"></td>
                                    <td className="py-3 px-4">{formatPrice(variant.price)}</td>
                                    <td colSpan={2}></td>
                                  </tr>
                                ))}
                              </>
                            )}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {products.length > 0 && (
                    <Pagination
                      currentPage={pagination.page}
                      totalPages={pagination.totalPages}
                      onPageChange={pagination.goToPage}
                      limit={pagination.limit}
                      onLimitChange={pagination.setPageLimit}
                      total={pagination.total}
                    />
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </main>
  )
}
