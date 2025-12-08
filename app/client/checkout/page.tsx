"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Check, MapPin } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import { useCart } from "@/lib/cart-context"
import { CheckoutAddressDialog } from "@/components/client/checkout-address-dialog"

interface CheckoutItem {
  id: number
  productId: number
  productName: string
  quantity: number
  price: number
  image: string
  variantId: number | null
  vendorId: number
  vendorName: string
}

interface Address {
  id: number
  label: string
  fullName: string
  phone: string
  street: string
  ward: string
  district: string
  city: string
  postalCode?: string
  isDefault: boolean
}

export default function CheckoutPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const { refetchCart } = useCart()
  const [step, setStep] = useState<"shipping" | "payment" | "review" | "success">("shipping")
  const [cartItems, setCartItems] = useState<CheckoutItem[]>([])
  const [userId, setUserId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    street: "",
    ward: "",
    district: "",
    city: "",
    shippingMethod: "express",
    paymentMethod: "cod",
  })
  const [isEditingManually, setIsEditingManually] = useState(false)

  useEffect(() => {
    if (user?.id) {
      setUserId(user.id)
      
      fetch(`/api/addresses?userId=${user.id}`)
        .then(res => res.json())
        .then(data => {
          const addrList = Array.isArray(data) ? data : []
          setAddresses(addrList)
          
          const defaultAddr = addrList.find((a: Address) => a.isDefault)
          if (defaultAddr) {
            setSelectedAddressId(defaultAddr.id)
            setFormData(prev => ({
              ...prev,
              fullName: defaultAddr.fullName,
              phone: defaultAddr.phone,
              street: defaultAddr.street,
              ward: defaultAddr.ward,
              district: defaultAddr.district,
              city: defaultAddr.city,
            }))
          }
        })
        .catch(error => console.error('Failed to fetch addresses:', error))
    } else {
      const storedUserId = localStorage.getItem('userId')
      if (storedUserId) {
        const numUserId = parseInt(storedUserId)
        setUserId(numUserId)
        
        fetch(`/api/addresses?userId=${numUserId}`)
          .then(res => res.json())
          .then(data => {
            const addrList = Array.isArray(data) ? data : []
            setAddresses(addrList)
            
            const defaultAddr = addrList.find((a: Address) => a.isDefault)
            if (defaultAddr) {
              setSelectedAddressId(defaultAddr.id)
              setFormData(prev => ({
                ...prev,
                fullName: defaultAddr.fullName,
                phone: defaultAddr.phone,
                street: defaultAddr.street,
                ward: defaultAddr.ward,
                district: defaultAddr.district,
                city: defaultAddr.city,
              }))
            }
          })
          .catch(error => console.error('Failed to fetch addresses:', error))
      }
    }
    
    const checkoutItemsJson = sessionStorage.getItem('checkoutItems')
    if (checkoutItemsJson) {
      try {
        const items = JSON.parse(checkoutItemsJson)
        setCartItems(items)
      } catch (error) {
        toast({ title: 'Lỗi', description: 'Không thể tải thông tin thanh toán', variant: 'destructive' })
        router.push('/client/cart')
      }
    } else {
      router.push('/client/cart')
    }
  }, [user])

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: prev.fullName || user.name || "",
        phone: prev.phone || user.phone || ""
      }))
    }
  }, [user])

  const handleSelectAddress = (address: Address) => {
    setSelectedAddressId(address.id)
    setFormData({
      fullName: address.fullName,
      phone: address.phone,
      street: address.street,
      ward: address.ward,
      district: address.district,
      city: address.city,
      shippingMethod: formData.shippingMethod,
      paymentMethod: formData.paymentMethod,
    })
  }

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open)
  }

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const shippingCostPerVendor = formData.shippingMethod === "express" ? 30000 : 10000
  const uniqueVendors = new Set(cartItems.map(item => item.vendorId)).size
  const totalShippingCost = shippingCostPerVendor * uniqueVendors
  const total = subtotal + totalShippingCost

  const handleSubmit = async () => {
    if (step === "shipping") {
      if (!formData.fullName || !formData.phone || !formData.street) {
        toast({
          title: "Lỗi",
          description: "Vui lòng điền đầy đủ thông tin giao hàng",
          variant: "destructive",
        })
        return
      }
      setStep("payment")
    } else if (step === "payment") {
      setStep("review")
    } else if (step === "review") {
      if (!userId) {
        toast({ title: 'Lỗi', description: 'Vui lòng đăng nhập', variant: 'destructive' })
        return
      }

      setLoading(true)
      try {
        const response = await fetch('/api/client/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            cartItems: cartItems.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              vendorId: item.vendorId,
              variantId: item.variantId
            })),
            shippingAddress: {
              fullName: formData.fullName,
              phone: formData.phone,
              street: formData.street,
              ward: formData.ward,
              district: formData.district,
              city: formData.city
            },
            paymentMethod: formData.paymentMethod,
            shippingMethod: formData.shippingMethod,
            estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
          })
        })

        if (!response.ok) {
          throw new Error('Failed to create order')
        }

        sessionStorage.removeItem('checkoutItems')
        await refetchCart()
        toast({ title: 'Thành công', description: 'Đơn hàng của bạn đã được đặt' })
        setStep("success")
      } catch (error) {
        toast({ title: 'Lỗi', description: 'Không thể tạo đơn hàng', variant: 'destructive' })
      } finally {
        setLoading(false)
      }
    }
  }

  if (step === "success") {
    return (
      <main className="min-h-screen bg-surface dark:bg-slate-950">
        <div className="container-viewport py-12">
          <div className="max-w-md mx-auto">
            <Card className="p-8">
              <CardContent className="p-0 text-center space-y-6">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto">
                  <Check className="h-10 w-10 text-green-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold mb-2">Đặt hàng thành công!</h1>
                  <p className="text-muted-foreground">Đơn hàng của bạn đã được xác nhận</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg text-sm">
                  <p className="font-medium text-blue-900 dark:text-blue-100">
                    Kiểm tra lịch sử đơn hàng để theo dõi trạng thái
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link href="/client/order-history" className="flex-1">
                    <Button className="w-full">Xem đơn hàng</Button>
                  </Link>
                  <Link href="/" className="flex-1">
                    <Button variant="outline" className="w-full">Tiếp tục mua sắm</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    )
  }

  if (cartItems.length === 0) {
    return (
      <main className="min-h-screen bg-surface dark:bg-slate-950">
        <div className="container-viewport py-12 text-center">
          <p>Đang tải...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-surface dark:bg-slate-950">
      <div className="container-viewport py-6">
        <h1 className="text-3xl font-bold mb-8">Thanh toán</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex gap-4 mb-8">
              {["shipping", "payment", "review"].map((s, idx) => (
                <div
                  key={s}
                  className={`flex-1 flex items-center gap-2 p-3 rounded-lg border transition-all ${
                    step === s
                      ? "bg-primary/10 border-primary"
                      : ["shipping", "payment", "review"].indexOf(step) > idx
                        ? "bg-green-50 dark:bg-green-950 border-green-300"
                        : "border-border"
                  }`}
                >
                  <div className="text-sm font-medium">
                    {idx + 1}. {s === "shipping" ? "Giao hàng" : s === "payment" ? "Thanh toán" : "Kiểm tra"}
                  </div>
                </div>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>
                  {step === "shipping" && "Địa chỉ giao hàng"}
                  {step === "payment" && "Phương thức thanh toán"}
                  {step === "review" && "Kiểm tra đơn hàng"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {step === "shipping" && (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-blue-50 to-blue-50 dark:from-blue-950 dark:to-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            {formData.fullName ? (
                              <>
                                <p className="font-semibold text-sm">{formData.fullName}</p>
                                <p className="text-sm text-muted-foreground">{formData.phone}</p>
                                <p className="text-sm text-muted-foreground">
                                  {formData.street}, {formData.ward}, {formData.district}, {formData.city}
                                </p>
                              </>
                            ) : (
                              <p className="text-sm text-muted-foreground italic">Chưa chọn địa chỉ</p>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDialogOpen(true)}
                          className="flex-shrink-0"
                        >
                          Đổi địa chỉ
                        </Button>
                      </div>
                    </div>



                    <div className="border-t border-border pt-4 space-y-3">
                      <p className="font-semibold">Hình thức giao hàng</p>
                      <RadioGroup
                        value={formData.shippingMethod}
                        onValueChange={(val) => setFormData({ ...formData, shippingMethod: val })}
                      >
                        <div className="flex items-center space-x-2 p-3 border rounded-lg">
                          <RadioGroupItem value="express" id="express" />
                          <Label htmlFor="express" className="flex-1 cursor-pointer">
                            <div className="font-medium">Giao nhanh 2-3 giờ</div>
                            <div className="text-sm text-muted-foreground">30.000₫</div>
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 p-3 border rounded-lg">
                          <RadioGroupItem value="standard" id="standard" />
                          <Label htmlFor="standard" className="flex-1 cursor-pointer">
                            <div className="font-medium">Giao tiêu chuẩn 1-3 ngày</div>
                            <div className="text-sm text-muted-foreground">10.000₫</div>
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                )}

                {step === "payment" && (
                  <div className="space-y-4">
                    <p className="font-semibold">Chọn phương thức thanh toán</p>
                    <RadioGroup
                      value={formData.paymentMethod}
                      onValueChange={(val) => setFormData({ ...formData, paymentMethod: val })}
                    >
                      <div className="flex items-center space-x-2 p-3 border rounded-lg">
                        <RadioGroupItem value="cod" id="cod" />
                        <Label htmlFor="cod" className="flex-1 cursor-pointer">
                          <div className="font-medium">Thanh toán khi nhận hàng (COD)</div>
                          <div className="text-sm text-muted-foreground">Thanh toán tiền mặt khi nhận hàng</div>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 p-3 border rounded-lg">
                        <RadioGroupItem value="bank" id="bank" />
                        <Label htmlFor="bank" className="flex-1 cursor-pointer">
                          <div className="font-medium">Chuyển khoản ngân hàng</div>
                          <div className="text-sm text-muted-foreground">Chuyển khoản trước khi giao hàng</div>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 p-3 border rounded-lg">
                        <RadioGroupItem value="wallet" id="wallet" />
                        <Label htmlFor="wallet" className="flex-1 cursor-pointer">
                          <div className="font-medium">Ví điện tử</div>
                          <div className="text-sm text-muted-foreground">Sử dụng ví TMĐT</div>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                )}

                {step === "review" && (
                  <div className="space-y-4">
                    <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        Kiểm tra lại thông tin trước khi đặt hàng
                      </p>
                    </div>
                    <div className="border-b border-border pb-3">
                      <p className="font-semibold mb-2">Địa chỉ giao hàng</p>
                      <p className="text-sm">
                        {formData.fullName} | {formData.phone}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formData.street}, {formData.ward}, {formData.district}, {formData.city}
                      </p>
                    </div>
                    <div className="border-b border-border pb-3">
                      <p className="font-semibold mb-2">Phương thức thanh toán</p>
                      <p className="text-sm">
                        {formData.paymentMethod === "cod"
                          ? "Thanh toán khi nhận hàng"
                          : formData.paymentMethod === "bank"
                            ? "Chuyển khoản ngân hàng"
                            : "Ví điện tử"}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex gap-3">
              {step !== "shipping" && (
                <Button variant="outline" onClick={() => setStep(step === "payment" ? "shipping" : "payment")} disabled={loading}>
                  Quay lại
                </Button>
              )}
              <Button className="flex-1" onClick={handleSubmit} disabled={loading}>
                {loading ? "Đang xử lý..." : step === "review" ? "Đặt hàng" : "Tiếp tục"}
              </Button>
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle className="text-lg">Tóm tắt đơn hàng</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {Object.entries(
                    cartItems.reduce((acc, item) => {
                      if (!acc[item.vendorId]) {
                        acc[item.vendorId] = { vendorName: item.vendorName, items: [] }
                      }
                      acc[item.vendorId].items.push(item)
                      return acc
                    }, {} as Record<number, { vendorName: string; items: CheckoutItem[] }>)
                  ).map(([vendorId, { vendorName, items: vendorItems }]) => (
                    <div key={vendorId} className="pb-4 border-b border-border last:border-b-0 last:pb-0">
                      <p className="text-sm font-bold text-orange-600 bg-orange-50 dark:bg-orange-950 px-2 py-1 rounded mb-3 inline-block">
                        {vendorName}
                      </p>
                      <div className="space-y-3">
                        {vendorItems.map((item) => (
                          <div key={item.id} className="flex gap-3">
                            <div className="relative w-16 h-16 flex-shrink-0 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
                              <Image
                                src={item.image || "/placeholder.svg"}
                                alt={item.productName}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div className="flex-1 flex justify-between text-sm">
                              <div>
                                <p className="font-medium line-clamp-2">{item.productName}</p>
                                <p className="text-xs text-muted-foreground">x{item.quantity}</p>
                              </div>
                              <p className="font-medium text-right">{(item.price * item.quantity).toLocaleString("vi-VN")}₫</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 text-sm border-t border-border pt-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tạm tính</span>
                    <span>{subtotal.toLocaleString("vi-VN")}₫</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Vận chuyển ({uniqueVendors} shop)</span>
                    <span>{totalShippingCost.toLocaleString("vi-VN")}₫</span>
                  </div>
                  <div className="flex justify-between font-bold text-base border-t border-border pt-3">
                    <span>Tổng cộng</span>
                    <span className="text-primary">{total.toLocaleString("vi-VN")}₫</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <CheckoutAddressDialog
          userId={userId}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          selectedAddressId={selectedAddressId}
          onSelectAddress={handleSelectAddress}
        />
      </div>
    </main>
  )
}
