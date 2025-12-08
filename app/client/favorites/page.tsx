"use client"

import { useState, useEffect } from "react"
import { Heart, ShoppingCart } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useFavorites } from "@/hooks/useSupabase"

export default function FavoritesPage() {
  const [userId, setUserId] = useState<number | null>(1)
  const { data: favoriteProducts, loading, error, fetchFavorites, removeFavorite } = useFavorites(userId)

  useEffect(() => {
    if (userId) {
      fetchFavorites()
    }
  }, [userId])

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
          {items.map((product: any) => (
            <Card key={product.id} className="group hover:shadow-lg transition-shadow">
              <div className="relative overflow-hidden bg-gray-100 h-48">
                <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                <button onClick={() => removeFavorite(product.id)} className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-md hover:bg-gray-50">
                  <Heart className="h-5 w-5 fill-red-500 text-red-500" />
                </button>
              </div>
              <CardContent className="p-4">
                <Link href={`/client/product/${product.id}`}>
                  <h3 className="font-semibold text-sm line-clamp-2 hover:text-orange-600 mb-2">{product.name}</h3>
                </Link>
                <p className="text-xs text-muted-foreground mb-3">{product.vendor}</p>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-lg font-bold text-orange-600">{product.price?.toLocaleString()}đ</span>
                  <span className="text-xs text-muted-foreground line-through">{product.originalPrice?.toLocaleString()}đ</span>
                </div>
                <div className="flex items-center gap-1 mb-4">
                  <span className="text-yellow-400 text-sm">★</span>
                  <span className="text-sm font-semibold">{product.rating}</span>
                  <span className="text-xs text-muted-foreground">({product.reviews})</span>
                </div>
                <Button size="sm" className="w-full bg-orange-600 hover:bg-orange-700">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Thêm vào giỏ
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  )
}