"use client"

import { Save, Plus, Trash2, X } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
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
  url: string
  isMain?: boolean
  mediaType?: 'image' | 'video'
}

interface Attribute {
  name: string
  values: string[]
}

interface AttributeInputBlock {
  id: string
  name: string
  values: string[]
}

interface ProductVariant {
  name: string
  description?: string
  originalPrice?: string
  price: string
  stock: string
  sku?: string
  barcode?: string
}

export default function SellerCreateProductPage() {
  const { toast } = useToast()
  const router = useRouter()
  const { user } = useAuth()
  const attributeInputRef = useRef<HTMLInputElement>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [subcategories, setSubcategories] = useState<SubCategory[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [attributes, setAttributes] = useState<Attribute[]>([])
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [productImages, setProductImages] = useState<ProductImage[]>([])
  const [attributeInputBlocks, setAttributeInputBlocks] = useState<AttributeInputBlock[]>([])
  const [editingAttributeIndex, setEditingAttributeIndex] = useState<number | null>(null)
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

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/categories?withSubcategories=true')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setCategories(Array.isArray(data) ? data : [])
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải danh mục",
        variant: "destructive",
      })
      setCategories([])
    } finally {
      setLoading(false)
    }
  }

  const handleCategoryChange = (categoryId: string) => {
    setFormData({ ...formData, categoryId, subcategoryId: "" })
    const category = categories.find(c => c.id === parseInt(categoryId))
    if (category?.SubCategory) {
      setSubcategories(category.SubCategory)
    }
  }

  const generateVariantCombinations = (attrs: Attribute[]): ProductVariant[] => {
    if (attrs.length === 0) return []
    
    const combinations: string[][] = []
    const indices: number[] = new Array(attrs.length).fill(0)
    
    while (true) {
      combinations.push(attrs.map((attr, i) => attr.values[indices[i]]))
      
      let i = attrs.length - 1
      while (i >= 0 && indices[i] === attrs[i].values.length - 1) {
        indices[i] = 0
        i--
      }
      if (i < 0) break
      indices[i]++
    }
    
    return combinations.map(combo => ({
      name: combo.join(" "),
      price: formData.price || "0",
      originalPrice: formData.originalPrice || "",
      stock: formData.stock || "0",
      sku: "",
      barcode: "",
    }))
  }

  const addAttributeInputBlock = () => {
    const newId = `block-${Date.now()}-${Math.random()}`
    setAttributeInputBlocks([...attributeInputBlocks, { id: newId, name: "", values: [] }])
  }

  const removeAttributeInputBlock = (id: string) => {
    setAttributeInputBlocks(attributeInputBlocks.filter(block => block.id !== id))
  }

  const updateAttributeInputBlock = (id: string, field: 'name' | 'value', val: string) => {
    const currentBlock = attributeInputBlocks.find(b => b.id === id)
    if (!currentBlock) return

    if (field === 'name') {
      setAttributeInputBlocks(attributeInputBlocks.map(block =>
        block.id === id ? { ...block, name: val, values: [] } : block
      ))
    }
  }

  const addValueToBlock = (id: string, value: string) => {
    if (!value.trim()) return
    
    const block = attributeInputBlocks.find(b => b.id === id)
    if (!block || !block.name.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập tên thuộc tính trước",
        variant: "destructive",
      })
      return
    }

    if (block.values.includes(value.trim())) {
      toast({
        title: "Cảnh báo",
        description: "Giá trị này đã tồn tại",
        variant: "destructive",
      })
      return
    }

    setAttributeInputBlocks(attributeInputBlocks.map(b =>
      b.id === id ? { ...b, values: [...b.values, value.trim()] } : b
    ))
  }

  const deleteValueFromBlock = (id: string, valueIndex: number) => {
    setAttributeInputBlocks(attributeInputBlocks.map(b => {
      if (b.id === id) {
        const newValues = b.values.filter((_, i) => i !== valueIndex)
        return { ...b, values: newValues }
      }
      return b
    }))
  }

  const finishAttributeBlock = (id: string) => {
    const block = attributeInputBlocks.find(b => b.id === id)
    if (!block || !block.name.trim() || block.values.length === 0) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập tên thuộc tính và ít nhất một giá trị",
        variant: "destructive",
      })
      return
    }

    // Add/update attribute only when clicking Xong
    const existingAttr = attributes.find(a => a.name === block.name.trim())
    let updated: Attribute[] = []
    
    if (existingAttr) {
      updated = attributes.map(a =>
        a.name === block.name.trim()
          ? { ...a, values: [...a.values, ...block.values.filter(v => !a.values.includes(v))] }
          : a
      )
    } else {
      updated = [...attributes, { name: block.name.trim(), values: block.values }]
    }

    setAttributes(updated)
    const newVariants = generateVariantCombinations(updated)
    setVariants(newVariants)

    removeAttributeInputBlock(id)
  }

  const handleAttributeValueKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, id: string, value: string) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addValueToBlock(id, value)
      e.currentTarget.value = ""
    }
  }

  const handleAddAttributeValue = (index: number, value: string) => {
    if (!value.trim()) return
    const currentValues = attributes[index].values
    if (currentValues.includes(value.trim())) return
    
    const updated = [...attributes]
    updated[index] = { name: attributes[index].name, values: [...currentValues, value.trim()] }
    setAttributes(updated)
    
    const newVariants = generateVariantCombinations(updated)
    setVariants(newVariants)
    
    setTimeout(() => attributeInputRef.current?.focus(), 0)
  }

  const handleDeleteAttributeValue = (attrIndex: number, valueIndex: number) => {
    const updated = [...attributes]
    updated[attrIndex].values = updated[attrIndex].values.filter((_, i) => i !== valueIndex)
    if (updated[attrIndex].values.length === 0) {
      updated.splice(attrIndex, 1)
    }
    setAttributes(updated)
    
    const newVariants = generateVariantCombinations(updated)
    setVariants(newVariants)
  }

  const handleDeleteAttribute = (index: number) => {
    const updated = attributes.filter((_, i) => i !== index)
    setAttributes(updated)
    
    const newVariants = generateVariantCombinations(updated)
    setVariants(newVariants)
  }

  const handleVariantChange = (index: number, field: string, value: any) => {
    const newVariants = [...variants]
    newVariants[index] = { ...newVariants[index], [field]: value }
    setVariants(newVariants)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user?.id) {
      toast({
        title: "Lỗi",
        description: "Vui lòng đăng nhập",
        variant: "destructive",
      })
      return
    }

    if (!formData.name || !formData.categoryId || !formData.subcategoryId || !formData.price || !formData.image) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin bắt buộc (bao gồm hình ảnh)",
        variant: "destructive",
      })
      return
    }

    try {
      setSubmitting(true)
      const filteredVariants = variants.filter(v => v.name && v.price)
      const stockToSend = filteredVariants.length > 0 ? 0 : formData.stock
      
      const response = await fetch('/api/seller/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          stock: stockToSend,
          attributes: attributes,
          variants: filteredVariants,
          taxApplied: false,
          taxIncluded: true,
          taxRate: 0,
          images: productImages.map(img => ({
            image: img.url,
            isMain: img.isMain,
          })),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (response.status === 401) {
          throw new Error('Bạn chưa được phê duyệt làm người bán hoặc phiên đã hết hạn. Vui lòng đăng nhập lại.')
        }
        throw new Error(errorData.error || `Lỗi ${response.status}: Không thể thêm sản phẩm`)
      }

      toast({
        title: "Thành công",
        description: "Sản phẩm đã được gửi phê duyệt",
      })

      router.push('/seller/products')
    } catch (error) {
      console.error('Product creation error:', error)
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Không thể thêm sản phẩm",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <main className="p-6">
        <p className="text-center">Đang tải danh mục...</p>
      </main>
    )
  }

  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold mb-8">Thêm sản phẩm mới</h1>

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
                <p className="text-sm text-gray-600">Tổng số lượng: <span className="font-semibold">{variants.reduce((sum, v) => sum + parseInt(v.stock || '0'), 0)}</span></p>
                <p className="text-xs text-gray-500 mt-2">Quản lý số lượng theo từng phân bản ở phía trên</p>
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Thuộc tính sản phẩm (Tùy chọn)</CardTitle>
              <p className="text-sm text-gray-500 mt-2">Thêm thuộc tính (như Size, Màu sắc) để tạo phân loại sản phẩm tự động</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {attributes.length > 0 && (
                <div className="border rounded p-3 bg-blue-50 space-y-3">
                  {attributes.map((attr, attrIndex) => (
                    <div 
                      key={attrIndex} 
                      className="border rounded p-3 bg-white hover:bg-gray-50 transition"
                      onClick={() => {
                        if (editingAttributeIndex !== attrIndex) {
                          setEditingAttributeIndex(attrIndex)
                        }
                      }}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <h5 className="font-semibold text-sm">{attr.name}</h5>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteAttribute(attrIndex)
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 items-center">
                        {attr.values.map((value, valIndex) => (
                          <div key={valIndex} className="bg-blue-100 text-blue-800 text-xs py-1 px-2 rounded flex items-center gap-1.5 hover:bg-blue-200 transition">
                            {value}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteAttributeValue(attrIndex, valIndex)
                              }}
                              className="hover:text-destructive cursor-pointer"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                        {editingAttributeIndex === attrIndex && (
                          <Input
                            ref={attributeInputRef}
                            type="text"
                            placeholder="Enter để thêm"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                const value = (e.currentTarget as HTMLInputElement).value
                                handleAddAttributeValue(attrIndex, value)
                                e.currentTarget.value = ""
                              }
                            }}
                            onBlur={(e) => {
                              if (e.currentTarget.value.trim()) {
                                handleAddAttributeValue(attrIndex, e.currentTarget.value)
                                e.currentTarget.value = ""
                              }
                            }}
                            className="text-xs flex-1 min-w-32 h-7"
                            autoFocus
                          />
                        )}
                      </div>
                      {editingAttributeIndex !== attrIndex && (
                        <p className="text-xs text-gray-500 mt-2">👆 Click để thêm giá trị</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <Button
                type="button"
                onClick={addAttributeInputBlock}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Thêm thuộc tính
              </Button>

              {attributeInputBlocks.map((block) => (
                <div key={block.id} className="border rounded p-4 bg-white">
                  <div className="grid grid-cols-2 gap-4 items-start">
                    {/* Left side - Attribute Name */}
                    <div>
                      <div className="text-sm font-semibold text-gray-700 mb-2">Tên thuộc tính</div>
                      <Input
                        placeholder="Kích thước"
                        value={block.name}
                        onChange={(e) => updateAttributeInputBlock(block.id, 'name', e.target.value)}
                        className="w-full h-10 rounded"
                        autoFocus
                      />
                    </div>

                    {/* Right side - Attribute Values */}
                    <div>
                      <div className="text-sm font-semibold text-gray-700 mb-2">Giá trị</div>
                      <div className="border rounded p-3 bg-blue-50 flex flex-wrap gap-2 items-center min-h-10">
                        {block.values.map((value, idx) => (
                          <div key={idx} className="bg-blue-100 text-blue-800 text-sm py-1 px-2 rounded inline-flex items-center gap-1.5">
                            {value}
                            <button
                              type="button"
                              onClick={() => deleteValueFromBlock(block.id, idx)}
                              className="hover:text-blue-600 cursor-pointer"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                        <Input
                          ref={attributeInputRef}
                          type="text"
                          placeholder="Để kỳ tự và ấn Enter để thêm thuộc tính"
                          onKeyDown={(e) => handleAttributeValueKeyDown(e, block.id, e.currentTarget.value)}
                          className="border-0 text-sm h-8 px-0 focus:outline-none flex-1 min-w-32 bg-transparent"
                          onBlur={(e) => {
                            if (e.currentTarget.value.trim()) {
                              addValueToBlock(block.id, e.currentTarget.value)
                              e.currentTarget.value = ""
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-3">
                    <Button
                      type="button"
                      size="sm"
                      className="flex-1 bg-orange-600 hover:bg-orange-700"
                      onClick={() => finishAttributeBlock(block.id)}
                    >
                      Xong
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => removeAttributeInputBlock(block.id)}
                    >
                      Hủy
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {variants.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Phân bản ({variants.length})</CardTitle>
                <p className="text-sm text-gray-500 mt-2">Tự động tạo từ các thuộc tính - Chỉnh sửa SKU, Barcode, Giá và Số lượng cho từng phân bản</p>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-2 font-semibold">Tên phân bản</th>
                      <th className="text-left p-2 font-semibold">SKU</th>
                      <th className="text-left p-2 font-semibold">Barcode</th>
                      <th className="text-left p-2 font-semibold">Giá</th>
                      <th className="text-left p-2 font-semibold">Giá gốc</th>
                      <th className="text-left p-2 font-semibold">Số lượng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {variants.map((variant, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium">{variant.name}</td>
                        <td className="p-2">
                          <Input
                            type="text"
                            placeholder="SKU"
                            value={variant.sku || ""}
                            onChange={(e) => handleVariantChange(index, 'sku', e.target.value)}
                            className="text-xs"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="text"
                            placeholder="Barcode"
                            value={variant.barcode || ""}
                            onChange={(e) => handleVariantChange(index, 'barcode', e.target.value)}
                            className="text-xs"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            placeholder="0"
                            value={variant.price}
                            onChange={(e) => handleVariantChange(index, 'price', e.target.value)}
                            className="text-xs"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            placeholder="0"
                            value={variant.originalPrice || ""}
                            onChange={(e) => handleVariantChange(index, 'originalPrice', e.target.value)}
                            className="text-xs"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            placeholder="0"
                            value={variant.stock}
                            onChange={(e) => handleVariantChange(index, 'stock', e.target.value)}
                            className="text-xs"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Hình ảnh sản phẩm</CardTitle>
            </CardHeader>
            <CardContent>
              <ProductMultiImageUpload 
                onImagesSelect={(images) => {
                  setProductImages(images)
                  const mainImage = images.find(img => img.isMain)
                  if (mainImage) {
                    setFormData({ ...formData, image: mainImage.url })
                  }
                }}
                disabled={submitting}
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
