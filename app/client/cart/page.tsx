"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import { useCart } from "@/lib/cart-context"
import { computePrice } from "@/lib/price-utils"

interface CartLine {
  id: number // cart item id
  productId: number
  variantId?: number | null
  productName: string
  image?: string
  quantity: number
  // Stored prices come from backend. Conventions: stored values follow product.taxIncluded flag.
  basePrice: number // base stored price (could be incl tax if taxIncluded true)
  salePrice?: number | null // stored sale price if exists (same convention as basePrice)
  originalPrice?: number
  taxApplied?: boolean
  taxRate?: number
  taxIncluded?: boolean
  vendorId?: number
  vendorName?: string
}

export default function CartPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  useCart()
  const [lines, setLines] = useState<CartLine[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<number | null>(null)

  useEffect(() => {
    fetchCart()
  }, [])

  const fetchCart = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/cart')
      if (!res.ok) throw new Error('Failed to load cart')
      const data = await res.json()
      // Expect data.items = array of cart lines
      setLines(data.items || [])
    } catch (err) {
      console.error(err)
      toast({
        title: 'Lỗi',
        description: 'Không thể tải giỏ hàng',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // Compute totals using canonical pre-tax logic per line, then aggregate
  const computeTotals = (items: CartLine[]) => {
    // We'll compute:
    // - subtotalPreTax: sum of (line.preTaxSale * qty)
    // - taxTotal: sum of (line.taxAmount * qty)
    // - totalDisplay: sum of displayPrice * qty (display prices include tax where applicable)
    let subtotalPreTax = 0
    let taxTotal = 0
    let totalDisplay = 0

    const linesWithPriceData = items.map((line) => {
      const cp = computePrice({
        basePrice: line.basePrice,
        originalPrice: line.originalPrice ?? line.basePrice,
        salePrice: typeof line.salePrice === 'number' ? line.salePrice : null,
        taxRate: line.taxRate ?? 0,
      })

      // cp.displayPrice is final display (incl tax if applicable)
      // cp.canonicalPreTaxSale is pre-tax canonical sale value (rounded)
      const preTaxSale = cp._preTaxSale ?? cp._preTaxBase // raw float before rounding
      const preTaxSaleRounded = cp.canonicalPreTaxSale ?? Math.round(preTaxSale ?? 0)

      // tax amount per unit (using floats then rounding at the end)
      // Calculate tax from the inclusive price if rate > 0
      const taxPerUnit = ((line.taxRate ?? 0) > 0)
        ? ((preTaxSale ?? cp._preTaxBase ?? 0) * ((line.taxRate ?? 0) / 100))
        : 0

      subtotalPreTax += (preTaxSaleRounded) * line.quantity
      taxTotal += Math.round(taxPerUnit * line.quantity)
      totalDisplay += cp.displayPrice * line.quantity

      return {
        ...line,
        displayPrice: cp.displayPrice,
        displayOriginalPrice: cp.displayOriginalPrice,
        discountPercent: cp.discountPercent,
        preTaxSaleRounded,
        taxPerUnit
      }
    })

    return {
      lines: linesWithPriceData,
      subtotalPreTax,
      taxTotal,
      totalDisplay,
    }
  }

  const handleUpdateQty = async (lineId: number, newQty: number) => {
    if (newQty < 1) return
    setUpdatingId(lineId)
    try {
      const res = await fetch('/api/cart', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartItemId: lineId, quantity: newQty }),
      })
      if (!res.ok) throw new Error('Failed to update')
      await fetchCart()
    } catch (err) {
      console.error(err)
      toast({
        title: 'Lỗi',
        description: 'Không thể cập nhật số lượng',
        variant: 'destructive'
      })
    } finally {
      setUpdatingId(null)
    }
  }

  const handleRemove = async (lineId: number) => {
    if (!confirm('Bạn có chắc muốn xóa sản phẩm khỏi giỏ hàng không?')) return
    try {
      const res = await fetch('/api/cart', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartItemId: lineId }),
      })
      if (!res.ok) throw new Error('Failed to remove')
      toast({ title: 'Đã xóa' })
      await fetchCart()
    } catch (err) {
      console.error(err)
      toast({ title: 'Lỗi', description: 'Không thể xóa sản phẩm', variant: 'destructive' })
    }
  }

  const handleCheckout = () => {
    if (!user) {
      router.push('/auth/login?callback=/client/checkout')
      return
    }
    // Save checkout items to session/localstorage same shape as checkout expects
    // Transform current lines into checkoutItems
    if (!lines || lines.length === 0) {
      toast({ title: 'Giỏ hàng trống', description: 'Vui lòng thêm sản phẩm trước khi thanh toán' })
      return
    }

    const checkoutItems = lines.map(l => {
      const cp = computePrice({
        basePrice: l.basePrice,
        originalPrice: l.originalPrice ?? l.basePrice,
        salePrice: typeof l.salePrice === 'number' ? l.salePrice : null,
        taxApplied: !!l.taxApplied,
        taxRate: l.taxRate ?? 0,
        taxIncluded: l.taxIncluded !== false,
      })
      return {
        id: l.variantId ?? l.productId,
        productId: l.productId,
        productName: l.productName,
        quantity: l.quantity,
        price: cp.displayPrice,
        basePrice: cp.canonicalPreTaxPrice ?? 0,
        originalPrice: cp.displayOriginalPrice,
        salePrice: cp.displayPrice,
        taxApplied: l.taxApplied,
        taxRate: l.taxRate,
        image: l.image,
        vendorId: l.vendorId,
        vendorName: l.vendorName
      }
    })

    sessionStorage.setItem('checkoutItems', JSON.stringify(checkoutItems))
    router.push('/client/checkout')
  }

  if (loading) {
    return (
      <main className="p-6">
        <p className="text-center text-muted-foreground">Đang tải giỏ hàng...</p>
      </main>
    )
  }

  if (!lines || lines.length === 0) {
    return (
      <main className="p-6">
        <p className="text-center text-muted-foreground">Giỏ hàng trống</p>
      </main>
    )
  }

  const totals = computeTotals(lines)

  return (
    <main className="p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3">Sản phẩm</th>
                    <th className="text-left py-3">Đơn giá</th>
                    <th className="text-left py-3">Số lượng</th>
                    <th className="text-left py-3">Thành tiền</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {totals.lines.map((line: any) => (
                    <tr key={line.id} className="border-b hover:bg-muted">
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          {line.image ? (
                            <img src={line.image} alt={line.productName} className="w-16 h-16 object-cover rounded" />
                          ) : (
                            <div className="w-16 h-16 bg-gray-100 rounded" />
                          )}
                          <div>
                            <div className="font-medium">{line.productName}</div>
                            {line.variantId && <div className="text-xs text-muted-foreground">Variant: {line.variantId}</div>}
                            {line.discountPercent > 0 && <div className="text-xs text-red-600">-{line.discountPercent}%</div>}
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="font-medium">{line.displayPrice.toLocaleString('vi-VN')}₫</div>
                        <div className="text-xs text-muted-foreground line-through">{line.displayOriginalPrice.toLocaleString('vi-VN')}₫</div>
                        {line.taxApplied && line.taxRate ? <div className="text-xs text-amber-600">(VAT {line.taxRate}%)</div> : null}
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <button
                            disabled={updatingId === line.id}
                            onClick={() => handleUpdateQty(line.id, Math.max(1, line.quantity - 1))}
                            className="px-2 py-1 border rounded"
                          >
                            −
                          </button>
                          <input
                            type="number"
                            value={line.quantity}
                            onChange={(e) => {
                              const v = Math.max(1, Number.parseInt(e.target.value) || 1)
                              handleUpdateQty(line.id, v)
                            }}
                            className="w-16 text-center border px-2 py-1 rounded"
                            min={1}
                          />
                          <button
                            disabled={updatingId === line.id}
                            onClick={() => handleUpdateQty(line.id, line.quantity + 1)}
                            className="px-2 py-1 border rounded"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="py-3 font-medium">{(line.displayPrice * line.quantity).toLocaleString('vi-VN')}₫</td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          <button onClick={() => handleRemove(line.id)} className="text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        <aside className="lg:col-span-1 space-y-4">
          <Card>
            <CardContent>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-muted-foreground">Tạm tính (chưa VAT)</span>
                <span className="font-medium">{totals.subtotalPreTax.toLocaleString('vi-VN')}₫</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-muted-foreground">Thuế (VAT)</span>
                <span className="font-medium">{totals.taxTotal.toLocaleString('vi-VN')}₫</span>
              </div>
              <div className="border-t mt-3 pt-3 flex justify-between items-center">
                <div>
                  <div className="text-sm text-muted-foreground">Tổng</div>
                  <div className="font-bold text-xl">{totals.totalDisplay.toLocaleString('vi-VN')}₫</div>
                </div>
              </div>

              <div className="mt-4">
                <Button className="w-full" onClick={handleCheckout}>
                  Thanh toán
                </Button>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  )
}
