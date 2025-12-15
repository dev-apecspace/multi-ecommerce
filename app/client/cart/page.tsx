"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Trash2, ShoppingCart } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import { useCart } from "@/lib/cart-context"
import { computePrice } from "@/lib/price-utils"

interface CartLine {
  id: number // cart item id
  productId: number
  variantId?: number | null
  variantName?: string
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
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

  useEffect(() => {
    fetchCart()
  }, [user])

  const fetchCart = async () => {
    setLoading(true)
    try {
      // If the user is not logged in, do not call the API (it requires userId)
      if (!user) {
        setLines([])
        setLoading(false)
        return
      }

      const res = await fetch(`/api/cart?userId=${user.id}`)
      if (!res.ok) throw new Error('Failed to load cart')
      const data = await res.json()
      // API returns { data: <array> }
      const items = data.data || []
      setLines(items)
      setSelectedIds(new Set())
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
    
    setLines((prev) => {
      if (!prev) return prev
      return prev.map((line) =>
        line.id === lineId ? { ...line, quantity: newQty } : line
      )
    })

    try {
      const res = await fetch('/api/cart', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartItemId: lineId, quantity: newQty }),
      })
      if (!res.ok) throw new Error('Failed to update')
    } catch (err) {
      console.error(err)
      toast({
        title: 'Lỗi',
        description: 'Không thể cập nhật số lượng',
        variant: 'destructive'
      })
      await fetchCart()
    }
  }

  const handleRemove = async (lineId: number) => {
    if (!confirm('Bạn có chắc muốn xóa sản phẩm khỏi giỏ hàng không?')) return
    try {
      const res = await fetch(`/api/cart?id=${lineId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to remove')
      toast({ title: 'Đã xóa' })
      // make sure selection updates after removal
      await fetchCart()
      setSelectedIds((prev) => {
        const copy = new Set(prev)
        copy.delete(lineId)
        return copy
      })
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

    // only checkout selected items
    const selectedLinesForCheckout = lines.filter(l => selectedIds.has(l.id))
    if (selectedLinesForCheckout.length === 0) {
      toast({ title: 'Lỗi', description: 'Vui lòng chọn ít nhất 1 sản phẩm để thanh toán', variant: 'destructive' })
      return
    }

    const checkoutItems = selectedLinesForCheckout.map(l => {
      const cp = computePrice({
        basePrice: l.basePrice,
        originalPrice: l.originalPrice ?? l.basePrice,
        salePrice: typeof l.salePrice === 'number' ? l.salePrice : null,
        taxApplied: !!l.taxApplied,
        taxRate: l.taxRate ?? 0,
        taxIncluded: l.taxIncluded !== false,
      })
      return {
        id: l.id,
        productId: l.productId,
        variantId: l.variantId || null,
        variantName: l.variantName,
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
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin mb-4">
                <ShoppingCart className="h-12 w-12 text-blue-600 mx-auto" />
              </div>
              <p className="text-lg text-muted-foreground">Đang tải giỏ hàng...</p>
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (!lines || lines.length === 0) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center h-96">
            <ShoppingCart className="h-16 w-16 text-gray-300 mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Giỏ hàng của bạn trống</h2>
            <p className="text-muted-foreground mb-6">Hãy thêm sản phẩm để bắt đầu mua sắm</p>
            <Button onClick={() => router.push('/client')}>
              Tiếp tục mua sắm
            </Button>
          </div>
        </div>
      </main>
    )
  }

  // compute display/line pricing for all lines
  const computedAll = computeTotals(lines)
  // group by vendorId
  const vendorGroups = (() => {
    const map = new Map<number | string, { vendorId: number | string, vendorName: string, items: any[] }>()
    for (const item of computedAll.lines) {
      const vid = item.vendorId ?? 'unknown'
      const vname = item.vendorName ?? 'Cửa hàng'
      if (!map.has(vid)) map.set(vid, { vendorId: vid, vendorName: vname, items: [] })
      map.get(vid)!.items.push(item)
    }
    return Array.from(map.values())
  })()
  // compute totals only for selected lines
  const selectedItems = computedAll.lines.filter((l: any) => selectedIds.has(l.id))
  const selectedTotals = computeTotals(selectedItems)

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <ShoppingCart className="h-8 w-8 text-blue-600" />
            Giỏ hàng của bạn
          </h1>
          <p className="text-gray-600 text-sm mt-1">Có {lines.length} sản phẩm trong giỏ</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {vendorGroups.map((group) => {
              const allVendorSelected = group.items.every((i) => selectedIds.has(i.id))
              const vendorTotals = computeTotals(group.items)
              return (
                <Card key={`vendor-${group.vendorId}`} className="overflow-hidden border border-gray-200 shadow-sm">
                  <div className="bg-blue-50 border-b border-blue-200 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={allVendorSelected}
                          onChange={(e) => {
                            const checked = e.target.checked
                            setSelectedIds((prev) => {
                              const copy = new Set(prev)
                              for (const id of group.items.map((i) => i.id)) {
                                if (checked) copy.add(id)
                                else copy.delete(id)
                              }
                              return copy
                            })
                          }}
                          className="w-5 h-5 cursor-pointer"
                          aria-label={`Chọn tất cả từ ${group.vendorName}`}
                        />
                        <div>
                          <p className="font-semibold text-gray-900">{group.vendorName}</p>
                          <p className="text-xs text-gray-600">({group.items.length} sản phẩm)</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Tổng cửa hàng</p>
                        <p className="text-lg font-bold text-blue-600">{vendorTotals.totalDisplay.toLocaleString('vi-VN')}₫</p>
                      </div>
                    </div>
                  </div>

                  <CardContent className="p-0">
                    <div className="space-y-0">
                      {group.items.map((line: any) => (
                        <div
                          key={line.id}
                          className="border-b border-gray-100 p-4 hover:bg-gray-50 transition-colors last:border-b-0"
                        >
                          <div className="flex gap-4">
                            <input
                              type="checkbox"
                              checked={selectedIds.has(line.id)}
                              onChange={(e) => {
                                const checked = e.target.checked
                                setSelectedIds((prev) => {
                                  const copy = new Set(prev)
                                  if (checked) copy.add(line.id)
                                  else copy.delete(line.id)
                                  return copy
                                })
                              }}
                              className="w-5 h-5 cursor-pointer mt-1 flex-shrink-0"
                              aria-label={`Chọn ${line.productName}`}
                            />

                            {line.image ? (
                              <img
                                src={line.image}
                                alt={line.productName}
                                className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                              />
                            ) : (
                              <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                                <ShoppingCart className="h-8 w-8 text-gray-400" />
                              </div>
                            )}

                            <div className="flex-grow">
                              <h3 className="font-medium text-gray-900 text-sm">{line.productName}</h3>
                              {line.variantName && (
                                <p className="text-xs text-gray-500 mt-1">Phân loại: {line.variantName}</p>
                              )}
                              {line.discountPercent > 0 && (
                                <p className="text-xs text-red-600 font-medium mt-1">Giảm {line.discountPercent}%</p>
                              )}
                            </div>

                            <div className="flex items-center gap-6 flex-shrink-0">
                              <div className="text-right">
                                <p className="text-sm font-bold text-gray-900">
                                  {line.displayPrice.toLocaleString('vi-VN')}₫
                                </p>
                                {line.displayOriginalPrice > line.displayPrice && (
                                  <p className="text-xs text-gray-500 line-through">
                                    {line.displayOriginalPrice.toLocaleString('vi-VN')}₫
                                  </p>
                                )}
                                {line.taxApplied && line.taxRate ? (
                                  <p className="text-xs text-amber-600 mt-1">(VAT {line.taxRate}%)</p>
                                ) : null}
                              </div>

                              <div className="flex items-center gap-1 border border-gray-300 rounded-lg p-1 bg-white">
                                <button
                                  onClick={() =>
                                    handleUpdateQty(line.id, Math.max(1, line.quantity - 1))
                                  }
                                  className="px-2 py-1 text-gray-600 hover:text-gray-900 transition-colors"
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
                                  className="w-10 text-center text-sm font-medium border-0 focus:outline-none focus:ring-0"
                                  min={1}
                                />
                                <button
                                  onClick={() => handleUpdateQty(line.id, line.quantity + 1)}
                                  className="px-2 py-1 text-gray-600 hover:text-gray-900 transition-colors"
                                >
                                  +
                                </button>
                              </div>

                              <div className="text-right min-w-28">
                                <p className="font-bold text-gray-900">
                                  {(line.displayPrice * line.quantity).toLocaleString('vi-VN')}₫
                                </p>
                                <p className="text-xs text-gray-500">({line.quantity} × {line.displayPrice.toLocaleString('vi-VN')}₫)</p>
                              </div>

                              <button
                                onClick={() => handleRemove(line.id)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors flex-shrink-0"
                                aria-label={`Xóa ${line.productName}`}
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <aside className="lg:col-span-1">
            <div className="sticky top-6 space-y-4">
              <Card className="border border-gray-200 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 border-b border-blue-200">
                  <h2 className="font-bold text-gray-900">Tóm tắt đơn hàng</h2>
                </div>
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between pb-3 border-b border-gray-200">
                    <span className="text-sm text-gray-600">Tạm tính</span>
                    <span className="font-medium text-gray-900">
                      {selectedTotals.subtotalPreTax.toLocaleString('vi-VN')}₫
                    </span>
                  </div>
                  <div className="flex justify-between pb-3 border-b border-gray-200">
                    <span className="text-sm text-gray-600">Thuế (VAT)</span>
                    <span className="font-medium text-gray-900">
                      {selectedTotals.taxTotal.toLocaleString('vi-VN')}₫
                    </span>
                  </div>
                  <div className="flex justify-between pt-3">
                    <span className="text-sm font-semibold text-gray-900">Tổng cộng</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {selectedTotals.totalDisplay.toLocaleString('vi-VN')}₫
                    </span>
                  </div>

                  <Button
                    onClick={handleCheckout}
                    size="lg"
                    className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
                  >
                    Tiến hành thanh toán
                  </Button>

                  <div className="text-center pt-2">
                    <p className="text-xs text-gray-500">
                      Đã chọn <span className="font-semibold text-gray-900">{selectedItems.length}</span> sản phẩm
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-xs text-blue-900">
                  <span className="font-semibold">💡 Mẹo:</span> Chọn sản phẩm bạn muốn mua trước khi thanh toán
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}