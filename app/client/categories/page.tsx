"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

interface SubCategory {
  id: number
  name: string
  slug: string
  categoryId: number
  productsCount: number
}

interface Category {
  id: number
  name: string
  slug: string
  icon: string | null
  subcategoriesCount: number
  productsCount: number
  SubCategory?: SubCategory[]
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedCategory, setExpandedCategory] = useState<number | null>(null)

  useEffect(() => {
    fetchCategoriesWithSubcategories()
  }, [])

  const fetchCategoriesWithSubcategories = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/categories?withSubcategories=true')
      const result = await response.json()

      if (Array.isArray(result)) {
        setCategories(result)
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background py-12">
        <div className="container mx-auto px-4 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-gray-600">Đang tải danh mục...</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4">
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2">Danh mục sản phẩm</h1>
          <p className="text-gray-600">Khám phá các sản phẩm theo danh mục</p>
        </div>

        {categories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Chưa có danh mục nào</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <Card
                key={category.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">{category.name}</CardTitle>
                      <p className="text-sm text-gray-500 mt-1">
                        {category.productsCount} sản phẩm
                      </p>
                    </div>
                    {category.icon && (
                      <img
                        src={category.icon}
                        alt={category.name}
                        className="h-10 w-10 object-contain"
                      />
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {category.SubCategory && category.SubCategory.length > 0 ? (
                    <div className="space-y-2">
                      <button
                        onClick={() =>
                          setExpandedCategory(
                            expandedCategory === category.id ? null : category.id
                          )
                        }
                        className="w-full text-left py-2 px-3 bg-gray-100 hover:bg-gray-200 rounded transition font-medium text-sm"
                      >
                        {expandedCategory === category.id ? '▼' : '▶'} Danh mục con
                        ({category.SubCategory.length})
                      </button>

                      {expandedCategory === category.id && (
                        <div className="space-y-1 pl-2 max-h-64 overflow-y-auto">
                          {category.SubCategory.map((subcat) => (
                            <Link
                              key={subcat.id}
                              href={`/products?subcategory=${subcat.slug}`}
                              className="block py-2 px-3 text-sm hover:bg-blue-50 rounded transition text-blue-600 hover:text-blue-700"
                            >
                              {subcat.name}
                              <span className="text-gray-400 ml-2">({subcat.productsCount})</span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">
                      Không có danh mục con
                    </p>
                  )}

                  <Link
                    href={`/products?category=${category.slug}`}
                    className="block w-full mt-4 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium text-center transition"
                  >
                    Xem tất cả
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
