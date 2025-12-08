"use client"

import { TopBanner } from "@/components/homepage/top-banner"
import { MegaMenu } from "@/components/homepage/mega-menu"
import { FlashSaleCarousel } from "@/components/homepage/flash-sale-carousel"
import { PromotionalBlocks } from "@/components/homepage/promotional-blocks"
import { ShopeemalSlider } from "@/components/homepage/shopeemal-slider"
import { RecommendedProducts } from "@/components/homepage/recommended-products"
import { BrandSlider } from "@/components/homepage/brand-slider"

export default function HomePage() {
  return (
    <main className="w-full">
      <TopBanner />
      <MegaMenu />
      <FlashSaleCarousel />
      <div className="container-viewport my-8">
        <ShopeemalSlider />
      </div>
      <div className="container-viewport my-8">
        <PromotionalBlocks />
      </div>
      <div className="container-viewport my-8">
        <BrandSlider />
      </div>
      <div className="container-viewport my-8">
        <RecommendedProducts />
      </div>
    </main>
  )
}
