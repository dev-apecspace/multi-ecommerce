"use client"

// Alias page so vendors can access promotions module at /seller/promotions
// Reuse the existing campaigns experience (register for campaign + register products).
import SellerCampaignsPage from "../campaigns/page"

export default function SellerPromotionsPage() {
  return <SellerCampaignsPage />
}

