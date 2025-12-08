"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Edit, Copy, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"
import { formatPrice } from "@/lib/utils"

interface ProductVariant {
  id: number
  name: string
  description?: string
  originalPrice?: number
  price: number
  image?: string
  stock: number
  createdAt: string
  updatedAt: string
}

interface ProductImage {
  id: number
  image: string
  isMain?: boolean
  order?: number
  mediaType?: 'image' | 'video'
  createdAt: string
  updatedAt: string
}

interface Product {
  id: number
  name: string
  description: string
  price: number
  originalPrice?: number
  image: string
  stock: number
  sold: number
  rating: number
  status: 'pending' | 'approved' | 'rejected'
  categoryId: number
  subcategoryId: number
  warranty?: string
  shippingInfo?: string
  specifications?: string
  createdAt: string
  updatedAt: string
  Category?: { name: string; slug: string }
  SubCategory?: { name: string; slug: string }
  Vendor?: { name: string }
  ProductVariant?: ProductVariant[]
  ProductImage?: ProductImage[]
}

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const productId = params.id as string
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [duplicating, setDuplicating] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string>("")

  useEffect(() => {
    fetchProduct()
  }, [productId])

  const fetchProduct = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/seller/products/${productId}`, {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Không thể tải sản phẩm')
      }

      const data = await response.json()
      setProduct(data)
      
      if (data.ProductImage && data.ProductImage.length > 0) {
        const mainImage = data.ProductImage.find((img: ProductImage) => img.isMain)?.image || data.ProductImage[0].image
        setSelectedImage(mainImage)
      } else if (data.image) {
        setSelectedImage(data.image)
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Không thể tải sản phẩm",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Bạn chắc chắn muốn xóa sản phẩm này?')) return

    try {
      setDeleting(true)
      const response = await fetch(`/api/seller/products/${productId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Không thể xóa sản phẩm')
      }

      toast({
        title: "Thành công",
        description: "Sản phẩm đã được xóa",
      })

      router.push('/seller/products')
    } catch (error) {
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Không thể xóa sản phẩm",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
    }
  }

  const handleDuplicate = async () => {
    try {
      setDuplicating(true)
      const response = await fetch(`/api/seller/products/${productId}/duplicate`, {
        method: 'POST',
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Không thể nhân bản sản phẩm')
      }

      const data = await response.json()
      toast({
        title: "Thành công",
        description: "Sản phẩm đã được nhân bản",
      })

      router.push(`/seller/products/${data.id}`)
    } catch (error) {
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Không thể nhân bản sản phẩm",
        variant: "destructive",
      })
    } finally {
      setDuplicating(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      pending: { label: 'Chờ duyệt', color: 'bg-yellow-100 text-yellow-800' },
      approved: { label: 'Đã duyệt', color: 'bg-green-100 text-green-800' },
      rejected: { label: 'Từ chối', color: 'bg-red-100 text-red-800' },
    }
    const style = statusMap[status] || statusMap.pending
    return <span className={`${style.color} px-3 py-1 rounded text-sm font-medium`}>{style.label}</span>
  }

  if (loading) {
    return (
      <main className="p-6">
        <p className="text-center">Đang tải sản phẩm...</p>
      </main>
    )
  }

  if (!product) {
    return (
      <main className="p-6">
        <div className="text-center">
          <p className="text-destructive mb-4">Không tìm thấy sản phẩm</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
        </div>
      </main>
    )
  }

  const discount = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0

  return (
    <main className="p-6">
      <div className="flex items-center gap-4 mb-8">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">Chi tiết sản phẩm</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">{product.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-2">{product.Category?.name} / {product.SubCategory?.name}</p>
                </div>
                {getStatusBadge(product.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {selectedImage && (
                <div className="relative w-full h-64 bg-muted rounded-lg overflow-hidden">
                  {product.ProductImage?.find(img => img.image === selectedImage)?.mediaType === 'video' ? (
                    <video
                      src={selectedImage}
                      controls
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <Image
                      src={selectedImage}
                      alt={product.name}
                      fill
                      className="object-contain"
                    />
                  )}
                </div>
              )}

              {product.ProductImage && product.ProductImage.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {product.ProductImage.map((img) => (
                    <button
                      key={img.id}
                      onClick={() => setSelectedImage(img.image)}
                      className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                        selectedImage === img.image ? 'border-orange-600' : 'border-border'
                      }`}
                    >
                      {img.mediaType === 'video' ? (
                        <video
                          src={img.image}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Image
                          src={img.image}
                          alt={`Thumbnail ${img.id}`}
                          fill
                          className="object-cover"
                        />
                      )}
                      {img.isMain && (
                        <div className="absolute top-0 right-0 bg-orange-600 text-white text-xs px-1 font-semibold">
                          Chính
                        </div>
                      )}
                      {img.mediaType === 'video' && (
                        <div className="absolute bottom-0 left-0 bg-black/70 text-white text-xs px-1 font-semibold">
                          🎬
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}

              <div>
                <h3 className="font-semibold mb-2">Mô tả sản phẩm</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{product.description || 'Không có mô tả'}</p>
              </div>

              {product.specifications && (
                <div>
                  <h3 className="font-semibold mb-2">Thông số kỹ thuật</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{product.specifications}</p>
                </div>
              )}

              {product.warranty && (
                <div>
                  <h3 className="font-semibold mb-2">Bảo hành</h3>
                  <p className="text-sm text-muted-foreground">{product.warranty}</p>
                </div>
              )}

              {product.shippingInfo && (
                <div>
                  <h3 className="font-semibold mb-2">Thông tin vận chuyển</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{product.shippingInfo}</p>
                </div>
              )}

              {product.ProductVariant && product.ProductVariant.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Thuộc tính sản phẩm</h3>
                  <div className="space-y-3">
                    {product.ProductVariant.map((variant) => (
                      <div key={variant.id} className="border rounded p-3 bg-slate-50">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{variant.name}</p>
                            {variant.description && (
                              <p className="text-sm text-muted-foreground">{variant.description}</p>
                            )}
                            <div className="flex gap-4 mt-2 text-sm">
                              <span className="text-orange-600 font-semibold">{formatPrice(variant.price)}</span>
                              {variant.originalPrice && (
                                <span className="line-through text-muted-foreground">{formatPrice(variant.originalPrice)}</span>
                              )}
                              <span className="text-muted-foreground">Kho: {variant.stock}</span>
                            </div>
                          </div>
                          {variant.image && (
                            <div className="relative w-16 h-16 bg-muted rounded overflow-hidden flex-shrink-0">
                              <Image
                                src={variant.image}
                                alt={variant.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin giá</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Giá bán</p>
                <p className="text-2xl font-bold text-orange-600">{formatPrice(product.price)}</p>
              </div>
              {product.originalPrice && (
                <div>
                  <p className="text-sm text-muted-foreground">Giá gốc</p>
                  <p className="text-sm line-through">{formatPrice(product.originalPrice)}</p>
                  {discount > 0 && (
                    <p className="text-sm text-red-600 font-semibold">Giảm {discount}%</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Thông tin hàng</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Tồn kho</p>
                <p className="text-lg font-semibold">{product.stock} sản phẩm</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Đã bán</p>
                <p className="text-lg font-semibold">{product.sold} sản phẩm</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Đánh giá</p>
                <p className="text-lg font-semibold">⭐ {product.rating.toFixed(1)}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Hành động</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={() => router.push(`/seller/products/${product.id}/edit`)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Sửa
              </Button>
              <Button 
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={handleDuplicate}
                disabled={duplicating}
              >
                <Copy className="h-4 w-4 mr-2" />
                {duplicating ? "Đang nhân bản..." : "Nhân bản"}
              </Button>
              <Button 
                className="w-full bg-red-600 hover:bg-red-700"
                onClick={handleDelete}
                disabled={deleting}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {deleting ? "Đang xóa..." : "Xóa"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
