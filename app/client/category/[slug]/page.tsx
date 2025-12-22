"use client"

import { useState, use, useEffect } from "react"
import { ProductGrid } from "@/components/category/product-grid"
import { CategoryFilters } from "@/components/category/filters"
import { CategoryHeader } from "@/components/category/category-header"

interface CategoryPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<Record<string, string | string[]>>
}

export default function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const [filters, setFilters] = useState({
    priceMin: 0,
    priceMax: 100000000,
    rating: 0,
    condition: "all",
    seller: "all",
    inStock: true,
  })

  const [sortBy, setSortBy] = useState("relevant")
  const resolvedParams = use(params)
  const resolvedSearchParams = use(searchParams)
  const subcategory = resolvedSearchParams?.sub as string | undefined
  const [categoryData, setCategoryData] = useState<any>(null)

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        const response = await fetch(`/api/categories?slug=${resolvedParams.slug}`)
        const result = await response.json()
        if (result.data && result.data.length > 0) {
          setCategoryData(result.data[0])
        }
      } catch (error) {
        console.error("Failed to fetch category", error)
      }
    }
    fetchCategory()
  }, [resolvedParams.slug])

  return (
    <main className="min-h-screen bg-surface dark:bg-slate-950">
      <CategoryHeader slug={resolvedParams.slug} name={categoryData?.name} />

      <div className="container-viewport py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar Filters */}
          <div className="md:col-span-1">
            <CategoryFilters filters={filters} onChange={setFilters} />
          </div>

          {/* Product Grid */}
          <div className="md:col-span-3">
            <ProductGrid 
              category={resolvedParams.slug} 
              categoryId={categoryData?.id}
              subcategory={subcategory} 
              filters={filters} 
              sortBy={sortBy} 
              onSortChange={setSortBy} 
            />
          </div>
        </div>
      </div>
    </main>
  )
}
