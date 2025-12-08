"use client"

import { useState } from "react"
import Link from "next/link"
import { SearchIcon, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { products } from "@/lib/mockdata"
import { formatPrice } from "@/lib/utils"

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [results, setResults] = useState(products.slice(0, 12))

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (query.trim()) {
      const filtered = products.filter(
        (p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.description.toLowerCase().includes(query.toLowerCase()),
      )
      setResults(filtered.slice(0, 50))
    } else {
      setResults(products.slice(0, 12))
    }
  }

  return (
    <main className="min-h-screen bg-surface dark:bg-slate-950">
      <div className="container-viewport py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Tìm kiếm sản phẩm</h1>
          <div className="relative">
            <SearchIcon className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Nhập sản phẩm cần tìm..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 h-12 text-base"
            />
            {searchQuery && (
              <button
                onClick={() => handleSearch("")}
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {results.length > 0 ? (
          <>
            <p className="text-sm text-muted-foreground mb-6">
              Tìm thấy {results.length} sản phẩm cho "{searchQuery || "tất cả"}"
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {results.map((product) => (
                <Link key={product.id} href={`/client/product/${product.id}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <CardContent className="p-3 space-y-2">
                      <div className="w-full h-32 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                        <img
                          src={product.image || "/placeholder.svg"}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <h3 className="text-sm font-medium line-clamp-2">{product.name}</h3>
                      <div className="flex items-baseline gap-2">
                        <span className="text-primary font-bold">{formatPrice(product.price)}</span>
                        <span className="text-xs text-muted-foreground line-through">
                          {formatPrice(product.originalPrice)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        <span className="text-yellow-500">★</span>
                        <span>{product.rating.toFixed(1)}</span>
                        <span className="text-muted-foreground">({product.reviews})</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </>
        ) : (
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
        )}
      </div>
    </main>
  )
}
