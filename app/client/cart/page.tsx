"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { X, Minus, Plus, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import { useCart } from "@/lib/cart-context"

interface CartItem {
  id: number
  quantity: number
  variantId: number | null
  Product: {
    id: number
    name: string
    price: number
    originalPrice?: number
    stock: number
    vendorId: number
    Vendor: { id: number; name: string }
  }
  ProductVariant?: {
    id: number
    name: string
    sku?: string
    barcode?: string
    image?: string
  } | null
}

export default function CartPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const { removeFromCart } = useCart()
  const [items, setItems] = useState<CartItem[]>([])
  const [selectedItems, setSelectedItems] = useState<number[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchCart()
    } else {
      setLoading(false)
    }
  }, [user])

  const fetchCart = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/cart?userId=${user!.id}`)
      const result = await response.json()
      console.log('Cart data:', result.data)
      setItems(result.data || [])
    } catch (error) {
      console.error('Cart fetch error:', error)
      toast({ title: 'Lỗi', description: 'Không thể tải giỏ hàng', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const updateQuantity = async (cartItemId: number, quantity: number) => {
    if (quantity < 1) {
      removeItem(cartItemId)
      return
    }
    try {
      const response = await fetch(`/api/cart`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartItemId, quantity })
      })
      if (response.ok) {
        setItems(items.map((item) => (item.id === cartItemId ? { ...item, quantity } : item)))
      } else {
        toast({ title: 'Lỗi', description: 'Không thể cập nhật số lượng', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Lỗi', description: 'Không thể cập nhật số lượng', variant: 'destructive' })
    }
  }

  const removeItem = async (cartItemId: number) => {
    try {
      const itemToRemove = items.find(item => item.id === cartItemId)
      await fetch(`/api/cart?id=${cartItemId}`, { method: 'DELETE' })
      setItems(items.filter((item) => item.id !== cartItemId))
      setSelectedItems(selectedItems.filter((sid) => sid !== cartItemId))
      if (itemToRemove) {
        removeFromCart(itemToRemove.quantity)
      }
      toast({ title: 'Thành công', description: 'Xóa sản phẩm khỏi giỏ hàng' })
    } catch (error) {
      toast({ title: 'Lỗi', description: 'Không thể xóa sản phẩm', variant: 'destructive' })
    }
  }

  const toggleSelectItem = (id: number) => {
    setSelectedItems((prev) => (prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]))
  }

  const toggleSelectVendor = (vendorId: number) => {
    const vendorItemIds = items.filter(item => item.Product.vendorId === vendorId).map(item => item.id)
    const allVendorItemsSelected = vendorItemIds.every(id => selectedItems.includes(id))
    
    if (allVendorItemsSelected) {
      setSelectedItems(selectedItems.filter(id => !vendorItemIds.includes(id)))
    } else {
      setSelectedItems([...new Set([...selectedItems, ...vendorItemIds])])
    }
  }

  const groupedByVendor = items.reduce((acc, item) => {
    const vendorId = item.Product.vendorId
    if (!acc[vendorId]) {
      acc[vendorId] = { vendor: item.Product.Vendor, items: [] }
    }
    acc[vendorId].items.push(item)
    return acc
  }, {} as Record<number, { vendor: { id: number; name: string }; items: CartItem[] }>)

  const selectedItemsData = items.filter((item) => selectedItems.includes(item.id))
  const subtotal = selectedItemsData.reduce((sum, item) => sum + item.Product.price * item.quantity, 0)
  const originalSubtotal = selectedItemsData.reduce((sum, item) => sum + (item.Product.originalPrice || item.Product.price) * item.quantity, 0)
  const savings = originalSubtotal - subtotal
  const shipping = subtotal > 0 ? 0 : 0
  const total = subtotal + shipping

  const handleCheckout = () => {
    if (selectedItems.length === 0) {
      toast({ title: 'Lỗi', description: 'Chọn ít nhất một sản phẩm', variant: 'destructive' })
      return
    }
    const checkoutItems = selectedItemsData.map(item => ({
      id: item.id,
      productId: item.Product.id,
      productName: item.Product.name,
      quantity: item.quantity,
      price: item.Product.price,
      image: item.ProductVariant?.image || "/placeholder.svg",
      variantId: item.variantId,
      vendorId: item.Product.vendorId,
      vendorName: item.Product.Vendor.name
    }))
    sessionStorage.setItem('checkoutItems', JSON.stringify(checkoutItems))
    router.push('/client/checkout')
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-surface dark:bg-slate-950">
        <div className="container-viewport py-12 text-center">
          <p>Đang tải giỏ hàng...</p>
        </div>
      </main>
    )
  }

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-surface dark:bg-slate-950">
        <div className="container-viewport py-12">
          <div className="max-w-md mx-auto">
            <Card className="p-8">
              <CardContent className="p-0 text-center space-y-6">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <ShoppingBag className="h-10 w-10 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold mb-2">Giỏ hàng trống</h1>
                  <p className="text-muted-foreground">Thêm sản phẩm yêu thích vào giỏ hàng để tiếp tục</p>
                </div>
                <Link href="/">
                  <Button size="lg" className="w-full">
                    Tiếp tục mua sắm
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-surface dark:bg-slate-950">
      <div className="container-viewport py-6">
        <h1 className="text-3xl font-bold mb-6">Giỏ hàng</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {Object.entries(groupedByVendor).map(([vendorId, { vendor, items: vendorItems }]) => {
              const vendorItemIds = vendorItems.map(item => item.id)
              const allVendorItemsSelected = vendorItemIds.every(id => selectedItems.includes(id))
              
              return (
                <Card key={vendorId}>
                  <CardHeader className="pb-3 border-b border-border">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={allVendorItemsSelected}
                        onCheckedChange={() => toggleSelectVendor(parseInt(vendorId))}
                      />
                      <span className="text-sm font-medium">Yêu thích</span>
                      <span className="text-sm font-bold text-orange-600 bg-orange-50 dark:bg-orange-950 px-2 py-0.5 rounded">
                        {vendor.name}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-4">
                    {vendorItems.map((item) => (
                      <div key={item.id} className="flex gap-4 pb-4 border-b border-border last:border-b-0 last:pb-0">
                        <Checkbox
                          checked={selectedItems.includes(item.id)}
                          onCheckedChange={() => toggleSelectItem(item.id)}
                        />

                        <div className="relative w-20 h-20 flex-shrink-0 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                          <Image src={item.ProductVariant?.image || "/placeholder.svg"} alt={item.Product.name} fill className="object-cover" />
                        </div>

                        <div className="flex-1">
                          <h3 className="font-medium mb-1">{item.Product.name}</h3>
                          {item.ProductVariant && (
                            <p className="text-xs text-muted-foreground mb-1">
                              Phiên bản: <span className="font-medium">{item.ProductVariant.name}</span>
                            </p>
                          )}
                          <div className="flex items-baseline gap-2">
                            <span className="font-bold text-primary">{item.Product.price.toLocaleString('vi-VN')}₫</span>
                            {item.Product.originalPrice && (
                              <span className="text-xs text-muted-foreground line-through">
                                {item.Product.originalPrice.toLocaleString('vi-VN')}₫
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-4">
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-muted-foreground hover:text-destructive transition"
                          >
                            <X className="h-5 w-5" />
                          </button>

                          <div className="flex items-center border border-border rounded-lg">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="px-2 py-1 hover:bg-surface transition"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="px-4 py-1">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="px-2 py-1 hover:bg-surface transition"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <div>
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle className="text-lg">Tóm tắt</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tạm tính:</span>
                    <span>{subtotal.toLocaleString("vi-VN")}₫</span>
                  </div>
                  {savings > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span className="text-muted-foreground">Tiết kiệm:</span>
                      <span>-{savings.toLocaleString("vi-VN")}₫</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-border pt-2 font-bold">
                    <span>Tổng cộng:</span>
                    <span className="text-primary text-lg">{total.toLocaleString("vi-VN")}₫</span>
                  </div>
                </div>

                <Button disabled={selectedItems.length === 0} onClick={handleCheckout} className="w-full h-12 text-base">
                  Tiếp tục thanh toán
                </Button>

                <Link href="/">
                  <Button variant="outline" className="w-full bg-transparent">
                    Tiếp tục mua sắm
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}
