"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Flame } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { generateSlug } from "@/lib/utils"

export function FlashSaleCarousel() {
  const [scrollPosition, setScrollPosition] = useState(0)
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products?limit=5')
        const result = await response.json()
        const productsWithDiscount = (result.data || []).map((product: any) => ({
          ...product,
          discount: product.originalPrice 
            ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
            : 0
        }))
        setProducts(productsWithDiscount)
      } catch (error) {
        console.error('Failed to fetch products:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  const scroll = (direction: "left" | "right") => {
    const container = document.getElementById("flash-scroll-container")
    if (container) {
      const scrollAmount = 300
      container.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      })
      setScrollPosition(container.scrollLeft)
    }
  }

  if (loading) {
    return (
      <div className="container-viewport my-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-primary to-primary-dark">
              <Flame className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Flash Sale</h2>
              <p className="text-xs text-muted-foreground">Giảm giá khủng 15 phút/lần</p>
            </div>
          </div>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-44">
              <Card className="h-full animate-pulse">
                <CardContent className="p-0">
                  <div className="h-44 bg-gray-200 dark:bg-gray-700" />
                  <div className="p-3 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container-viewport my-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-primary to-primary-dark">
            <Flame className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Flash Sale</h2>
            <p className="text-xs text-muted-foreground">Giảm giá khủng 15 phút/lần</p>
          </div>
        </div>
      </div>

      <div className="relative">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        <div
          id="flash-scroll-container"
          className="flex gap-4 overflow-x-auto scroll-smooth pb-2 [&::-webkit-scrollbar]:hidden"
          onScroll={(e) => setScrollPosition(e.currentTarget.scrollLeft)}
        >
          {products.map((product) => (
            <div key={product.id} className="flex-shrink-0 w-44">
              <Link href={`/client/product/${product.slug || generateSlug(product.name)}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full overflow-hidden">
                  <CardContent className="p-0 relative">
                    <div className="relative h-44 bg-gray-200 dark:bg-gray-700">
                      <Image
                        src={product.image || "/placeholder.svg"}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                      {product.discount > 0 && (
                        <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                          -{product.discount}%
                        </div>
                      )}
                    </div>
                    <div className="p-3 space-y-2">
                      <p className="text-sm font-medium line-clamp-2">{product.name}</p>
                      <div className="space-y-1">
                        <p className="text-lg font-bold text-primary">{product.price.toLocaleString("vi-VN")}₫</p>
                        {product.originalPrice && (
                          <p className="text-xs text-muted-foreground line-through">
                            {product.originalPrice.toLocaleString("vi-VN")}₫
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          ))}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
