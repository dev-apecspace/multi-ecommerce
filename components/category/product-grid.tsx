"use client"
import Link from "next/link"
import { Star, Heart, HeartPulse as HeartFilled } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useEffect } from "react"
import { generateSlug } from "@/lib/utils"
import { VariantSelectionModal } from "@/components/product/variant-selection-modal"
import { useToast } from "@/hooks/use-toast"

interface ProductGridProps {
  category?: string
  subcategory?: string
  filters?: any
  sortBy?: string
  onSortChange?: (sort: string) => void
}

export function ProductGrid({ category = "all", subcategory, filters, sortBy = "relevant", onSortChange }: ProductGridProps) {
  const { toast } = useToast()
  const [favorites, setFavorites] = useState<string[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [variantModalOpen, setVariantModalOpen] = useState(false)
  const [isAddingToCart, setIsAddingToCart] = useState(false)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        if (!category || category === "all") {
          setProducts([])
          setLoading(false)
          return
        }

        const categoriesResponse = await fetch('/api/categories?withSubcategories=true')
        const allCategories = await categoriesResponse.json()
        const categoryObj = allCategories.find((c: any) => c.slug === category)

        let url = '/api/products?limit=50'
        
        if (categoryObj?.id) {
          url += `&categoryId=${categoryObj.id}`
        }

        const response = await fetch(url)
        const result = await response.json()
        setProducts(result.data || [])
      } catch (error) {
        console.error('Failed to fetch products:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [category])

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((fav) => fav !== id) : [...prev, id]))
  }

  const handleAddToCartClick = (e: React.MouseEvent, product: any) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!product.ProductVariant || product.ProductVariant.length === 0) {
      openVariantModal(product)
    } else {
      openVariantModal(product)
    }
  }

  const openVariantModal = (product: any) => {
    setSelectedProduct(product)
    setVariantModalOpen(true)
  }

  const handleVariantConfirm = async (variantId: number, quantity: number) => {
    try {
      setIsAddingToCart(true)
      const userId = localStorage.getItem('userId')
      
      if (!userId) {
        toast({
          title: 'Lỗi',
          description: 'Vui lòng đăng nhập để thêm vào giỏ hàng',
          variant: 'destructive'
        })
        return
      }

      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: parseInt(userId),
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
    }
  }

  let displayProducts = products

  if (subcategory) {
    displayProducts = displayProducts.filter((p) => p.SubCategory?.slug === subcategory)
  }
  
  displayProducts = displayProducts.slice(0, 50)

  if (filters) {
    displayProducts = displayProducts.filter((p) => {
      if (p.price < filters.priceMin || p.price > filters.priceMax) return false
      if (filters.rating > 0 && p.rating < filters.rating) return false
      if (!filters.inStock && p.stock <= 0) return false
      return true
    })
  }

  // Sort products
  if (sortBy && sortBy !== "relevant") {
    displayProducts = [...displayProducts].sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return a.price - b.price
        case "price-high":
          return b.price - a.price
        case "newest":
          return b.id.localeCompare(a.id)
        case "most-sold":
          return b.sold - a.sold
        case "rating":
          return b.rating - a.rating
        default:
          return 0
      }
    })
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
        <p className="text-sm text-muted-foreground">Hiển thị {displayProducts.length} sản phẩm</p>
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
        {displayProducts.map((product) => {
          const vendorName = product.Vendor?.name || "Shop"
          const discount = product.originalPrice 
            ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
            : 0
          
          const mainImage = (product.media?.[0]?.url) 
            || product.image 
            || "/placeholder.svg"

          return (
            <Link key={product.id} href={`/client/product/${product.slug || generateSlug(product.name)}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardContent className="p-3 space-y-2">
                  <div className="relative h-40 md:h-48 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden group">
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
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        toggleFavorite(product.id)
                      }}
                      className="absolute top-2 right-2 p-2 rounded-full bg-white/80 hover:bg-white transition-colors"
                    >
                      {favorites.includes(product.id) ? (
                        <HeartFilled className="h-5 w-5 text-red-500" />
                      ) : (
                        <Heart className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs md:text-sm font-medium line-clamp-2 h-8">{product.name}</p>

                    <p className="text-xs text-muted-foreground truncate">{vendorName}</p>

                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs font-medium">{product.rating.toFixed(1)}</span>
                      <span className="text-xs text-muted-foreground">({product.reviews})</span>
                    </div>

                    <p className="text-xs text-muted-foreground">Đã bán {(product.sold / 1000).toFixed(1)}k</p>

                    <div className="space-y-1">
                      <p className="font-bold text-sm md:text-base text-primary">
                        {product.price.toLocaleString("vi-VN")}₫
                      </p>
                      <p className="text-xs text-muted-foreground line-through">
                        {product.originalPrice.toLocaleString("vi-VN")}₫
                      </p>
                    </div>

                    <Button
                      size="sm"
                      className="w-full h-7 text-xs mt-2"
                      onClick={(e) => handleAddToCartClick(e, product)}
                    >
                      Thêm vào giỏ
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* No Results */}
      {displayProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Không tìm thấy sản phẩm nào</p>
          <Button variant="outline">Xóa bộ lọc</Button>
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
