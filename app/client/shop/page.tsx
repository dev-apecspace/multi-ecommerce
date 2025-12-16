"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Star, Shield, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { generateSlug } from "@/lib/utils"
import { usePagination } from "@/hooks/use-pagination"
import { Pagination } from "@/components/pagination"

export default function ShopsPage() {
  const [favorites, setFavorites] = useState<number[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("followers")
  const [shops, setShops] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const pagination = usePagination({ initialPage: 1, initialLimit: 12 })

  const [debouncedSearch, setDebouncedSearch] = useState("")

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      pagination.setPage(1)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    const fetchShops = async () => {
      try {
        setLoading(true)
        const response = await fetch(
          `/api/vendors?status=approved&limit=${pagination.limit}&offset=${pagination.offset}&search=${debouncedSearch}&sortBy=${sortBy}`
        )
        const result = await response.json()
        setShops(result.data || [])
        pagination.setTotal(result.pagination?.total || 0)
      } catch (error) {
        console.error('Failed to fetch shops:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchShops()
  }, [pagination.page, pagination.limit, debouncedSearch, sortBy])

  const toggleFavorite = (shopId: number) => {
    setFavorites((prev) => (prev.includes(shopId) ? prev.filter((id) => id !== shopId) : [...prev, shopId]))
  }

  const handleSortChange = (value: string) => {
    setSortBy(value)
    pagination.setPage(1)
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-surface dark:bg-slate-950">
        <div className="container-viewport py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Danh sách cửa hàng</h1>
            <p className="text-muted-foreground">Khám phá các cửa hàng đáng tin cậy trên sàn</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="h-64 animate-pulse">
                <CardContent className="p-0 h-full bg-gray-200 dark:bg-gray-700" />
              </Card>
            ))}
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-surface dark:bg-slate-950">
      <div className="container-viewport py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Danh sách cửa hàng</h1>
          <p className="text-muted-foreground">Khám phá các cửa hàng đáng tin cậy trên sàn</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Input
            placeholder="Tìm kiếm cửa hàng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="md:col-span-2"
          />
          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger>
              <SelectValue placeholder="Sắp xếp theo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="followers">Nhiều người theo dõi</SelectItem>
              <SelectItem value="rating">Đánh giá cao nhất</SelectItem>
              <SelectItem value="newest">Mới nhất</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {shops.map((shop) => (
            <Link key={shop.id} href={`/client/shop/${shop.id}`}>
              <Card className="hover:shadow-lg transition-shadow overflow-hidden h-full">
                <CardContent className="p-0">
                  <div className="relative h-32 bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    <Image src={shop.image || "/placeholder.svg"} alt={shop.name} fill className="object-cover" />
                    <div className="absolute top-2 right-2">
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          toggleFavorite(shop.id)
                        }}
                        className="p-2 bg-white dark:bg-slate-900 rounded-full shadow hover:shadow-md transition-shadow"
                      >
                        {favorites.includes(shop.id) ? (
                          <Heart className="h-5 w-5 text-red-500 fill-red-500" />
                        ) : (
                          <Heart className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-sm line-clamp-1">{shop.name}</h3>
                        <Shield className="h-4 w-4 text-green-500 flex-shrink-0" />
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">Cửa hàng đã được xác thực</p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-center">
                        <p className="text-muted-foreground">Đánh giá</p>
                        <p className="font-bold flex items-center justify-center gap-0.5">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          {shop.rating}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-muted-foreground">Sản phẩm</p>
                        <p className="font-bold">{(shop.products / 1000).toFixed(1)}K</p>
                      </div>
                      <div className="text-center">
                        <p className="text-muted-foreground">Theo dõi</p>
                        <p className="font-bold">{(shop.followers / 1000).toFixed(0)}K</p>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-border">
                      <Button size="sm" variant="outline" className="flex-1">
                        Theo dõi
                      </Button>
                      <Button size="sm" className="flex-1">
                        Ghé shop
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {shops.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Không tìm thấy cửa hàng nào</p>
          </div>
        )}

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
      </div>
    </main>
  )
}
