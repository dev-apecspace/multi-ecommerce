"use client"

import { useState, useEffect } from "react"
import { Clock, Eye } from "lucide-react"
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

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      pending: {
        label: 'Chờ duyệt',
        color: 'border-amber-300 bg-amber-100 text-amber-900 dark:border-amber-500/50 dark:bg-amber-500/15 dark:text-amber-200',
      },
      approved: {
        label: 'Đã duyệt',
        color: 'border-emerald-300 bg-emerald-100 text-emerald-900 dark:border-emerald-500/50 dark:bg-emerald-500/15 dark:text-emerald-200',
      },
      rejected: {
        label: 'Từ chối',
        color: 'border-rose-300 bg-rose-100 text-rose-900 dark:border-rose-500/50 dark:bg-rose-500/15 dark:text-rose-200',
      },
    }
    const style = statusMap[status] || statusMap.pending
    return (
      <span className={`${style.color} inline-flex min-h-7 items-center gap-1.5 border-2 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.1em] shadow-[2px_2px_0_rgba(15,23,42,0.12)] dark:shadow-[2px_2px_0_rgba(255,255,255,0.08)]`}>
        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
        {style.label}
      </span>
    )
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

  const renderProductCards = (emptyMessage: string) => {
    if (loading) {
      return <p className="py-8 text-center text-muted-foreground">Đang tải...</p>
    }

    if (products.length === 0) {
      return (
        <div className="py-8 text-center">
          <Clock className="mx-auto mb-2 h-12 w-12 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">{emptyMessage}</p>
        </div>
      )
    }

    return (
      <>
        <div className="space-y-3 md:space-y-4">
          {products.map((product) => (
            <div key={product.id}>
              <article className="border border-border p-3 transition-colors hover:bg-muted/50 md:p-4">
                <div className="flex items-start gap-3 md:gap-4">
                  <div className="min-w-0 flex-1 space-y-3 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
                    <div className="min-w-0">
                      <h3 className="mb-1 truncate text-sm font-semibold md:text-lg">{product.name}</h3>
                      <p className="truncate text-xs text-muted-foreground md:text-sm">Shop: {product.Vendor?.name || 'N/A'}</p>
                      <p className="truncate text-xs text-muted-foreground md:text-sm">Danh mục: {product.Category?.name || 'N/A'}</p>
                      <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-300 md:text-sm">
                        {product.ProductVariant?.length ?? 0} biến thể
                      </p>
                      <p className="text-xs text-muted-foreground md:text-sm">
                        Ngày: {new Date(product.createdAt).toLocaleDateString('vi-VN')}
                      </p>
                    </div>

                    <section
                      aria-label={`Thông tin duyệt và giá của ${product.name}`}
                      className="min-w-0 border border-slate-200 bg-slate-50/90 p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/50"
                    >
                      <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-2.5 dark:border-slate-800">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
                          Trạng thái duyệt
                        </p>
                        {getStatusBadge(product.status)}
                      </div>

                      <div className="py-3">
                        <p className="text-xs font-medium text-muted-foreground">
                          Giá bán {product.taxApplied && !product.taxIncluded && '(sau thuế)'}
                        </p>
                        <p className="mt-0.5 text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
                          {getDisplayPrice(product)}
                        </p>
                        {product.taxApplied && product.taxRate && (
                          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                            <span>VAT {product.taxRate}%</span>
                            <span aria-hidden="true">·</span>
                            <span>{product.taxIncluded ? 'Đã bao gồm thuế' : 'Chưa bao gồm thuế'}</span>
                          </div>
                        )}
                      </div>

                      <Button
                        onClick={() => router.push(`/admin/products/${product.id}`)}
                        size="sm"
                        variant="outline"
                        className="h-9 w-full border-slate-300 bg-background text-xs font-semibold hover:border-slate-400 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800 md:text-sm"
                      >
                        <Eye className="mr-1.5 h-3.5 w-3.5 md:h-4 md:w-4" />
                        Xem chi tiết
                      </Button>
                    </section>
                  </div>
                </div>
              </article>
            </div>
          ))}
        </div>

        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={pagination.goToPage}
          limit={pagination.limit}
          onLimitChange={pagination.setPageLimit}
          total={pagination.total}
        />
      </>
    )
  }

  return (
    <main className="p-4 md:p-6">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Quản lý sản phẩm</h1>
        <p className="text-xs md:text-base text-muted-foreground">Phê duyệt sản phẩm do nhà bán hàng đăng tải</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-6 md:mb-8">
        <Card>
          <CardContent className="p-3 md:p-6">
            <p className="text-xs md:text-sm text-muted-foreground">Tổng sản phẩm</p>
            <p className="text-2xl md:text-3xl font-bold text-blue-600 mt-1 md:mt-2">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-6">
            <p className="text-xs md:text-sm text-muted-foreground">Đã duyệt</p>
            <p className="text-2xl md:text-3xl font-bold text-green-600 mt-1 md:mt-2">{stats.approved}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-6">
            <p className="text-xs md:text-sm text-muted-foreground">Từ chối</p>
            <p className="text-2xl md:text-3xl font-bold text-red-600 mt-1 md:mt-2">{stats.rejected}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-6">
            <p className="text-xs md:text-sm text-muted-foreground">Chờ duyệt</p>
            <p className="text-2xl md:text-3xl font-bold text-yellow-600 mt-1 md:mt-2">{stats.pending}</p>
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
              {renderProductCards('Không có sản phẩm nào chờ duyệt')}
            </TabsContent>

            <TabsContent value="approved" className="mt-6">
              {renderProductCards('Không có sản phẩm nào được duyệt')}
            </TabsContent>

            <TabsContent value="rejected" className="mt-6">
              {renderProductCards('Không có sản phẩm nào bị từ chối')}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </main>
  )
}
