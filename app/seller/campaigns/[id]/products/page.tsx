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
  taxApplied?: boolean
  taxRate?: number
  taxIncluded?: boolean
  ProductVariant: Array<{
    id: number
    name: string
    price: number
    stock: number
  }>
  CampaignProduct?: Array<{
    id: number
    campaignId: number
    variantId?: number | null
    Campaign: {
      id: number
      name: string
      status: string
      startDate: string
      endDate: string
    }
  }>
}

interface RegisteredProduct {
  id: number
  campaignId: number
  productId: number
  variantId?: number | null
  quantity: number
  purchasedQuantity: number
  status: 'pending' | 'approved' | 'rejected'
  Product: { id: number; name: string; price: number; taxApplied?: boolean; taxRate?: number; taxIncluded?: boolean }
  ProductVariant?: { id: number; name: string; price?: number }
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
    selectedProducts: [] as Array<{ productId: number; variantIds: number[] }>,
    variantQuantities: {} as Record<string, string>,
  })
  const { toast } = useToast()
  const { user } = useAuth()

  const formatPrice = (price?: number | null) =>
    typeof price === 'number' ? `${price.toLocaleString('vi-VN')}₫` : '--'

  // --- Simplified: Apply discount directly on display prices ---
  const computeSalePrice = (basePrice?: number | null) => {
    if (basePrice === undefined || basePrice === null || !campaign) {
      return { displayBase: basePrice ?? 0, displaySale: basePrice ?? 0 }
    }

    const displayBase = basePrice
    let displaySale = basePrice

    if (campaign.type === 'percentage') {
      displaySale = Math.max(0, basePrice - (basePrice * campaign.discountValue) / 100)
    } else if (campaign.type === 'fixed') {
      displaySale = Math.max(0, basePrice - campaign.discountValue)
    }

    return {
      displayBase: Math.round(displayBase),
      displaySale: Math.round(displaySale)
    }
  }

  const getAvailableStock = (productId: number, variantId?: number | null): number => {
    const registeredQty = registeredProducts
      .filter(p => {
        if (p.productId !== productId) return false
        // compare variantId properly (null/undefined safe)
        if (variantId === undefined || variantId === null) {
          return p.variantId === undefined || p.variantId === null
        }
        return p.variantId === variantId
      })
      .reduce((sum, p) => sum + p.quantity, 0)

    if (variantId !== undefined && variantId !== null) {
      const product = products.find(p => p.id === productId)
      const variant = product?.ProductVariant.find(v => v.id === variantId)
      return Math.max(0, (variant?.stock || 0) - registeredQty)
    } else {
      const product = products.find(p => p.id === productId)
      return Math.max(0, (product?.stock || 0) - registeredQty)
    }
  }

  const getConflict = (productId: number, variantId: number | null) => {
    const product = products.find(p => p.id === productId)
    if (!product?.CampaignProduct || !campaign) return null

    const currentStart = new Date(campaign.startDate).getTime()
    const currentEnd = new Date(campaign.endDate).getTime()

    const conflict = product.CampaignProduct.find(cp => {
      if (cp.campaignId === campaign.id) return false
      if (!cp.Campaign || cp.Campaign.status === 'ended') return false

      // Check variant match
      if (typeof variantId === 'number') {
         if (cp.variantId !== variantId) return false
      } else {
         if (cp.variantId !== null) return false
      }

      const otherStart = new Date(cp.Campaign.startDate).getTime()
      const otherEnd = new Date(cp.Campaign.endDate).getTime()

      return (currentStart <= otherEnd && currentEnd >= otherStart)
    })

    return conflict ? conflict.Campaign.name : null
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
    if (formData.selectedProducts.length === 0) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng chọn ít nhất một sản phẩm',
        variant: 'destructive',
      })
      return
    }

    // Validate all selected products have variants and quantities
    for (const item of formData.selectedProducts) {
      // If product has variants in product list, require at least one variant selected
      const productDef = products.find(p => p.id === item.productId)
      const hasVariants = (productDef?.ProductVariant?.length || 0) > 0
      if (hasVariants && item.variantIds.length === 0) {
        const product = productDef
        toast({
          title: 'Lỗi',
          description: `${product?.name || 'Sản phẩm'}: vui lòng chọn ít nhất một variant`,
          variant: 'destructive',
        })
        return
      }

      // Validate quantities for each variant OR for product without variant
      if (hasVariants) {
        for (const variantId of item.variantIds) {
          const key = `${item.productId}-${variantId}`
          const qty = parseInt(formData.variantQuantities?.[key] || '0')
          if (!qty || qty <= 0) {
            const product = products.find(p => p.id === item.productId)
            const variant = product?.ProductVariant.find(v => v.id === variantId)
            toast({
              title: 'Lỗi',
              description: `${product?.name} - ${variant?.name}: nhập số lượng hợp lệ`,
              variant: 'destructive',
            })
            return
          }

          const product = products.find(p => p.id === item.productId)
          const variant = product?.ProductVariant.find(v => v.id === variantId)
          const availableStock = getAvailableStock(item.productId, variantId)
          if (availableStock < qty) {
            toast({
              title: 'Lỗi',
              description: `${product?.name} - ${variant?.name}: số lượng phải ≤ tồn kho (${availableStock})`,
              variant: 'destructive',
            })
            return
          }
        }
      } else {
        // product without variants: expect key `${productId}-0`
        const key = `${item.productId}-0`
        const qty = parseInt(formData.variantQuantities?.[key] || '0')
        if (!qty || qty <= 0) {
          const product = products.find(p => p.id === item.productId)
          toast({
            title: 'Lỗi',
            description: `${product?.name}: nhập số lượng hợp lệ`,
            variant: 'destructive',
          })
          return
        }

        const availableStock = getAvailableStock(item.productId, null)
        if (availableStock < qty) {
          const product = products.find(p => p.id === item.productId)
          toast({
            title: 'Lỗi',
            description: `${product?.name}: số lượng phải ≤ tồn kho (${availableStock})`,
            variant: 'destructive',
          })
          return
        }
      }
    }

    try {
      if (editingProductId) {
        // Update quantity for the single product being edited
        const item = formData.selectedProducts[0]
        const variantId = item.variantIds?.[0] ?? null
        const key = variantId ? `${item.productId}-${variantId}` : `${item.productId}-0`
        const qty = parseInt(formData.variantQuantities?.[key] || '0')

        const response = await fetch('/api/seller/campaigns/products', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            campaignProductId: editingProductId,
            quantity: qty,
            variantId: variantId, // backend may ignore null
          }),
        })

        if (!response.ok) {
          const error = await response.json().catch(() => ({}))
          throw new Error(error.error || 'Failed to update product')
        }

        toast({
          title: 'Thành công',
          description: 'Cập nhật sản phẩm thành công',
        })
      } else {
        // Add multiple products
        for (const item of formData.selectedProducts) {
          const productDef = products.find(p => p.id === item.productId)
          const hasVariants = (productDef?.ProductVariant?.length || 0) > 0

          if (hasVariants) {
            for (const variantId of item.variantIds) {
              const key = `${item.productId}-${variantId}`
              const qty = parseInt(formData.variantQuantities?.[key] || '0')

              const response = await fetch('/api/seller/campaigns/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  campaignId,
                  vendorId,
                  productId: item.productId,
                  variantId,
                  quantity: qty,
                }),
              })

              if (!response.ok) {
                const error = await response.json().catch(() => ({}))
                const message = error.error || 'Failed to add product'
                if (!message.includes('already registered')) {
                  throw new Error(message)
                }
              }
            }
          } else {
            // product without variant
            const key = `${item.productId}-0`
            const qty = parseInt(formData.variantQuantities?.[key] || '0')
            const response = await fetch('/api/seller/campaigns/products', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                campaignId,
                vendorId,
                productId: item.productId,
                variantId: null,
                quantity: qty,
              }),
            })

            if (!response.ok) {
              const error = await response.json().catch(() => ({}))
              const message = error.error || 'Failed to add product'
              if (!message.includes('already registered')) {
                throw new Error(message)
              }
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
      setFormData({ selectedProducts: [], variantQuantities: {} })

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

  const handleResetDialog = () => {
    setOpenDialog(false)
    setEditingProductId(null)
    setFormData({ selectedProducts: [], variantQuantities: {} })
  }

  const toggleProductSelection = (productId: number) => {
    setFormData(prev => {
      const existing = prev.selectedProducts.find(p => p.productId === productId)
      if (existing) {
        return {
          ...prev,
          selectedProducts: prev.selectedProducts.filter(p => p.productId !== productId)
        }
      } else {
        return {
          ...prev,
          selectedProducts: [...prev.selectedProducts, { productId, variantIds: [] }]
        }
      }
    })
  }

  const toggleVariantSelection = (productId: number, variantId: number) => {
    setFormData(prev => {
      const updated = prev.selectedProducts.map(item => {
        if (item.productId === productId) {
          const hasVariant = item.variantIds.includes(variantId)
          return {
            ...item,
            variantIds: hasVariant
              ? item.variantIds.filter(v => v !== variantId)
              : [...item.variantIds, variantId]
          }
        }
        return item
      })
      return { ...prev, selectedProducts: updated }
    })
  }

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
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingProductId ? 'Cập nhật sản phẩm' : 'Đăng ký sản phẩm vào chương trình'}</DialogTitle>
                  <DialogDescription>
                    {editingProductId ? 'Chỉnh sửa số lượng sản phẩm' : 'Chọn một hoặc nhiều sản phẩm cùng variant'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-3">
                    <Label>Chọn sản phẩm và variant</Label>
                    {products.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Chưa có sản phẩm để đăng ký.</p>
                    ) : (
                      <div className="space-y-3 border rounded-md p-3 max-h-96 overflow-y-auto">
                        {products.map((product) => {
                          const isSelected = formData.selectedProducts.some(p => p.productId === product.id)
                          const selectedItem = formData.selectedProducts.find(p => p.productId === product.id)
                          const { displayBase, displaySale } = computeSalePrice(product.price)
                          const hasSale = displaySale !== undefined && displayBase !== displaySale
                          const availableStock = getAvailableStock(product.id)
                          const productConflict = product.ProductVariant.length === 0 ? getConflict(product.id, null) : null

                          return (
                            <div key={product.id} className={`border rounded-lg p-3 space-y-3 ${productConflict ? 'bg-gray-50 opacity-75' : ''}`}>
                              <label className="flex items-start gap-3 cursor-pointer">
                                <Checkbox
                                  checked={isSelected}
                                  disabled={(!!editingProductId && !isSelected) || !!productConflict}
                                  onCheckedChange={() => {
                                    if ((editingProductId && !isSelected) || productConflict) return
                                    toggleProductSelection(product.id)
                                  }}
                                />
                                <div className="flex-1">
                                  <div className="flex gap-3">
                                    {product.image && (
                                      <img 
                                        src={product.image} 
                                        alt={product.name}
                                        className="w-16 h-16 object-cover rounded border"
                                      />
                                    )}
                                    <div>
                                      <p className="font-medium">{product.name}</p>
                                      <p className="text-xs">
                                        <span className={hasSale ? "text-green-600 font-semibold" : "text-muted-foreground"}>
                                          {hasSale ? formatPrice(displaySale) : formatPrice(displayBase)}
                                        </span>
                                        {hasSale && (
                                          <span className="text-muted-foreground line-through ml-1">{formatPrice(displayBase)}</span>
                                        )}
                                        {' · '}Tồn kho: {availableStock}
                                      </p>
                                      {product.taxApplied && product.taxRate && (
                                        <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                                          (Đã bao gồm thuế {product.taxRate}%)
                                        </p>
                                      )}
                                      {productConflict && (
                                        <p className="text-xs text-red-600 font-medium mt-1">
                                          Đã tham gia: {productConflict}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </label>

                              {isSelected && product.ProductVariant.length > 0 && (
                                <div className="ml-7 space-y-2 border-t pt-2">
                                  <p className="text-xs font-medium">Chọn variant:</p>
                                  {product.ProductVariant.map((variant) => {
                                    const { displayBase: variantBase, displaySale: variantSale } = computeSalePrice(variant.price ?? product.price)
                                    const variantHasSale = variantSale !== undefined && variantBase !== variantSale
                                    const variantAvailableStock = getAvailableStock(product.id, variant.id)
                                    const isVariantSelected = selectedItem?.variantIds.includes(variant.id) || false
                                    const quantityKey = `${product.id}-${variant.id}`
                                    const variantConflict = getConflict(product.id, variant.id)

                                    return (
                                      <div key={variant.id} className="space-y-1">
                                        <label className="flex items-center gap-2">
                                          <Checkbox
                                            checked={isVariantSelected}
                                            disabled={(!!editingProductId && !isVariantSelected) || !!variantConflict}
                                            onCheckedChange={() => {
                                              if ((editingProductId && !isVariantSelected) || variantConflict) return
                                              toggleVariantSelection(product.id, variant.id)
                                            }}
                                          />
                                          <span className={`text-sm flex-1 ${variantConflict ? 'text-muted-foreground' : ''}`}>
                                            {variant.name}{' '}
                                            <span className={variantHasSale ? "text-green-600 font-semibold" : "text-muted-foreground"}>
                                              {variantHasSale ? formatPrice(variantSale) : formatPrice(variantBase)}
                                            </span>
                                            {variantHasSale && (
                                              <span className="text-muted-foreground line-through ml-1">{formatPrice(variantBase)}</span>
                                            )}
                                            {` (Tồn: ${variantAvailableStock})`}
                                            {variantConflict && (
                                              <span className="text-red-600 ml-2 text-xs">
                                                (Đã tham gia: {variantConflict})
                                              </span>
                                            )}
                                          </span>
                                          {isVariantSelected && (
                                            <Input
                                              type="number"
                                              className="w-20"
                                              min="1"
                                              placeholder="SL"
                                              value={formData.variantQuantities?.[quantityKey] || ''}
                                              onChange={(e) =>
                                                setFormData({
                                                  ...formData,
                                                  variantQuantities: {
                                                    ...(formData.variantQuantities || {}),
                                                    [quantityKey]: e.target.value,
                                                  },
                                                })
                                              }
                                            />
                                          )}
                                        </label>
                                        {product.taxApplied && product.taxRate && isVariantSelected && (
                                          <p className="text-xs text-amber-600 dark:text-amber-400 font-medium ml-7">
                                            (Đã bao gồm thuế {product.taxRate}%)
                                          </p>
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              )}

                              {isSelected && product.ProductVariant.length === 0 && (
                                <div className="ml-7 space-y-1">
                                  <p className="text-xs text-muted-foreground">Sản phẩm này không có variant</p>
                                  <div className="mt-2">
                                    <Input
                                      type="number"
                                      className="w-28"
                                      min="1"
                                      placeholder="SL"
                                      value={formData.variantQuantities?.[`${product.id}-0`] || ''}
                                      onChange={(e) =>
                                        setFormData({
                                          ...formData,
                                          variantQuantities: {
                                            ...(formData.variantQuantities || {}),
                                            [`${product.id}-0`]: e.target.value,
                                          },
                                        })
                                      }
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-4 border-t">
                    <Button onClick={handleSaveProduct} className="flex-1">
                      {editingProductId ? 'Cập nhật' : 'Đăng ký'}
                    </Button>
                    <Button variant="outline" onClick={handleResetDialog} className="flex-1">
                      Hủy
                    </Button>
                  </div>
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
                    registeredProducts.map((product) => {
                      const basePrice = product.ProductVariant?.price ?? product.Product.price
                      const { displaySale } = computeSalePrice(basePrice)
                      return (
                      <tr key={product.id} className="border-b border-border hover:bg-muted">
                        <td className="py-3 px-4 font-medium">
                          <div>
                            <p>{product.Product.name}</p>
                            {product.ProductVariant && <p className="text-xs text-muted-foreground">{product.ProductVariant.name}</p>}
                            <p className="text-xs text-green-600 font-semibold">{formatPrice(displaySale)}</p>
                          </div>
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
                                  const quantityKey = product.variantId 
                                    ? `${product.productId}-${product.variantId}`
                                    : `${product.productId}-0`
                                  setFormData({
                                    selectedProducts: product.variantId 
                                      ? [{ productId: product.productId, variantIds: [product.variantId] }]
                                      : [{ productId: product.productId, variantIds: [] }],
                                    variantQuantities: {
                                      [quantityKey]: product.quantity.toString()
                                    },
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
                      )
                    })
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
