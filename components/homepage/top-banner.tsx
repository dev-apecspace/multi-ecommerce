"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

const banners = [
  {
    id: 1,
    title: "Banner 1",
    image: "/ecommerce-banner-1.jpg",
  },
  {
    id: 2,
    title: "Banner 2",
    image: "/ecommerce-banner-2.jpg",
  },
  {
    id: 3,
    title: "Banner 3",
    image: "/ecommerce-banner-3.jpg",
  },
]

export function TopBanner() {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const prev = () => setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length)
  const next = () => setCurrentIndex((prev) => (prev + 1) % banners.length)

  return (
    <div className="container-viewport mt-4 mb-6">
      <div className="relative w-full rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-800">
        <div className="relative h-64 md:h-96">
          {banners.map((banner, index) => (
            <div
              key={banner.id}
              className={`absolute inset-0 transition-opacity duration-500 ${
                index === currentIndex ? "opacity-100" : "opacity-0"
              }`}
            >
              <Image
                src={banner.image || "/placeholder.svg"}
                alt={banner.title}
                fill
                className="object-cover"
                priority={index === 0}
              />
            </div>
          ))}
        </div>

        {/* Navigation */}
        <Button
          variant="ghost"
          size="icon"
          onClick={prev}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={next}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full"
        >
          <ChevronRight className="h-6 w-6" />
        </Button>

        {/* Indicators */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-2 w-2 rounded-full transition-all ${
                index === currentIndex ? "bg-white w-8" : "bg-white/50 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
