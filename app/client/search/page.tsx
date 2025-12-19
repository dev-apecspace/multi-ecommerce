"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { SearchIcon, X, Star, Heart, HeartPulse as HeartFilled } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { formatPrice } from "@/lib/utils"
import { usePagination } from "@/hooks/use-pagination"
import { Pagination } from "@/components/pagination"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import { useFavoritesContext } from "@/lib/favorites-context"

function SearchContent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { toast } = useToast()
  const { updateFavoritesCount } = useFavoritesContext()
  const initialQuery = searchParams.get("q") || ""
  
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [favorites, setFavorites] = useState<string[]>([])
  
  const pagination = usePagination({ initialPage: 1, initialLimit: 20 })

  useEffect(() => {
    const query = searchParams.get("q") || ""
    if (query !== searchQuery) {
      setSearchQuery(query)
    }
    
    if (query) {
      fetchProducts(query)
    } else {
      setProducts([])
      pagination.setTotal(0)
    }
  }, [searchParams, pagination.page, pagination.limit])

  useEffect(() => {
    const loadFavorites = async () => {
      if (!user) return
      
      try {
        const userId = typeof user.id === 'string' ? parseInt(user.id) : user.id
        const response = await fetch(`/api/favorites?userId=${userId}`)
        if (response.ok) {
          const favs = await response.json()
          setFavorites(favs.map((fav: any) => fav.productId.toString()))
        }
      } catch (error) {
        console.error('Error loading favorites:', error)
      }
    }

    loadFavorites()
  }, [user])

  const toggleFavorite = async (e: React.MouseEvent, id: number) => {
    e.preventDefault() // Prevent navigation
    e.stopPropagation()

    if (!user) {
      router.push(`/auth/login?callback=${encodeURIComponent(pathname)}`)
      return
    }

    try {
      const userId = typeof user.id === 'string' ? parseInt(user.id) : user.id
      const isFavorited = favorites.includes(id.toString())

      if (isFavorited) {
        const response = await fetch(`/api/favorites?userId=${userId}&productId=${id}`, {
          method: 'DELETE',
        })
        if (response.ok) {
          setFavorites((prev) => prev.filter((fav) => fav !== id.toString()))
          updateFavoritesCount()
          toast({
            title: 'Thành công',
            description: 'Đã xóa khỏi danh sách yêu thích'
          })
        }
      } else {
        const response = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, productId: id })
        })
        if (response.ok) {
          setFavorites((prev) => [...prev, id.toString()])
          updateFavoritesCount()
          toast({
            title: 'Thành công',
            description: 'Đã thêm vào danh sách yêu thích'
          })
        }
      }
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể thay đổi danh sách yêu thích',
        variant: 'destructive'
      })
    }
  }

  const fetchProducts = async (query: string) => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/products?search=${encodeURIComponent(query)}&limit=${pagination.limit}&offset=${pagination.offset}`
      )
      const result = await response.json()
      setProducts(result.data || [])
      pagination.setTotal(result.pagination?.total || 0)
    } catch (error) {
      console.error("Failed to fetch products:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      pagination.setPage(1)
      router.push(`/client/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  const clearSearch = () => {
    setSearchQuery("")
    pagination.setPage(1)
    router.push("/client/search")
  }

  return (
    <main className="min-h-screen bg-surface dark:bg-slate-950">
      <div className="container-viewport py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Tìm kiếm sản phẩm</h1>
          <form onSubmit={handleSearch} className="relative">
            <SearchIcon className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Nhập sản phẩm cần tìm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-base pr-10"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </form>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="h-80 animate-pulse">
                <CardContent className="p-0 h-full bg-gray-200 dark:bg-gray-700" />
              </Card>
            ))}
          </div>
        ) : products.length > 0 ? (
          <>
            <p className="text-sm text-muted-foreground mb-6">
              Tìm thấy {pagination.total} sản phẩm cho "{searchParams.get("q")}"
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
              {products.map((product) => (
                <Link key={product.id} href={`/client/product/${product.slug || product.id}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full overflow-hidden">
                    <CardContent className="p-0">
                      <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 overflow-hidden relative group">
                        <img
                          src={product.image || "/placeholder.svg"}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                        {product.salePrice && product.salePrice < product.price && (
                          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                            -{Math.round(((product.price - product.salePrice) / product.price) * 100)}%
                          </div>
                        )}
                        <button
                          onClick={(e) => toggleFavorite(e, product.id)}
                          className="absolute top-2 left-2 p-2 rounded-full bg-white/80 hover:bg-white shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Heart
                            className={`h-4 w-4 ${
                              favorites.includes(product.id.toString())
                                ? "fill-red-500 text-red-500"
                                : "text-gray-600"
                            }`}
                          />
                        </button>
                      </div>
                      <div className="p-3 space-y-2">
                        <h3 className="text-sm font-medium line-clamp-2 h-10">{product.name}</h3>
                        <div className="flex items-baseline gap-2">
                          <span className="text-primary font-bold">
                            {formatPrice(product.salePrice || product.price)}
                          </span>
                          {(product.salePrice || product.originalPrice) && (product.salePrice < (product.originalPrice || product.price)) && (
                            <span className="text-xs text-muted-foreground line-through">
                              {formatPrice(product.originalPrice || product.price)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span>{(product.rating || 0).toFixed(1)}</span>
                          <span className="text-muted-foreground">({product.reviews || 0})</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
            
            <Card className="bg-muted/50 border-0">
              <CardContent className="p-6">
                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  onPageChange={pagination.goToPage}
                  limit={pagination.limit}
                  onLimitChange={pagination.setPageLimit}
                  total={pagination.total}
                />
              </CardContent>
            </Card>
          </>
        ) : searchParams.get("q") ? (
          <Card className="p-12">
            <CardContent className="text-center">
              <SearchIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Không tìm thấy sản phẩm</p>
              <p className="text-muted-foreground mb-6">Hãy thử với từ khóa khác</p>
              <Link href="/">
                <Button>Quay lại trang chủ</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nhập từ khóa để tìm kiếm sản phẩm</p>
          </div>
        )}
      </div>
    </main>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Đang tải...</div>}>
      <SearchContent />
    </Suspense>
  )
}