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
      <h2 className="text-xl font-bold mb-4">Thương hiệu nổi bật</h2>
      <div className="relative">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        <div id="brands-scroll" className="flex gap-4 overflow-x-auto scroll-smooth pb-2 [&::-webkit-scrollbar]:hidden">
          {brands.map((brand) => (
            <Link
              key={brand.id}
              href={`/client/shop/${generateSlug(brand.name)}`}
              className="flex-shrink-0 w-32 h-20 bg-surface dark:bg-slate-800 rounded-lg p-2 hover:shadow-md transition-shadow flex items-center justify-center border border-border"
            >
              <Image
                src={brand.image || "/placeholder.svg"}
                alt={brand.name}
                width={100}
                height={60}
                className="object-contain max-h-16"
              />
            </Link>
          ))}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
