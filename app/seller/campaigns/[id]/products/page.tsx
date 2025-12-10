"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Plus, Trash2, ArrowLeft, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"

interface Campaign {
  id: number
  name: string
  type: 'percentage' | 'fixed'
  discountValue: number
  startDate: string
  endDate: string
  status?: 'draft' | 'upcoming' | 'active' | 'ended'
}

interface SellerProduct {
  id: number
  name: string
  slug: string
  price: number
  stock: number
  image: string
  ProductVariant: Array<{
    id: number
    name: string
    price: number
    stock: number
  }>
}

interface RegisteredProduct {
  id: number
  campaignId: number
  productId: number
  variantId?: number
  quantity: number
  purchasedQuantity: number
  status: 'pending' | 'approved' | 'rejected'
  Product: { id: number; name: string }
  ProductVariant?: { id: number; name: string }
}

export default function CampaignProductsPage() {
  const params = useParams()
  const router = useRouter()
  const campaignId = parseInt(params.id as string)

  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [vendorId, setVendorId] = useState<number | null>(null)
  const [products, setProducts] = useState<SellerProduct[]>([])
  const [registeredProducts, setRegisteredProducts] = useState<RegisteredProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingProductId, setEditingProductId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    productId: '',
    variantIds: [] as string[],
    quantity: '',
    variantQuantities: {} as Record<string, string>,
  })
  const { toast } = useToast()
  const { user } = useAuth()

  const formatPrice = (price?: number | null) =>
    typeof price === 'number' ? `${price.toLocaleString('vi-VN')}₫` : '--'

  const computeSalePrice = (basePrice?: number | null) => {
    if (!campaign || basePrice === undefined || basePrice === null) return { base: basePrice, sale: basePrice }
    const price = basePrice
    if (campaign.type === 'percentage') {
      return { base: price, sale: Math.max(0, price - (price * campaign.discountValue) / 100) }
    }
    if (campaign.type === 'fixed') {
      return { base: price, sale: Math.max(0, price - campaign.discountValue) }
    }
    return { base: price, sale: price }
  }

  useEffect(() => {
    fetchData()
  }, [campaignId, user])

  const fetchData = async () => {
    try {
      // Get vendor ID via auth endpoint
      const vendorResponse = await fetch('/api/seller/vendor')
      const vendorData = await vendorResponse.json()
      const vid = vendorData?.vendor?.id

      if (!vid) {
        setLoading(false)
        return
      }

      setVendorId(vid)

      // Ensure vendor registration exists (idempotent)
      try {
        await fetch('/api/seller/campaigns/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ campaignId, vendorId: vid }),
        })
      } catch (e) {
        // ignore; API already handles "already registered"
      }

      // Fetch campaign details
      const campaignResponse = await fetch(`/api/admin/campaigns?campaignId=${campaignId}`)
      const campaignData = await campaignResponse.json()
      if (campaignData.data && campaignData.data.length > 0) {
        setCampaign(campaignData.data[0])
      }

      // Fetch seller's products (auth-scoped)
      const productsResponse = await fetch('/api/seller/products')
      const productsData = await productsResponse.json()
      if (productsData.data) {
        setProducts(productsData.data)
      }

      // Fetch registered products for this campaign
      const registeredResponse = await fetch(
        `/api/seller/campaigns/products?campaignId=${campaignId}&vendorId=${vid}`
      )
      const registeredData = await registeredResponse.json()
      const normalizedRegistered = Array.isArray(registeredData)
        ? registeredData
        : Array.isArray(registeredData?.data)
        ? registeredData.data
        : []
      setRegisteredProducts(normalizedRegistered)
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể tải dữ liệu',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProduct = async () => {
    if (!vendorId) return
    if (!formData.productId) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng chọn sản phẩm',
        variant: 'destructive',
      })
      return
    }

    if (formData.variantIds.length === 0) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng chọn ít nhất một variant',
        variant: 'destructive',
      })
      return
    }

    const product = products.find((p) => p.id === parseInt(formData.productId))

    // Validate per-variant quantities and stock
    for (const vidStr of formData.variantIds) {
      const v = product?.ProductVariant.find((x) => x.id === parseInt(vidStr))
      const qty = parseInt(formData.variantQuantities?.[vidStr] || '0')
      if (!qty || qty <= 0) {
        toast({
          title: 'Lỗi',
          description: `Vui lòng nhập số lượng hợp lệ cho variant ${v?.name || ''}`,
          variant: 'destructive',
        })
        return
      }
      if (v && v.stock !== undefined && qty > v.stock) {
        toast({
          title: 'Lỗi',
          description: `Số lượng ${v.name} phải ≤ tồn (${v.stock})`,
          variant: 'destructive',
        })
        return
      }
    }

    try {
      if (editingProductId) {
        // Update quantity only for the single record (one variant)
        const targetVariantId = formData.variantIds[0]
        const qty = parseInt(formData.variantQuantities?.[targetVariantId] || '0')
        if (!qty || qty <= 0) {
          throw new Error('Vui lòng nhập số lượng hợp lệ cho variant')
        }

        const response = await fetch('/api/seller/campaigns/products', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            campaignProductId: editingProductId,
            quantity: qty,
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to update product')
        }

        toast({
          title: 'Thành công',
          description: 'Cập nhật số lượng thành công',
        })
      } else {
        // Require per-variant quantity (variants already validated above)
        const targets = formData.variantIds.map((vid) => parseInt(vid))

        for (const variantId of targets) {
          const key = variantId.toString()
          const qtyStr = formData.variantQuantities?.[key]
          const qty = parseInt(qtyStr || '0')

          const response = await fetch('/api/seller/campaigns/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              campaignId,
              vendorId,
              productId: parseInt(formData.productId),
              variantId,
              quantity: qty,
            }),
          })

          if (!response.ok) {
            const error = await response.json().catch(() => ({}))
            const message = error.error || 'Failed to add product'
            // Stop on the first non-idempotent error
            if (!message.includes('already registered')) {
              throw new Error(message)
            }
          }
        }

        toast({
          title: 'Thành công',
          description: 'Đăng ký sản phẩm thành công. Chờ admin duyệt!',
        })
      }

      setOpenDialog(false)
      setEditingProductId(null)
      setFormData({ productId: '', variantIds: [], quantity: '', variantQuantities: {} })

      fetchData()
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: error instanceof Error ? error.message : 'Không thể đăng ký sản phẩm',
        variant: 'destructive',
      })
    }
  }

  const handleRemoveProduct = async (campaignProductId: number) => {
    try {
      const response = await fetch('/api/seller/campaigns/products', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignProductId }),
      })

      if (!response.ok) throw new Error('Failed to remove')

      toast({
        title: 'Thành công',
        description: 'Xóa sản phẩm thành công',
      })

      fetchData()
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể xóa sản phẩm',
        variant: 'destructive',
      })
    }
  }

  const selectedProduct = products.find((p) => p.id === parseInt(formData.productId))
  const selectedVariants = selectedProduct?.ProductVariant || []

  if (loading) return <div className="p-6 text-center">Đang tải...</div>

  if (!campaign) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Không tìm thấy chương trình</p>
          <Button onClick={() => router.back()}>Quay lại</Button>
        </div>
      </div>
    )
  }

  return (
    <main className="p-6">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{campaign.name}</h1>
          <p className="text-muted-foreground mt-1">
            Giảm {campaign.discountValue}
            {campaign.type === 'percentage' ? '%' : ' VND'} | Từ{' '}
            {new Date(campaign.startDate).toLocaleDateString('vi-VN')} đến{' '}
            {new Date(campaign.endDate).toLocaleDateString('vi-VN')}
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Sản phẩm đã đăng ký ({registeredProducts.length})</CardTitle>
            {(!campaign.status || campaign.status === 'draft' || campaign.status === 'upcoming') ? (
              <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm sản phẩm
                  </Button>
                </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Đăng ký sản phẩm vào chương trình</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Chọn sản phẩm</Label>
                    {products.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Chưa có sản phẩm để đăng ký.</p>
                    ) : (
                      <div className="max-h-64 overflow-y-auto space-y-2 border rounded-md p-3">
                        {products.map((product) => {
                          const checked = formData.productId === product.id.toString()
                          return (
                            <label key={product.id} className="flex items-start gap-3 cursor-pointer">
                              <Checkbox
                                checked={checked}
                                disabled={!!editingProductId && !checked}
                                onCheckedChange={(val) => {
                                  if (editingProductId && !checked) return
                                  setFormData({
                                    productId: val ? product.id.toString() : '',
                                    variantIds: [],
                                    quantity: formData.quantity,
                                    variantQuantities: {},
                                  })
                                }}
                              />
                              <div>
                                <p className="font-medium">{product.name}</p>
                                {(() => {
                                  const { base, sale } = computeSalePrice(product.price)
                                  const hasSale = sale !== undefined && base !== sale
                                  return (
                                    <p className="text-xs text-muted-foreground">
                                      Giá: {formatPrice(base)}
                                      {hasSale && (
                                        <> → <span className="text-green-600 font-semibold">{formatPrice(sale)}</span></>
                                      )}
                                      {' · '}Tồn kho: {product.stock}
                                    </p>
                                  )
                                })()}
                              </div>
                            </label>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {selectedProduct && selectedVariants.length > 0 && (
                    <div>
                      <Label>Chọn variant (tùy chọn)</Label>
                      <div className="grid gap-2">
                        <label className="flex items-center gap-2">
                            <Checkbox
                              checked={
                                selectedVariants.length > 0 &&
                                formData.variantIds.length === selectedVariants.length
                              }
                              disabled={!!editingProductId}
                              onCheckedChange={(val) =>
                                setFormData({
                                  ...formData,
                                  variantIds: val
                                    ? selectedVariants.map((v) => v.id.toString())
                                    : [],
                                  variantQuantities: val
                                    ? selectedVariants.reduce((acc, v) => {
                                        acc[v.id.toString()] = formData.variantQuantities?.[v.id.toString()] || ''
                                        return acc
                                      }, {} as Record<string, string>)
                                    : {},
                                })
                              }
                            />
                          <span className="text-sm">Tất cả variant</span>
                        </label>
                        {selectedVariants.map((variant) => {
                          const { base, sale } = computeSalePrice(variant.price ?? selectedProduct.price)
                          const hasSale = sale !== undefined && base !== sale
                          return (
                          <label key={variant.id} className="flex items-center gap-2">
                            <Checkbox
                              checked={formData.variantIds.includes(variant.id.toString())}
                              disabled={!!editingProductId && !formData.variantIds.includes(variant.id.toString())}
                              onCheckedChange={(val) => {
                                const idStr = variant.id.toString()
                                if (editingProductId && !formData.variantIds.includes(idStr)) return
                                if (val) {
                                  setFormData({
                                    ...formData,
                                    variantIds: Array.from(new Set([...formData.variantIds, idStr])),
                                  })
                                } else {
                                  setFormData({
                                    ...formData,
                                    variantIds: formData.variantIds.filter((v) => v !== idStr),
                                  })
                                }
                              }}
                            />
                              <span className="text-sm">
                                {variant.name} — {formatPrice(base)}
                                {hasSale && (
                                  <> → <span className="text-green-600 font-semibold">{formatPrice(sale)}</span></>
                                )}
                                {` (Tồn: ${variant.stock})`}
                              </span>
                              {formData.variantIds.includes(variant.id.toString()) && (
                                <Input
                                  type="number"
                                  className="w-24 ml-auto"
                                  min="1"
                                  placeholder="SL"
                                  value={formData.variantQuantities?.[variant.id.toString()] || ''}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      variantQuantities: {
                                        ...(formData.variantQuantities || {}),
                                        [variant.id.toString()]: e.target.value,
                                      },
                                    })
                                  }
                                />
                              )}
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Removed global quantity input; quantities are per-variant */}

                  <Button onClick={handleSaveProduct} className="w-full">
                    {editingProductId ? 'Cập nhật' : 'Đăng ký'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            ) : (
              <p className="text-sm text-muted-foreground">
                {campaign.status === 'active' 
                  ? 'Chương trình đang diễn ra, không thể thêm sản phẩm mới' 
                  : 'Chương trình đã kết thúc, không thể thêm sản phẩm mới'}
              </p>
            )}
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4">Sản phẩm</th>
                    <th className="text-left py-3 px-4">Số lượng đăng ký</th>
                    <th className="text-left py-3 px-4">Đã bán</th>
                    <th className="text-left py-3 px-4">Trạng thái</th>
                    <th className="text-left py-3 px-4">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {registeredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">
                        Chưa có sản phẩm nào được đăng ký
                      </td>
                    </tr>
                  ) : (
                    registeredProducts.map((product) => (
                      <tr key={product.id} className="border-b border-border hover:bg-muted">
                        <td className="py-3 px-4 font-medium">
                          {product.Product.name}
                          {product.ProductVariant && ` - ${product.ProductVariant.name}`}
                        </td>
                        <td className="py-3 px-4">{product.quantity}</td>
                        <td className="py-3 px-4">{product.purchasedQuantity}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            product.status === 'approved'
                              ? 'bg-green-100 text-green-800'
                              : product.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {product.status === 'approved'
                              ? 'Đã duyệt'
                              : product.status === 'pending'
                              ? 'Chờ duyệt'
                              : 'Bị từ chối'}
                          </span>
                        </td>
                        <td className="py-3 px-4 flex gap-2">
                          {(!campaign.status || campaign.status === 'draft' || campaign.status === 'upcoming') && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-blue-600 hover:text-blue-700"
                                onClick={() => {
                                  setEditingProductId(product.id)
                                  setFormData({
                                    productId: product.productId.toString(),
                                    variantIds: product.variantId ? [product.variantId.toString()] : [],
                                    quantity: product.quantity.toString(),
                                    variantQuantities: product.variantId
                                      ? { [product.variantId.toString()]: product.quantity.toString() }
                                      : {},
                                  })
                                  setOpenDialog(true)
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-600 hover:text-red-700"
                                onClick={() => handleRemoveProduct(product.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {(campaign.status === 'active' || campaign.status === 'ended') && (
                            <span className="text-xs text-muted-foreground">Chỉ xem</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
