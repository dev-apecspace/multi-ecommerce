"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function SellerProfilePage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/seller/settings?tab=profile")
  }, [router])

  return (
    <div className="flex items-center justify-center h-96">
      <p>Đang chuyển hướng...</p>
    </div>
  )
}
