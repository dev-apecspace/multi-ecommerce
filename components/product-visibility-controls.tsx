"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

export interface ProductVisibility {
  id: number
  sellerHidden?: boolean
  adminHidden?: boolean
  adminLocked?: boolean
}

export function ProductVisibilityBadge({ product }: { product: ProductVisibility }) {
  const labels = [product.adminLocked && 'Admin đã khóa', product.adminHidden && 'Admin đã ẩn', product.sellerHidden && 'Seller đã ẩn'].filter(Boolean)
  return labels.length ? <span className="block text-xs font-medium text-amber-700 dark:text-amber-400">{labels.join(' · ')}</span> : null
}

export function ProductVisibilityControls({ product, admin = false, onUpdated }: {
  product: ProductVisibility
  admin?: boolean
  onUpdated: (product: ProductVisibility) => void
}) {
  const [busy, setBusy] = useState(false)
  const { toast } = useToast()

  async function update(field: 'sellerHidden' | 'adminHidden' | 'adminLocked') {
    setBusy(true)
    try {
      const response = await fetch(admin ? '/api/admin/products' : `/api/seller/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...(admin ? { productId: product.id } : {}), [field]: !product[field] }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Không thể cập nhật sản phẩm.')
      onUpdated(data)
      toast({ title: 'Đã cập nhật trạng thái sản phẩm' })
    } catch (error) {
      toast({ title: 'Lỗi', description: error instanceof Error ? error.message : 'Không thể cập nhật sản phẩm.', variant: 'destructive' })
    } finally {
      setBusy(false)
    }
  }

  const hidden = admin ? product.adminHidden : product.sellerHidden
  return <div className="flex flex-wrap gap-2">
    <Button size="sm" variant="outline" disabled={busy} onClick={() => update(admin ? 'adminHidden' : 'sellerHidden')}>
      {hidden ? 'Bỏ ẩn' : 'Ẩn sản phẩm'}
    </Button>
    {admin && <Button size="sm" variant="outline" disabled={busy} onClick={() => update('adminLocked')}>
      {product.adminLocked ? 'Mở khóa' : 'Khóa sản phẩm'}
    </Button>}
  </div>
}
