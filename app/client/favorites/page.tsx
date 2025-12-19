"use client"

import { useState, useEffect } from "react"
import { Heart, ShoppingCart } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
import { useFavorites } from "@/hooks/useSupabase"
import { useLoading } from "@/hooks/use-loading"
import { useFavoritesContext } from "@/lib/favorites-context"
import { useCart } from "@/lib/cart-context"
import { useToast } from "@/hooks/use-toast"
import { VariantSelectionModal } from "@/components/product/variant-selection-modal"

export default function FavoritesPage() {
  const { user } = useAuth()
  const { setIsLoading } = useLoading()
  const { updateFavoritesCount } = useFavoritesContext()
  const { addToCart } = useCart()
  const { toast } = useToast()
  const [userId, setUserId] = useState<number | null>(null)
  const { data: favoriteProducts, loading, error, fetchFavorites, removeFavorite } = useFavorites(userId)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [variantModalOpen, setVariantModalOpen] = useState(false)

  useEffect(() => {
    if (user?.id) {
      setUserId(typeof user.id === 'string' ? parseInt(user.id) : user.id)
    } else {
      const storedUserId = localStorage.getItem('userId')
      if (storedUserId) {
        setUserId(parseInt(storedUserId))
      }
    }
  }, [user?.id])

  useEffect(() => {
    if (userId) {
      setIsLoading(true)
      fetchFavorites().finally(() => setIsLoading(false))
    }
  }, [userId])

  const handleAddToCart = async (product: any) => {
    if (!user) return

    // Check if product has variants
    if (product.ProductVariant && product.ProductVariant.length > 0) {
      setSelectedProduct({
        ...product,
        variants: product.ProductVariant
      })
      setVariantModalOpen(true)
      return
    }

    try {
      setIsLoading(true)
      const userId = typeof user.id === 'string' ? parseInt(user.id) : user.id
      
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          productId: product.id,
          quantity: 1,
          variantId: null
        })
      })

      if (response.ok) {
        addToCart(1)
        toast({
          title: 'Thành công',
          description: 'Đã thêm sản phẩm vào giỏ hàng'
        })
      } else {
        const errorData = await response.json().catch(() => ({}))
        toast({
          title: 'Lỗi',
          description: errorData.error || 'Không thể thêm vào giỏ hàng',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Đã xảy ra lỗi',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleVariantConfirm = async (variantId: number, quantity: number) => {
    if (!user || !selectedProduct) return

    try {
      setIsLoading(true)
      const userId = typeof user.id === 'string' ? parseInt(user.id) : user.id
      
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          productId: selectedProduct.id,
          quantity,
          variantId: variantId && variantId !== selectedProduct.id ? variantId : null
        })
      })

      if (response.ok) {
        addToCart(quantity)
        toast({
          title: 'Thành công',
          description: 'Đã thêm sản phẩm vào giỏ hàng'
        })
        setVariantModalOpen(false)
      } else {
        const errorData = await response.json().catch(() => ({}))
        toast({
          title: 'Lỗi',
          description: errorData.error || 'Không thể thêm vào giỏ hàng',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Đã xảy ra lỗi',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (loading) {
    return (
      <main className="container-viewport py-8">
        <p className="text-center">Đang tải...</p>
      </main>
    )
  }

  if (error) {
    return (
      <main className="container-viewport py-8">
        <p className="text-center text-red-500">Lỗi: {error}</p>
      </main>
    )
  }

  const items = Array.isArray(favoriteProducts) ? favoriteProducts : []

  return (
    <main className="container-viewport py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Danh sách yêu thích</h1>
        <p className="text-muted-foreground">Bạn có {items.length} sản phẩm yêu thích</p>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <p className="text-lg font-semibold mb-2">Chưa có sản phẩm yêu thích</p>
            <p className="text-muted-foreground mb-6">Hãy khám phá và lưu những sản phẩm bạn yêu thích</p>
            <Button asChild className="bg-orange-600 hover:bg-orange-700">
              <Link href="/">Tiếp tục mua sắm</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {items.map((favorite: any) => {
            const product = favorite.product || favorite.Product
            return (
            <Card key={product.id} className="group hover:shadow-lg transition-shadow">
              <div className="relative overflow-hidden bg-gray-100 h-48">
                <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                <button onClick={async () => {
                  await removeFavorite(product.id)
                  updateFavoritesCount()
                }} className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-md hover:bg-gray-50">
                  <Heart className="h-5 w-5 fill-red-500 text-red-500" />
                </button>
              </div>
              <CardContent className="p-4">
                <Link href={`/client/product/${product.slug}`}>
                  <h3 className="font-semibold text-sm line-clamp-2 hover:text-orange-600 mb-2">{product.name}</h3>
                </Link>
                <p className="text-xs text-muted-foreground mb-3">{product.Vendor?.name || 'Shop'}</p>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-lg font-bold text-orange-600">{product.price?.toLocaleString('vi-VN')}₫</span>
                  <span className="text-xs text-muted-foreground line-through">{product.originalPrice?.toLocaleString('vi-VN')}₫</span>
                </div>
                <div className="flex items-center gap-1 mb-4">
                  <span className="text-yellow-400 text-sm">★</span>
                  <span className="text-sm font-semibold">{product.rating || 0}</span>
                  <span className="text-xs text-muted-foreground">({product.sold || 0})</span>
                </div>
                <Button 
                  size="sm" 
                  className="w-full bg-orange-600 hover:bg-orange-700"
                  onClick={() => handleAddToCart(product)}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Thêm vào giỏ
                </Button>
              </CardContent>
            </Card>
            )
          })}
        </div>
      )}

      {selectedProduct && (
        <VariantSelectionModal
          open={variantModalOpen}
          onOpenChange={setVariantModalOpen}
          product={selectedProduct}
          onConfirm={handleVariantConfirm}
        />
      )}
    </main>
  )
}