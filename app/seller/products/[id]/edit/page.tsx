"use client"

import { Save, ArrowLeft, Plus, Trash2 } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { ProductImageUpload } from "@/components/product-image-upload"
import { ProductMultiImageUpload } from "@/components/product-multi-image-upload"
import Image from "next/image"

interface Category {
  id: number
  name: string
  slug: string
  SubCategory?: SubCategory[]
}

interface SubCategory {
  id: number
  name: string
  slug: string
  categoryId: number
}

interface ProductImage {
  id?: number
  url: string
  image?: string
  isMain?: boolean
  mediaType?: 'image' | 'video'
}

interface ProductVariant {
  id?: number
  name: string
  description?: string
  originalPrice?: number | string
  price: number | string
  image?: string
  stock: number | string
  deleted?: boolean
}

interface Product {
  id: number
  name: string
  description: string
  price: number
  originalPrice?: number
  image: string
  categoryId: number
  subcategoryId: number
  stock: number
  specifications?: string
  shippingInfo?: string
  warranty?: string

  status: 'pending' | 'approved' | 'rejected'
  ProductVariant?: ProductVariant[]
}

export default function EditProductPage() {
  const params = useParams()
  const productId = params.id as string
  const { toast } = useToast()
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [subcategories, setSubcategories] = useState<SubCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    categoryId: "",
    subcategoryId: "",
    price: "",
    originalPrice: "",
    stock: "",
    description: "",
    image: "",
    specifications: "",
    shippingInfo: "",
    warranty: "",

  })
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [currentImage, setCurrentImage] = useState<string>("")
  const [productImages, setProductImages] = useState<ProductImage[]>([])

  useEffect(() => {
    const init = async () => {
      await Promise.all([fetchCategories(), fetchProduct()])
    }
    init()
  }, [productId])

  useEffect(() => {
    if (formData.categoryId && categories.length > 0) {
      const category = categories.find(c => c.id === parseInt(formData.categoryId))
      if (category?.SubCategory) {
        setSubcategories(category.SubCategory)
      }
    }
  }, [formData.categoryId, categories])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories?withSubcategories=true')
      const result = await response.json()
      setCategories(result.data || [])
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải danh mục",
        variant: "destructive",
      })
    }
  }

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/seller/products/${productId}`, {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Không thể tải sản phẩm')
      }

      const product: Product = await response.json()
      setFormData({
        name: product.name,
        categoryId: product.categoryId.toString(),
        subcategoryId: product.subcategoryId.toString(),
        price: product.price.toString(),
        originalPrice: product.originalPrice?.toString() || "",
        stock: product.stock.toString(),
        description: product.description || "",
        image: product.image || "",
        specifications: product.specifications || "",
        shippingInfo: product.shippingInfo || "",
        warranty: product.warranty || "",

      })
      
      const images: ProductImage[] = []
      
      if (product.ProductImage && product.ProductImage.length > 0) {
        const productImages = product.ProductImage.map((img: any) => ({
          id: img.id,
          url: img.image || img.url,
          isMain: img.isMain || false,
          mediaType: img.mediaType || 'image'
        }))
        images.push(...productImages)
        
        const mainImage = productImages.find(img => img.isMain)?.url || productImages[0]?.url
        setCurrentImage(mainImage)
        setFormData(prev => ({ ...prev, image: mainImage }))
      } else if (product.image) {
        images.push({
          id: undefined,
          url: product.image,
          isMain: true
        })
        setCurrentImage(product.image)
      }
      
      setProductImages(images)
      
      if (product.ProductVariant && product.ProductVariant.length > 0) {
        setVariants(product.ProductVariant)
      } else {
        setVariants([])
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

  const handleCategoryChange = (categoryId: string) => {
    setFormData({ ...formData, categoryId, subcategoryId: "" })
  }

  const handleAddVariant = () => {
    setVariants([...variants, {
      name: "",
      description: "",
      originalPrice: "",
      price: "",
      image: "",
      stock: "",
    }])
  }

  const handleVariantChange = (index: number, field: string, value: any) => {
    const newVariants = [...variants]
    newVariants[index] = { ...newVariants[index], [field]: value }
    setVariants(newVariants)
  }

  const handleDeleteVariant = (index: number) => {
    const newVariants = [...variants]
    if (newVariants[index].id) {
      newVariants[index].deleted = true
    } else {
      newVariants.splice(index, 1)
    }
    setVariants(newVariants)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.categoryId || !formData.subcategoryId || !formData.price) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin bắt buộc",
        variant: "destructive",
      })
      return
    }

    try {
      setSubmitting(true)
      const filteredVariants = variants.filter(v => !v.deleted || v.id)
      const stockToSend = filteredVariants.length > 0 ? 0 : formData.stock
      
      const response = await fetch(`/api/seller/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          stock: stockToSend,
          variants: filteredVariants,
          taxApplied: false,
          taxIncluded: true,
          taxRate: 0,
          images: productImages.map(img => ({
            id: img.id,
            image: img.image || img.url,
            isMain: img.isMain,
          })),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Lỗi ${response.status}: Không thể cập nhật sản phẩm`)
      }

      toast({
        title: "Thành công",
        description: "Sản phẩm đã được cập nhật",
      })

      router.push(`/seller/products/${productId}`)
    } catch (error) {
      console.error('Product update error:', error)
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Không thể cập nhật sản phẩm",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <main className="p-6">
        <p className="text-center">Đang tải sản phẩm...</p>
      </main>
    )
  }

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
        <h1 className="text-3xl font-bold">Chỉnh sửa sản phẩm</h1>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin cơ bản</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Tên sản phẩm *</Label>
                <Input 
                  placeholder="Nhập tên sản phẩm" 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label>Danh mục *</Label>
                <select 
                  className="w-full p-2 border rounded mt-2"
                  value={formData.categoryId}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  required
                >
                  <option value="">Chọn danh mục</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {formData.categoryId && (
                <div>
                  <Label>Danh mục con *</Label>
                  <select 
                    className="w-full p-2 border rounded mt-2"
                    value={formData.subcategoryId}
                    onChange={(e) => setFormData({ ...formData, subcategoryId: e.target.value })}
                    required
                  >
                    <option value="">Chọn danh mục con</option>
                    {subcategories.map((subcat) => (
                      <option key={subcat.id} value={subcat.id}>
                        {subcat.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <Label>Mô tả sản phẩm</Label>
                <textarea 
                  className="w-full p-2 border rounded text-sm mt-2"
                  rows={6}
                  placeholder="Mô tả chi tiết về sản phẩm"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                ></textarea>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Giá cả</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Giá bán *</Label>
                  <Input 
                    type="number" 
                    placeholder="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Giá gốc</Label>
                  <Input 
                    type="number" 
                    placeholder="0"
                    value={formData.originalPrice}
                    onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>



          {variants.length === 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Kho hàng</CardTitle>
              </CardHeader>
              <CardContent>
                <Label>Số lượng</Label>
                <Input 
                  type="number" 
                  placeholder="0"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                />
              </CardContent>
            </Card>
          )}
          {variants.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Kho hàng</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">Tổng số lượng: <span className="font-semibold">{variants.reduce((sum, v) => sum + parseInt(String(v.stock) || '0'), 0)}</span></p>
                <p className="text-xs text-gray-500 mt-2">Quản lý số lượng theo từng phân bản ở phía dưới</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Thông tin khác</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Bảo hành</Label>
                <Input 
                  placeholder="vd: 12 tháng"
                  value={formData.warranty}
                  onChange={(e) => setFormData({ ...formData, warranty: e.target.value })}
                />
              </div>
              <div>
                <Label>Thông tin vận chuyển</Label>
                <textarea 
                  className="w-full p-2 border rounded text-sm"
                  rows={3}
                  placeholder="Thông tin về vận chuyển"
                  value={formData.shippingInfo}
                  onChange={(e) => setFormData({ ...formData, shippingInfo: e.target.value })}
                ></textarea>
              </div>
              <div>
                <Label>Đặc tính kỹ thuật</Label>
                <textarea 
                  className="w-full p-2 border rounded text-sm"
                  rows={3}
                  placeholder="Thông tin đặc tính kỹ thuật"
                  value={formData.specifications}
                  onChange={(e) => setFormData({ ...formData, specifications: e.target.value })}
                ></textarea>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Thuộc tính sản phẩm (Variants)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {variants.map((variant, index) => (
                !variant.deleted && (
                  <div key={index} className="border rounded p-4 space-y-3 bg-slate-50">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-semibold">Thuộc tính {index + 1}</h4>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="text-destructive"
                        onClick={() => handleDeleteVariant(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div>
                      <Label className="text-sm">Tên thuộc tính *</Label>
                      <Input 
                        placeholder="vd: Size S, Color Red"
                        value={variant.name}
                        onChange={(e) => handleVariantChange(index, 'name', e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <Label className="text-sm">Mô tả</Label>
                      <Input 
                        placeholder="Mô tả ngắn"
                        value={variant.description || ""}
                        onChange={(e) => handleVariantChange(index, 'description', e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-sm">Giá *</Label>
                        <Input 
                          type="number"
                          placeholder="0"
                          value={variant.price}
                          onChange={(e) => handleVariantChange(index, 'price', e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Giá gốc</Label>
                        <Input 
                          type="number"
                          placeholder="0"
                          value={variant.originalPrice || ""}
                          onChange={(e) => handleVariantChange(index, 'originalPrice', e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm">Số lượng</Label>
                      <Input 
                        type="number"
                        placeholder="0"
                        value={variant.stock}
                        onChange={(e) => handleVariantChange(index, 'stock', e.target.value)}
                      />
                    </div>

                    <div>
                      <Label className="text-sm">Hình ảnh</Label>
                      <ProductImageUpload 
                        onImageSelect={(url) => handleVariantChange(index, 'image', url)}
                        disabled={submitting}
                      />
                      {variant.image && (
                        <div className="mt-2 relative w-20 h-20 bg-muted rounded overflow-hidden">
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
                )
              ))}

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleAddVariant}
              >
                <Plus className="h-4 w-4 mr-2" />
                Thêm thuộc tính mới
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Hình ảnh sản phẩm</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ProductMultiImageUpload 
                onImagesSelect={(images) => {
                  setProductImages(images)
                  const mainImage = images.find(img => img.isMain)
                  if (mainImage) {
                    setFormData({ ...formData, image: mainImage.url })
                    setCurrentImage(mainImage.url)
                  }
                }}
                disabled={submitting}
                initialImages={productImages}
              />
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button 
              type="submit" 
              className="flex-1 bg-orange-600 hover:bg-orange-700"
              disabled={submitting}
            >
              <Save className="h-4 w-4 mr-2" />
              {submitting ? "Đang lưu..." : "Lưu"}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1"
              onClick={() => router.back()}
            >
              Hủy
            </Button>
          </div>
        </div>
      </form>
    </main>
  )
}
