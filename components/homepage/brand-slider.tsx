"use client"

import Image from "next/image"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { generateSlug } from "@/lib/utils"

const brands = [
  { id: 1, name: "Samsung", image: "/samsung-logo.png" },
  { id: 2, name: "Apple", image: "/apple-logo-minimalist.png" },
  { id: 3, name: "Sony", image: "/sony-logo.png" },
  { id: 4, name: "LG", image: "/lg-logo-abstract.png" },
  { id: 5, name: "Nike", image: "/nike-swoosh.png" },
  { id: 6, name: "Adidas", image: "/adidas-logo.png" },
  { id: 7, name: "Canon", image: "/canon-logo.png" },
  { id: 8, name: "Dell", image: "/dell-logo.png" },
]

export function BrandSlider() {
  const scroll = (direction: "left" | "right") => {
    const container = document.getElementById("brands-scroll")
    if (container) {
      container.scrollBy({
        left: direction === "left" ? -200 : 200,
        behavior: "smooth",
      })
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <h2 className="text-2xl font-bold">💎 Thương hiệu nổi bật</h2>
        <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800"></div>
        <Link href="/client/brands" className="text-sm font-medium text-primary hover:underline">
          Xem tất cả
        </Link>
      </div>
      <div className="relative group">
        <Button
          variant="outline"
          size="icon"
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity rounded-full shadow-md bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-800 h-10 w-10"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        <div id="brands-scroll" className="flex gap-4 overflow-x-auto scroll-smooth pb-4 [&::-webkit-scrollbar]:hidden -mx-1 px-1">
          {brands.map((brand) => (
            <Link
              key={brand.id}
              href={`/client/shop/${generateSlug(brand.name)}`}
              className="flex-shrink-0 w-36 h-24 bg-white dark:bg-slate-900 rounded-xl p-4 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex items-center justify-center border border-gray-100 dark:border-gray-800"
            >
              <Image
                src={brand.image || "/placeholder.svg"}
                alt={brand.name}
                width={100}
                height={60}
                className="object-contain max-h-16 w-auto grayscale hover:grayscale-0 transition-all duration-300"
              />
            </Link>
          ))}
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity rounded-full shadow-md bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-800 h-10 w-10"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
