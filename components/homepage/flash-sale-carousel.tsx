"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { generateSlug } from "@/lib/utils"
import { isCampaignActive } from "@/lib/price-utils"

export function FlashSaleCarousel() {
  const [scrollPosition, setScrollPosition] = useState(0)
  const [products, setProducts] = useState<any[]>([])
  const [campaign, setCampaign] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [timeRemaining, setTimeRemaining] = useState<string>("")

  useEffect(() => {
    const fetchFlashSaleData = async () => {
      console.log('🔥 FlashSaleCarousel: Fetching flash sale data...')
      try {
        console.log('📡 Calling /api/products?limit=50&isFlashSale=true')
        const response = await fetch('/api/products?limit=50&isFlashSale=true')
        const result = await response.json()
        console.log('✅ Products fetched:', result.data?.length, 'items')
        
        const now = new Date()
        
        let bestCampaign: any = null
        const flashSaleProducts = (result.data || []).filter((p: any) => {
          // Try to find flash sale campaign in product campaigns
          const flashSaleCampaign = p.campaigns?.find((c: any) => c.campaignType === 'flash_sale') || 
                                   (p.appliedCampaign?.campaignType === 'flash_sale' ? p.appliedCampaign : null)

          if (flashSaleCampaign && isCampaignActive(flashSaleCampaign)) {
            if (!bestCampaign) {
              bestCampaign = flashSaleCampaign
            }
            p.flashSaleCampaign = flashSaleCampaign
            return true
          }
          return false
        })
        
        if (flashSaleProducts.length > 0) {
          const activeCampaign = bestCampaign || flashSaleProducts[0].flashSaleCampaign || flashSaleProducts[0].appliedCampaign
          setCampaign(activeCampaign)
          
          const productsWithDiscount = flashSaleProducts.slice(0, 8).map((product: any) => ({
            ...product,
            discount: product.originalPrice 
              ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
              : 0
          }))
          setProducts(productsWithDiscount)
        }
      } catch (error) {
        console.error('Failed to fetch flash sale data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchFlashSaleData()
  }, [])

  useEffect(() => {
    if (!campaign?.flashSaleStartTime || !campaign?.flashSaleEndTime) return

    const updateTimer = () => {
      const now = new Date()
      const hours = String(now.getHours()).padStart(2, '0')
      const minutes = String(now.getMinutes()).padStart(2, '0')
      const seconds = String(now.getSeconds()).padStart(2, '0')
      const currentTime = `${hours}:${minutes}:${seconds}`

      const [startH, startM] = campaign.flashSaleStartTime.split(':').map(Number)
      const [endH, endM] = campaign.flashSaleEndTime.split(':').map(Number)
      const [curH, curM, curS] = currentTime.split(':').map(Number)

      const startTotalSeconds = startH * 3600 + startM * 60
      const endTotalSeconds = endH * 3600 + endM * 60
      const currentTotalSeconds = curH * 3600 + curM * 60 + curS

      if (currentTotalSeconds < startTotalSeconds) {
        const diffSeconds = startTotalSeconds - currentTotalSeconds
        const h = Math.floor(diffSeconds / 3600)
        const m = Math.floor((diffSeconds % 3600) / 60)
        const s = diffSeconds % 60
        setTimeRemaining(`Bắt đầu trong ${h}h ${m}m ${s}s`)
      } else if (currentTotalSeconds <= endTotalSeconds) {
        const diffSeconds = endTotalSeconds - currentTotalSeconds
        const h = Math.floor(diffSeconds / 3600)
        const m = Math.floor((diffSeconds % 3600) / 60)
        const s = diffSeconds % 60
        setTimeRemaining(`Kết thúc trong ${h}h ${m}m ${s}s`)
      } else {
        setTimeRemaining("Flash sale đã kết thúc")
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [campaign])

  const scroll = (direction: "left" | "right") => {
    const container = document.getElementById("flash-scroll-container")
    if (container) {
      const scrollAmount = 300
      container.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      })
      setScrollPosition(container.scrollLeft)
    }
  }

  const isFlashSaleActive = () => {
    if (!campaign?.flashSaleStartTime || !campaign?.flashSaleEndTime) {
      return true
    }
    const now = new Date()
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    const currentTime = `${hours}:${minutes}`
    return currentTime >= campaign.flashSaleStartTime && currentTime <= campaign.flashSaleEndTime
  }

  if (loading) {
    return (
      <div className="container-viewport my-8">
        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-6 mb-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-4xl animate-bounce">⚡</div>
              <div>
                <h2 className="text-2xl font-bold">Flash Sale</h2>
                <p className="text-sm opacity-90">Giảm giá khủng mỗi ngày</p>
              </div>
            </div>
            <div className="text-right">
              <div className="h-6 w-32 bg-white/20 rounded animate-pulse"></div>
              <div className="text-sm mt-2 opacity-90">Loading...</div>
            </div>
          </div>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-48">
              <Card className="h-full animate-pulse">
                <CardContent className="p-0">
                  <div className="h-48 bg-gray-200 dark:bg-gray-700" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="container-viewport my-8">
        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-4xl">⚡</div>
              <div>
                <h2 className="text-2xl font-bold">Flash Sale</h2>
                <p className="text-sm opacity-90">Không có flash sale nào đang diễn ra</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const isActive = isFlashSaleActive()

  return (
    <div className={`container-viewport my-8 ${!isActive ? 'opacity-60' : ''}`}>
      <div className={`bg-gradient-to-r rounded-xl p-6 mb-6 text-white shadow-lg ${
        isActive ? 'from-red-500 to-red-600' : 'from-gray-500 to-gray-600'
      }`}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className={`text-4xl ${isActive ? 'animate-bounce' : ''}`}>⚡</div>
            <div>
              <h2 className="text-3xl font-bold">{campaign?.name || 'Flash Sale'}</h2>
              <p className="text-sm opacity-90">
                {isActive ? campaign?.description || 'Giảm giá khủng mỗi ngày' : 'Sắp diễn ra'}
              </p>
            </div>
          </div>
          <div className="bg-white/20 backdrop-blur rounded-lg px-6 py-3 text-center">
            <div className="text-2xl font-bold font-mono">{timeRemaining}</div>
            <div className="text-xs opacity-90 mt-1">
              {campaign?.flashSaleStartTime && campaign?.flashSaleEndTime && (
                <>Giờ: {campaign.flashSaleStartTime} - {campaign.flashSaleEndTime}</>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="relative">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700 shadow-md"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        <div
          id="flash-scroll-container"
          className="flex gap-4 overflow-x-auto scroll-smooth pb-2 [&::-webkit-scrollbar]:hidden"
          onScroll={(e) => setScrollPosition(e.currentTarget.scrollLeft)}
        >
          {products.map((product) => (
            <div key={product.id} className={`flex-shrink-0 w-48 ${!isActive ? 'pointer-events-none' : ''}`}>
              <Link href={isActive ? `/client/product/${product.slug || generateSlug(product.name)}` : '#'}>
                <Card className={`transition-all cursor-pointer h-full overflow-hidden ${
                  isActive ? 'hover:shadow-xl hover:scale-105 duration-300' : 'opacity-50'
                }`}>
                  <CardContent className="p-0 relative">
                    <div className="relative h-48 bg-gray-200 dark:bg-gray-700">
                      <Image
                        src={product.image || "/placeholder.svg"}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                      {product.discount > 0 && (
                        <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                          -{product.discount}%
                        </div>
                      )}
                      <div className="absolute top-3 left-3 bg-yellow-400 text-yellow-900 px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                        <span>⚡</span> Sale
                      </div>
                      {!isActive && (
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                          <span className="text-white font-bold text-center text-sm">Sắp diễn ra</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4 space-y-3">
                      <p className="text-sm font-medium line-clamp-2 h-10">{product.name}</p>
                      <div className="space-y-1">
                        <p className="text-lg font-bold text-red-600 dark:text-red-500">
                          {product.price.toLocaleString("vi-VN")}₫
                        </p>
                        {product.originalPrice && (
                          <p className="text-xs text-muted-foreground line-through">
                            {product.originalPrice.toLocaleString("vi-VN")}₫
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          ))}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700 shadow-md"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
