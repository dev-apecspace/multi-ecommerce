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
        <div className="flex items-center gap-2 mb-6">
          <h2 className="text-2xl font-bold">🏪 Cửa hàng uy tín</h2>
          <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="h-48 animate-pulse rounded-xl border-none bg-gray-200 dark:bg-gray-800" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <h2 className="text-2xl font-bold">🏪 Cửa hàng uy tín</h2>
        <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800"></div>
        <Link href="/client/shops" className="text-sm font-medium text-primary hover:underline">
          Xem tất cả
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {vendors.map((vendor, idx) => (
          <Link
            key={vendor.id}
            href={`/client/shop/${vendor.slug || generateSlug(vendor.name)}`}
            className="group relative h-48 rounded-xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-300"
          >
            <Image
              src={vendor.image || "/placeholder.svg"}
              alt={vendor.name}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-500"
            />
            <div className={`absolute inset-0 bg-gradient-to-br ${colors[idx % colors.length]} opacity-60 group-hover:opacity-50 transition-opacity duration-300`} />
            
            <div className="absolute inset-0 flex flex-col justify-between p-5 text-white">
              <div className="flex justify-between items-start">
                <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs font-bold tracking-wide">VERIFIED</span>
                </div>
              </div>
              
              <div>
                <h3 className="text-xl font-bold mb-1 group-hover:translate-x-1 transition-transform duration-300">{vendor.name}</h3>
                <div className="flex items-center gap-2 opacity-90 group-hover:opacity-100 transition-opacity">
                  <span className="text-sm font-medium">Ghé thăm shop</span>
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
