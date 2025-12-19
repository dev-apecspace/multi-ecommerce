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
    </main>
  )
}
