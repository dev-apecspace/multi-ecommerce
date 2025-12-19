"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { Star, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { formatPrice, generateSlug } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { useFavoritesContext } from "@/lib/favorites-context"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

export function RecommendedProducts() {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useAuth()
  const { toast } = useToast()
  const { updateFavoritesCount } = useFavoritesContext()
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [favorites, setFavorites] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const limit = 12

  const handleAddToCart = (e: React.MouseEvent, product: any) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!user) {
      router.push(`/auth/login?callback=${encodeURIComponent(pathname)}`)
      return
    }
    
    router.push(`/client/product/${product.slug || generateSlug(product.name)}`)
  }

  const toggleFavorite = async (e: React.MouseEvent, id: number) => {
    e.preventDefault()
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

  const fetchProducts = async (page: number) => {
    setLoading(true)
    try {
      const offset = (page - 1) * limit
      const response = await fetch(`/api/products?limit=${limit}&offset=${offset}`)
      const result = await response.json()
      setProducts(result.data || [])
      const total = result.pagination?.total || 0
      setTotalPages(Math.ceil(total / limit))
    } catch (error) {
      console.error('Failed to fetch products:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts(currentPage)
  }, [currentPage])

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

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return
    setCurrentPage(page)
    // Scroll to top of section
    const element = document.getElementById('recommended-products')
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const renderPaginationItems = () => {
    const items = []
    const maxVisiblePages = 5

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              href="#"
              isActive={currentPage === i}
              onClick={(e) => {
                e.preventDefault()
                handlePageChange(i)
              }}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        )
      }
    } else {
      // Always show first page
      items.push(
        <PaginationItem key={1}>
          <PaginationLink
            href="#"
            isActive={currentPage === 1}
            onClick={(e) => {
              e.preventDefault()
              handlePageChange(1)
            }}
          >
            1
          </PaginationLink>
        </PaginationItem>
      )

      if (currentPage > 3) {
        items.push(
          <PaginationItem key="ellipsis-start">
            <PaginationEllipsis />
          </PaginationItem>
        )
      }

      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)

      for (let i = start; i <= end; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              href="#"
              isActive={currentPage === i}
              onClick={(e) => {
                e.preventDefault()
                handlePageChange(i)
              }}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        )
      }

      if (currentPage < totalPages - 2) {
        items.push(
          <PaginationItem key="ellipsis-end">
            <PaginationEllipsis />
          </PaginationItem>
        )
      }

      // Always show last page
      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink
            href="#"
            isActive={currentPage === totalPages}
            onClick={(e) => {
              e.preventDefault()
              handlePageChange(totalPages)
            }}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      )
    }

    return items
  }

  if (loading && products.length === 0) {
    return (
      <div id="recommended-products">
        <div className="flex items-center gap-2 mb-6">
          <h2 className="text-2xl font-bold">🔥 Gợi ý hôm nay</h2>
          <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800"></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: limit }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm">
              <div className="aspect-square bg-gray-200 dark:bg-gray-800 animate-pulse" />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-2/3 animate-pulse" />
                <div className="flex justify-between pt-2">
                  <div className="h-5 w-20 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                  <div className="h-5 w-10 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div id="recommended-products">
      <div className="flex items-center gap-2 mb-6">
        <h2 className="text-2xl font-bold">🔥 Gợi ý hôm nay</h2>
        <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800"></div>
        <Link href="/client/products" className="text-sm font-medium text-primary hover:underline">
          Xem tất cả
        </Link>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
        {products.map((product) => (
          <Link 
            key={product.id} 
            href={`/client/product/${product.slug || generateSlug(product.name)}`}
            className="group block h-full"
          >
            <div className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full flex flex-col relative">
              {/* Image Container */}
              <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-800">
                <Image 
                  src={product.media?.[0]?.url || product.image || "/placeholder.svg"} 
                  alt={product.name} 
                  fill 
                  className="object-cover group-hover:scale-110 transition-transform duration-500" 
                />
                
                {/* Discount Badge - Placeholder logic */}
                {product.originalPrice > product.price && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
                    -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                  </div>
                )}

                {/* Hover Actions */}
                <div className="absolute inset-x-0 bottom-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex gap-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-t border-gray-100 dark:border-gray-800 z-10">
                  <Button 
                    size="sm" 
                    className="flex-1 h-8 text-xs font-medium shadow-sm"
                    onClick={(e) => handleAddToCart(e, product)}
                  >
                    Thêm vào giỏ
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-8 w-8 p-0 rounded-full shadow-sm hover:text-red-500 hover:border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20"
                    onClick={(e) => toggleFavorite(e, product.id)}
                  >
                    <Heart className={`h-4 w-4 ${favorites.includes(product.id.toString()) ? "fill-red-500 text-red-500" : ""}`} />
                  </Button>
                </div>
              </div>

              {/* Content */}
              <div className="p-3 flex flex-col flex-1">
                <h3 className="text-sm font-medium line-clamp-2 mb-1 group-hover:text-primary transition-colors h-10" title={product.name}>
                  {product.name}
                </h3>

                <div className="mt-auto space-y-1">
                  {/* Rating & Sold */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span>{product.rating || "4.5"}</span>
                    </div>
                    <span>Đã bán {(product.sold / 1000).toFixed(1)}k</span>
                  </div>

                  {/* Price */}
                  <div className="pt-1">
                    {(() => {
                      const taxAmount = (product.taxApplied && product.taxRate && !product.taxIncluded)
                        ? Math.round(product.price * (product.taxRate / 100))
                        : 0
                      const finalPrice = product.price + taxAmount
                      return (
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="font-bold text-base text-primary">
                            {finalPrice.toLocaleString("vi-VN")}₫
                          </span>
                          {product.originalPrice > finalPrice && (
                            <span className="text-xs text-muted-foreground line-through">
                              {product.originalPrice.toLocaleString("vi-VN")}₫
                            </span>
                          )}
                        </div>
                      )
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                href="#" 
                onClick={(e) => {
                  e.preventDefault()
                  handlePageChange(currentPage - 1)
                }}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
            
            {renderPaginationItems()}

            <PaginationItem>
              <PaginationNext 
                href="#" 
                onClick={(e) => {
                  e.preventDefault()
                  handlePageChange(currentPage + 1)
                }}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}
