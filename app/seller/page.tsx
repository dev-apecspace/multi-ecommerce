'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

export default function SellerIndexPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user?.role !== 'customer') router.replace('/seller/dashboard')
  }, [loading, user?.role, router])

  return null
}
