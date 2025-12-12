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

export function RecommendedProducts() {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useAuth()
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const handleAddToCart = (e: React.MouseEvent, product: any) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!user) {
      router.push(`/auth/login?callback=${encodeURIComponent(pathname)}`)
      return
    }
    
    router.push(`/client/product/${product.slug || generateSlug(product.name)}`)
  }

  const handleAddToFavorite = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!user) {
      router.push(`/auth/login?callback=${encodeURIComponent(pathname)}`)
      return
    }
  }

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products?limit=8')
        const result = await response.json()
        setProducts(result.data || [])
      } catch (error) {
        console.error('Failed to fetch products:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  if (loading) {
    return (
      <div>
        <h2 className="text-xl font-bold mb-4">Sản phẩm được đề xuất</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="h-full animate-pulse">
              <CardContent className="p-3 space-y-2">
                <div className="relative h-40 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Sản phẩm được đề xuất</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {products.map((product) => (
          <Link key={product.id} href={`/client/product/${product.slug || generateSlug(product.name)}`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardContent className="p-3 space-y-2">
                <div className="relative h-40 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                  <Image src={product.media?.[0]?.url || product.image || "/placeholder.svg"} alt={product.name} fill className="object-cover" />
                </div>

                <div className="space-y-1">
                  <p className="text-xs md:text-sm font-medium line-clamp-2 h-8">{product.name}</p>

                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs font-medium">{product.rating}</span>
                    <span className="text-xs text-muted-foreground">({product.reviews})</span>
                  </div>

                  <p className="text-xs text-muted-foreground">Đã bán {(product.sold / 1000).toFixed(1)}k</p>

                  {(() => {
                    const taxAmount = (product.taxApplied && product.taxRate && !product.taxIncluded)
                      ? Math.round(product.price * (product.taxRate / 100))
                      : 0
                    const finalPrice = product.price + taxAmount
                    return (
                      <>
                        <p className="font-bold text-sm md:text-base text-primary">
                          {finalPrice.toLocaleString("vi-VN")}₫
                        </p>
                        {product.taxApplied && product.taxRate && !product.taxIncluded && (
                          <p className="text-xs text-amber-600 dark:text-amber-400">
                            (chưa bao gồm thuế {product.taxRate}%)
                          </p>
                        )}
                      </>
                    )
                  })()}

                  <div className="flex gap-2 pt-1">
                    <Button 
                      size="sm" 
                      className="flex-1 h-7 text-xs"
                      onClick={(e) => handleAddToCart(e, product)}
                    >
                      Thêm
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="w-7 h-7 p-0 bg-transparent"
                      onClick={handleAddToFavorite}
                    >
                      <Heart className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
