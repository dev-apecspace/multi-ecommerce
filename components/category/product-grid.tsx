"use client"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { Star, Heart, HeartPulse as HeartFilled } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useEffect } from "react"
import { generateSlug } from "@/lib/utils"
import { VariantSelectionModal } from "@/components/product/variant-selection-modal"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import { useLoading } from "@/hooks/use-loading"
import { useFavoritesContext } from "@/lib/favorites-context"
import { computePrice, isCampaignActive } from "@/lib/price-utils"

import { usePagination } from "@/hooks/use-pagination"
import { Pagination } from "@/components/pagination"

interface ProductGridProps {
  category?: string
  subcategory?: string
  filters?: any
  sortBy?: string
  onSortChange?: (sort: string) => void
}

export function ProductGrid({ category = "all", subcategory, filters, sortBy = "relevant", onSortChange }: ProductGridProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useAuth()
  const { toast } = useToast()
  const { setIsLoading } = useLoading()
  const { updateFavoritesCount } = useFavoritesContext()
  const [favorites, setFavorites] = useState<string[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [variantModalOpen, setVariantModalOpen] = useState(false)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  
  const pagination = usePagination({ initialPage: 1, initialLimit: 20 })

  // Reset pagination when filters change
  useEffect(() => {
    pagination.setPage(1)
  }, [category, subcategory, filters, sortBy])

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true)
        if (!category || category === "all") {
          setProducts([])
          setLoading(false)
          return
        }

        const categoriesResponse = await fetch('/api/categories?withSubcategories=true')
        const allCategories = await categoriesResponse.json()
        const categoryObj = allCategories.find((c: any) => c.slug === category)

        let url = `/api/products?limit=${pagination.limit}&offset=${pagination.offset}`
        
        if (categoryObj?.id) {
          url += `&categoryId=${categoryObj.id}`
        }

        if (subcategory) {
          url += `&subcategory=${subcategory}`
        }

        if (filters) {
          if (filters.priceMin) url += `&minPrice=${filters.priceMin}`
          if (filters.priceMax && filters.priceMax < 100000000) url += `&maxPrice=${filters.priceMax}`
          if (filters.rating) url += `&rating=${filters.rating}`
          if (filters.inStock) url += `&inStock=true`
        }

        if (sortBy) {
          url += `&sortBy=${sortBy}`
        }

        const response = await fetch(url)
        const result = await response.json()
        setProducts(result.data || [])
        pagination.setTotal(result.pagination?.total || 0)
      } catch (error) {
        console.error('Failed to fetch products:', error)
      } finally {
        setLoading(false)
        setIsLoading(false)
      }
    }

    fetchProducts()
  }, [category, subcategory, filters, sortBy, pagination.page, pagination.limit])

  const toggleFavorite = async (id: number) => {
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
          toast({
            title: 'Thành công',
            description: 'Đã xóa khỏi danh sách yêu thích'
          })
          updateFavoritesCount()
        }
      } else {
        const response = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, productId: id })
        })
        if (response.ok) {
          setFavorites((prev) => [...prev, id.toString()])
          toast({
            title: 'Thành công',
            description: 'Đã thêm vào danh sách yêu thích'
          })
          updateFavoritesCount()
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

  const handleAddToCartClick = (e: React.MouseEvent, product: any) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!user) {
      router.push(`/auth/login?callback=${encodeURIComponent(pathname)}`)
      return
    }
    
    openVariantModal(product)
  }

  const openVariantModal = (product: any) => {
    setSelectedProduct(product)
    setVariantModalOpen(true)
  }

  const handleVariantConfirm = async (variantId: number, quantity: number) => {
    if (!user) {
      router.push(`/auth/login?callback=${encodeURIComponent(pathname)}`)
      return
    }

    try {
      setIsLoading(true)
      setIsAddingToCart(true)
      const userId = user.id

      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: typeof userId === 'string' ? parseInt(userId) : userId,
          productId: selectedProduct.id,
          quantity: quantity,
          variantId: variantId
        })
      })

      if (response.ok) {
        toast({
          title: 'Thành công',
          description: 'Đã thêm sản phẩm vào giỏ hàng'
        })
      } else {
        toast({
          title: 'Lỗi',
          description: 'Không thể thêm vào giỏ hàng',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Đã xảy ra lỗi khi thêm vào giỏ hàng',
        variant: 'destructive'
      })
    } finally {
      setIsAddingToCart(false)
      setIsLoading(false)
    }
  }

  if (loading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
          <p className="text-sm text-muted-foreground">Đang tải...</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <Card key={i} className="animate-pulse h-80">
              <CardContent className="p-3 h-full bg-gray-200 dark:bg-gray-700" />
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Sort Bar */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
        <p className="text-sm text-muted-foreground">Hiển thị {products.length} sản phẩm</p>
        <Select value={sortBy} onValueChange={(val) => onSortChange?.(val)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Sắp xếp" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="relevant">Liên quan</SelectItem>
            <SelectItem value="newest">Mới nhất</SelectItem>
            <SelectItem value="price-low">Giá: Thấp đến cao</SelectItem>
            <SelectItem value="price-high">Giá: Cao đến thấp</SelectItem>
            <SelectItem value="most-sold">Bán chạy nhất</SelectItem>
            <SelectItem value="rating">Đánh giá cao</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        {products.map((product) => {
          const vendorName = product.Vendor?.name || "Shop"
          
          let basePrice = product.price
          let originalPrice = product.originalPrice || product.price
          let promotionActive = isCampaignActive(product.appliedCampaign)
          let salePrice = (promotionActive && product.salePrice) ? product.salePrice : null
          const hasVariants = product.ProductVariant && product.ProductVariant.length > 0
          
          if (hasVariants) {
            const firstVariant = product.ProductVariant[0]
            basePrice = firstVariant.price ?? product.price
            originalPrice = firstVariant.originalPrice ?? product.originalPrice ?? basePrice
            const variantPromotionActive = isCampaignActive(firstVariant.appliedCampaign)
            salePrice = (variantPromotionActive && firstVariant.salePrice) ? firstVariant.salePrice : null
          }
          
          const priceData = computePrice({
            basePrice,
            originalPrice,
            salePrice,
            taxApplied: product.taxApplied || false,
            taxRate: product.taxRate || 0,
            taxIncluded: product.taxIncluded !== false,
          })
          
          const displayPrice = priceData.displayPrice
          const discount = priceData.discountPercent
          
          const mainImage = (product.media?.[0]?.url) 
            || product.image 
            || "/placeholder.svg"

          const productUrl = `/client/product/${product.slug || generateSlug(product.name)}`

          return (
            <Card key={product.id} className="hover:shadow-lg transition-shadow h-full flex flex-col">
              <CardContent className="p-3 space-y-2 flex-1 flex flex-col">
                <div className="relative h-40 md:h-48 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden group flex-shrink-0">
                  <Link href={productUrl} className="block w-full h-full">
                    <img
                      src={mainImage}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    {discount > 0 && (
                      <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                        -{discount}%
                      </div>
                    )}
                  </Link>
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      toggleFavorite(product.id)
                    }}
                    className="absolute top-2 right-2 p-2 rounded-full bg-white/80 hover:bg-white transition-colors z-10"
                  >
                    {favorites.includes(product.id.toString()) ? (
                      <HeartFilled className="h-5 w-5 text-red-500" />
                    ) : (
                      <Heart className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>

                <div className="space-y-1 flex-1 flex flex-col">
                  <Link href={productUrl} className="block">
                    <p className="text-xs md:text-sm font-medium line-clamp-2 h-8 hover:text-primary transition-colors">{product.name}</p>
                  </Link>

                  <Link href={productUrl} className="block">
                    <p className="text-xs text-muted-foreground truncate">{vendorName}</p>

                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs font-medium">{product.rating.toFixed(1)}</span>
                      <span className="text-xs text-muted-foreground">({product.reviews})</span>
                    </div>

                    <p className="text-xs text-muted-foreground">Đã bán {(product.sold / 1000).toFixed(1)}k</p>

                    <div className="space-y-1 mt-1">
                      <div className="flex items-baseline gap-1">
                        {hasVariants && (
                          <p className="text-xs text-muted-foreground">Từ</p>
                        )}
                        <p className="font-bold text-sm md:text-base text-primary">
                          {displayPrice.toLocaleString("vi-VN")}₫
                        </p>
                      </div>
                      {priceData.displayOriginalPrice > displayPrice && (
                        <p className="text-xs text-muted-foreground line-through">
                          {priceData.displayOriginalPrice.toLocaleString("vi-VN")}₫
                        </p>
                      )}
                      {product.taxApplied && product.taxRate && !product.taxIncluded && (
                        <p className="text-xs text-amber-600 dark:text-amber-400">
                          (chưa bao gồm thuế {product.taxRate}%)
                        </p>
                      )}
                    </div>
                  </Link>

                  <div className="mt-auto pt-2">
                    <Button
                      size="sm"
                      className="w-full h-7 text-xs"
                      onClick={(e) => handleAddToCartClick(e, product)}
                    >
                      Thêm vào giỏ
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* No Results */}
      {products.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Không tìm thấy sản phẩm nào</p>
          <Button variant="outline">Xóa bộ lọc</Button>
        </div>
      )}

      {/* Pagination */}
      {products.length > 0 && (
        <div className="mt-8">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={pagination.goToPage}
            limit={pagination.limit}
            onLimitChange={pagination.setPageLimit}
            total={pagination.total}
          />
        </div>
      )}

      {/* Variant Selection Modal */}
      {selectedProduct && (
        <VariantSelectionModal
          open={variantModalOpen}
          onOpenChange={setVariantModalOpen}
          productId={selectedProduct.id}
          productName={selectedProduct.name}
          productImage={selectedProduct.image || "/placeholder.svg"}
          price={selectedProduct.price}
          originalPrice={selectedProduct.originalPrice}
          variants={selectedProduct.ProductVariant || []}
          onConfirm={handleVariantConfirm}
          isLoading={isAddingToCart}
        />
      )}
    </div>
  )
}
