"use client"

import { TopBanner } from "@/components/homepage/top-banner"
import { MegaMenu } from "@/components/homepage/mega-menu"
import { FlashSaleCarousel } from "@/components/homepage/flash-sale-carousel"
import { PromotionalBlocks } from "@/components/homepage/promotional-blocks"
import { CategoryShowcase } from "@/components/homepage/category-showcase"
import { ShopeemalSlider } from "@/components/homepage/shopeemal-slider"
import { RecommendedProducts } from "@/components/homepage/recommended-products"
import { BrandSlider } from "@/components/homepage/brand-slider"
import { TrustSection } from "@/components/homepage/trust-section"
import Link from "next/link"
import { MessageSquareWarning } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <main className="w-full bg-white dark:bg-slate-950">
      <TopBanner />
      <MegaMenu />
      
      {/* Flash Sale Section - Prominent */}
      <div className="bg-gradient-to-b from-red-50 to-white dark:from-slate-900 dark:to-slate-950 py-6">
        <FlashSaleCarousel />
      </div>

      {/* Promotional Blocks Section */}
      <div className="container-viewport my-12">
        <PromotionalBlocks />
      </div>

      {/* Category Showcase Section */}
      <div className="container-viewport my-12">
        <CategoryShowcase />
      </div>

      {/* Shopeemal Section */}
      <div className="bg-gray-50 dark:bg-slate-900 py-8">
        <div className="container-viewport">
          <ShopeemalSlider />
        </div>
      </div>

      {/* Brand Slider Section */}
      <div className="container-viewport my-12">
        <BrandSlider />
      </div>

      {/* Recommended Products Section */}
      <div className="bg-gray-50 dark:bg-slate-900 py-8">
        <div className="container-viewport">
          <RecommendedProducts />
        </div>
      </div>

      {/* Trust Section */}
      <div className="container-viewport my-8">
        <TrustSection />
      </div>
      <section className="container-viewport mb-10">
        <div className="flex flex-col gap-4 rounded-2xl border border-orange-200 bg-orange-50 p-6 sm:flex-row sm:items-center sm:justify-between dark:border-orange-900 dark:bg-orange-950/30">
          <div className="flex items-start gap-3"><MessageSquareWarning className="mt-1 h-6 w-6 shrink-0 text-orange-600" /><div><h2 className="font-semibold">Cần hỗ trợ hoặc muốn gửi khiếu nại?</h2><p className="mt-1 text-sm text-muted-foreground">Gửi yêu cầu, đính kèm bằng chứng và theo dõi tiến trình xử lý trực tuyến.</p></div></div>
          <Button asChild className="shrink-0 bg-orange-600 hover:bg-orange-700"><Link href="/client/ho-tro">Gửi phản ánh / khiếu nại</Link></Button>
        </div>
      </section>
    </main>
  )
}
