"use client"

import { useState } from "react"
import { ProductGrid } from "@/components/category/product-grid"
import { CategoryFilters } from "@/components/category/filters"
import { CategoryHeader } from "@/components/category/category-header"

export default function AllProductsPage() {
  const [filters, setFilters] = useState({
    priceMin: 0,
    priceMax: 100000000,
    rating: 0,
    condition: "all",
    seller: "all",
    inStock: true,
  })

  const [sortBy, setSortBy] = useState("relevant")

  return (
    <main className="min-h-screen bg-surface dark:bg-slate-950">
      <CategoryHeader slug="all" name="Tất cả sản phẩm" />

      <div className="container-viewport py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar Filters */}
          <div className="md:col-span-1">
            <CategoryFilters filters={filters} onChange={setFilters} />
          </div>

          {/* Product Grid */}
          <div className="md:col-span-3">
            <ProductGrid 
              category="all" 
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
