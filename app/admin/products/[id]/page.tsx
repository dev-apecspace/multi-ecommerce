"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Check, X, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { formatPrice } from "@/lib/utils"
import Image from "next/image"

interface ProductImage {
  id: number
  url: string
  type: string
  isMain: boolean
  order: number
}

interface ProductAttribute {
  id: number
  name: string
  ProductAttributeValue: Array<{ id: number; value: string }>
}

interface ProductVariant {
  id: number
  name: string
  description?: string
  price: number
  originalPrice?: number
  stock: number
  sku?: string
  barcode?: string
}

interface Product {
  id: number
  name: string
  description?: string
  price: number
  originalPrice?: number
  stock: number
  status: 'pending' | 'approved' | 'rejected'
  specifications?: string
  shippingInfo?: string
  warranty?: string
  createdAt: string
  Category?: { id: number; name: string; slug: string }
  SubCategory?: { id: number; name: string; slug: string }
  Vendor?: { id: number; name: string; email: string }
  ProductImage: ProductImage[]
  ProductVariant: ProductVariant[]
  ProductAttribute: ProductAttribute[]
}

export default function AdminProductDetailPage() {
  const { toast } = useToast()
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [rejectionReason, setRejectionReason] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [mainImage, setMainImage] = useState<string>("")

  useEffect(() => {
    fetchProduct()
  }, [id])

  const fetchProduct = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/products/${id}`)
      if (!response.ok) throw new Error("Failed to fetch product")
      const data = await response.json()
      setProduct(data)
      const mainImg = data.ProductImage?.find((img: ProductImage) => img.isMain)
      setMainImage(mainImg?.url || data.ProductImage?.[0]?.url || "")
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải chi tiết sản phẩm",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    if (!product) return
    try {
      setSubmitting(true)
      const response = await fetch(`/api/admin/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved" }),
      })

      if (!response.ok) throw new Error("Failed to approve")

      toast({
        title: "Thành công",
        description: `Đã phê duyệt sản phẩm: ${product.name}`,
      })
      router.push("/admin/products")
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể phê duyệt sản phẩm",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleReject = async () => {
    if (!product) return
    try {
      setSubmitting(true)
      const response = await fetch(`/api/admin/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "rejected",
          reviewNotes: rejectionReason,
        }),
      })

      if (!response.ok) throw new Error("Failed to reject")

      toast({
        title: "Thành công",
        description: `Đã từ chối sản phẩm: ${product.name}`,
      })
      router.push("/admin/products")
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể từ chối sản phẩm",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <main className="p-6">
        <p className="text-center text-muted-foreground py-8">Đang tải...</p>
      </main>
    )
  }

  if (!product) {
    return (
      <main className="p-6">
        <p className="text-center text-muted-foreground py-8">
          Không tìm thấy sản phẩm
        </p>
      </main>
    )
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      pending: { label: "Chờ duyệt", color: "bg-yellow-100 text-yellow-800" },
      approved: { label: "Đã duyệt", color: "bg-green-100 text-green-800" },
      rejected: { label: "Từ chối", color: "bg-red-100 text-red-800" },
    }
    const style = statusMap[status] || statusMap.pending
    return <span className={`${style.color} px-3 py-1 rounded-full text-sm font-medium`}>{style.label}</span>
  }

  return (
    <main className="p-6 max-w-6xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <div className="flex items-center gap-2 mt-2">
              {getStatusBadge(product.status)}
              <span className="text-sm text-muted-foreground">
                Ngày gửi: {new Date(product.createdAt).toLocaleDateString("vi-VN")}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Images */}
          <Card>
            <CardHeader>
              <CardTitle>Hình ảnh</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {mainImage && (
                <div className="relative w-full bg-gray-100 rounded-lg overflow-hidden aspect-video">
                  <Image
                    src={mainImage}
                    alt={product.name}
                    fill
                    className="object-contain"
                  />
                </div>
              )}
              {product.ProductImage.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {product.ProductImage.map((img) => (
                    <button
                      key={img.id}
                      onClick={() => setMainImage(img.url)}
                      className={`relative aspect-square rounded overflow-hidden border-2 ${
                        mainImage === img.url
                          ? "border-blue-500"
                          : "border-gray-200"
                      }`}
                    >
                      <Image
                        src={img.url}
                        alt="thumbnail"
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                Tổng: {product.ProductImage.length} ảnh
              </p>
            </CardContent>
          </Card>

          {/* Product Information */}
          <Card>
            <CardHeader>
              <CardTitle>Thông tin sản phẩm</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nhà bán hàng</p>
                  <p className="font-semibold">{product.Vendor?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {product.Vendor?.email}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Danh mục</p>
                  <p className="font-semibold">{product.Category?.name}</p>
                  {product.SubCategory && (
                    <p className="text-sm">{product.SubCategory.name}</p>
                  )}
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground mb-2">Mô tả sản phẩm</p>
                <p className="text-sm leading-relaxed">{product.description}</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Giá bán</p>
                  <p className="font-bold text-lg text-blue-600">
                    {formatPrice(product.price)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Giá gốc</p>
                  <p className="font-bold text-lg">
                    {product.originalPrice
                      ? formatPrice(product.originalPrice)
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Kho</p>
                  <p className="font-bold text-lg">{product.stock} sản phẩm</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Specifications */}
          {product.specifications && (
            <Card>
              <CardHeader>
                <CardTitle>Thông số kỹ thuật</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{product.specifications}</p>
              </CardContent>
            </Card>
          )}

          {/* Attributes & Variants */}
          {(product.ProductAttribute.length > 0 ||
            product.ProductVariant.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle>Thuộc tính và Biến thể</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="attributes" className="w-full">
                  <TabsList>
                    {product.ProductAttribute.length > 0 && (
                      <TabsTrigger value="attributes">
                        Thuộc tính ({product.ProductAttribute.length})
                      </TabsTrigger>
                    )}
                    {product.ProductVariant.length > 0 && (
                      <TabsTrigger value="variants">
                        Biến thể ({product.ProductVariant.length})
                      </TabsTrigger>
                    )}
                  </TabsList>

                  {product.ProductAttribute.length > 0 && (
                    <TabsContent value="attributes" className="space-y-4 mt-4">
                      {product.ProductAttribute.map((attr) => (
                        <div key={attr.id} className="border-b pb-3 last:border-b-0">
                          <p className="font-semibold text-sm">{attr.name}</p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {attr.ProductAttributeValue.map((val) => (
                              <span
                                key={val.id}
                                className="bg-blue-100 text-blue-800 px-3 py-1 rounded text-sm"
                              >
                                {val.value}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </TabsContent>
                  )}

                  {product.ProductVariant.length > 0 && (
                    <TabsContent value="variants" className="mt-4">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2 px-3">Tên</th>
                              <th className="text-left py-2 px-3">SKU</th>
                              <th className="text-left py-2 px-3">Giá</th>
                              <th className="text-left py-2 px-3">Giá gốc</th>
                              <th className="text-left py-2 px-3">Kho</th>
                            </tr>
                          </thead>
                          <tbody>
                            {product.ProductVariant.map((variant) => (
                              <tr key={variant.id} className="border-b">
                                <td className="py-2 px-3">{variant.name}</td>
                                <td className="py-2 px-3 text-muted-foreground">
                                  {variant.sku || "-"}
                                </td>
                                <td className="py-2 px-3 font-semibold">
                                  {formatPrice(variant.price)}
                                </td>
                                <td className="py-2 px-3">
                                  {variant.originalPrice
                                    ? formatPrice(variant.originalPrice)
                                    : "-"}
                                </td>
                                <td className="py-2 px-3">{variant.stock}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </TabsContent>
                  )}
                </Tabs>
              </CardContent>
            </Card>
          )}

          {/* Additional Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {product.shippingInfo && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Thông tin vận chuyển</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">
                    {product.shippingInfo}
                  </p>
                </CardContent>
              </Card>
            )}
            {product.warranty && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Bảo hành</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{product.warranty}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Approval Section */}
        <div className="space-y-6">
          <Card className="border-2 border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                Phê duyệt sản phẩm
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {product.status === "pending" && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">
                      Lý do từ chối (nếu có)
                    </label>
                    <Textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Nhập lý do từ chối sản phẩm..."
                      rows={4}
                      className="text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Button
                      onClick={handleApprove}
                      disabled={submitting}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Phê duyệt sản phẩm
                    </Button>
                    <Button
                      onClick={handleReject}
                      disabled={submitting}
                      variant="outline"
                      className="w-full text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Từ chối sản phẩm
                    </Button>
                  </div>
                </>
              )}

              {product.status === "approved" && (
                <div className="bg-green-100 border border-green-300 rounded p-3 text-sm text-green-800">
                  ✓ Sản phẩm đã được phê duyệt
                </div>
              )}

              {product.status === "rejected" && (
                <div className="bg-red-100 border border-red-300 rounded p-3 text-sm text-red-800">
                  ✗ Sản phẩm đã bị từ chối
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Chi tiết</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground">ID sản phẩm</p>
                <p className="font-mono">{product.id}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Ngày tạo</p>
                <p>{new Date(product.createdAt).toLocaleString("vi-VN")}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
