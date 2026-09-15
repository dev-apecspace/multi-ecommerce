"use client"

import { useState } from 'react'
import { Download, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function QrSaveButton({ orderId, orderNumber, label = 'Lưu ảnh để thanh toán' }: { orderId: number; orderNumber: string; label?: string }) {
  const [saving, setSaving] = useState(false)
  const save = async () => {
    try {
      setSaving(true)
      const response = await fetch(`/api/client/orders/${orderId}/payment-qr`)
      if (!response.ok) throw new Error('Không thể tải mã QR')
      const blob = await response.blob()
      const file = new File([blob], `qr-${orderNumber}.png`, { type: blob.type || 'image/png' })
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: 'Mã QR thanh toán', text: `Mã QR đơn ${orderNumber}`, files: [file] })
        return
      }
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url; anchor.download = file.name; anchor.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      if ((error as DOMException)?.name !== 'AbortError') console.error('QR save failed', error)
    } finally { setSaving(false) }
  }
  return <Button type="button" className="mt-3 w-full bg-blue-600 hover:bg-blue-700" onClick={() => void save()} disabled={saving}>{saving ? 'Đang chuẩn bị ảnh...' : label}</Button>
}
