"use client"

import { categories } from "@/lib/mockdata"

interface CategoryHeaderProps {
  slug: string
}

export function CategoryHeader({ slug }: CategoryHeaderProps) {
  const category = categories.find((c) => c.slug === slug)
  const name = category?.name || slug

  return (
    <div className="bg-white dark:bg-slate-900 border-b border-border">
      <div className="container-viewport py-6">
        <h1 className="text-3xl font-bold mb-2">{name}</h1>
        <p className="text-muted-foreground">Khám phá hàng triệu sản phẩm trong danh mục {name.toLowerCase()}</p>
      </div>
    </div>
  )
}
