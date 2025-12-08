"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { generateSlug } from "@/lib/utils"

export function ShopeemalSlider() {
  const [vendors, setVendors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const response = await fetch('/api/vendors?status=approved&limit=3')
        const result = await response.json()
        setVendors(result.data || [])
      } catch (error) {
        console.error('Failed to fetch vendors:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchVendors()
  }, [])

  const colors = [
    "from-purple-500 to-purple-600",
    "from-blue-500 to-blue-600",
    "from-green-500 to-green-600",
  ]

  if (loading) {
    return (
      <div>
        <h2 className="text-xl font-bold mb-4">Mua từ những thương nhân tin cậy</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="h-48 animate-pulse">
              <CardContent className="p-0 h-full bg-gray-200 dark:bg-gray-700" />
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Mua từ những thương nhân tin cậy</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {vendors.map((vendor, idx) => (
          <Link
            key={vendor.id}
            href={`/client/shop/${vendor.slug || generateSlug(vendor.name)}`}
            className="group relative h-48 rounded-lg overflow-hidden cursor-pointer"
          >
            <Image
              src={vendor.image || "/placeholder.svg"}
              alt={vendor.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className={`absolute inset-0 bg-gradient-to-r ${colors[idx % colors.length]} opacity-40`} />
            <div className="absolute inset-0 flex flex-col justify-end p-4 text-white">
              <div className="inline-flex items-center gap-2 w-fit bg-white/20 px-3 py-1 rounded-full mb-2 backdrop-blur-sm">
                <span className="text-xs font-semibold">Đã xác thực</span>
              </div>
              <h3 className="text-lg font-bold">{vendor.name}</h3>
              <div className="flex items-center gap-1 group-hover:gap-2 transition-all">
                <span className="text-sm">Xem shop</span>
                <ChevronRight className="h-4 w-4" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
