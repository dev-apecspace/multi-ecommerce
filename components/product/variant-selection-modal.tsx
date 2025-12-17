"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { useToast } from "@/hooks/use-toast"
import { useIsMobile } from "@/hooks/use-mobile"

interface Variant {
  id: number
  name: string
  description?: string
  price: number
  salePrice?: number | null
  originalPrice?: number
  image?: string
  stock: number
  displayPrice?: number
  displayOriginalPrice?: number
  discountPercent?: number
}

interface AttributeValue {
  id: number
  value: string
}

interface ProductAttribute {
  id: number
  name: string
  ProductAttributeValue: AttributeValue[]
}

interface VariantSelectionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productId: number
  productName: string
  productImage: string | Array<{ url: string; isMain?: boolean }>
  price: number
  salePrice?: number | null
  originalPrice?: number
  variants: Variant[]
  attributes?: ProductAttribute[]
  onConfirm: (variantId: number, quantity: number) => Promise<void>
  isLoading?: boolean
  taxApplied?: boolean
  taxRate?: number
  taxIncluded?: boolean
}

export function VariantSelectionModal({
  open,
  onOpenChange,
  productId,
  productName,
  productImage,
  price,
  salePrice,
  originalPrice,
  variants,
  attributes = [],
  onConfirm,
  isLoading = false,
  taxApplied = false,
  taxRate = 0,
  taxIncluded = true,
}: VariantSelectionModalProps) {
  const { toast } = useToast()
  const [selectedVariant, setSelectedVariant] = useState<number | null>(null)
  const [selectedAttributes, setSelectedAttributes] = useState<Record<number, string>>({})
  const [quantity, setQuantity] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isMobile = useIsMobile()

  const hasAttributes = attributes && attributes.length > 0

  useEffect(() => {
    if (open) {
      setQuantity(1)
      if (hasAttributes) {
        setSelectedAttributes({})
        setSelectedVariant(null)
      } else {
        if (variants.length > 0) {
          setSelectedVariant(variants[0].id)
        }
        setSelectedAttributes({})
      }
    }
  }, [open, variants, hasAttributes])

  const findVariantByAttributeValues = () => {
    if (!hasAttributes || attributes.length === 0) return null

    const selectedValues = attributes.map(attr => 
      selectedAttributes[attr.id] || null
    )

    if (selectedValues.includes(null)) return null

    const selectedValuesStr = selectedValues.join(' ')

    return variants.find(v => v.name === selectedValuesStr)
  }

  useEffect(() => {
    if (hasAttributes) {
      const matching = findVariantByAttributeValues()
      if (matching) {
        setSelectedVariant(matching.id)
      }
    }
  }, [selectedAttributes, hasAttributes])

  const handleConfirm = async () => {
    if (!selectedVariant) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn phân loại",
        variant: "destructive",
      })
      return
    }

    if (quantity < 1) {
      toast({
        title: "Lỗi",
        description: "Số lượng phải từ 1 trở lên",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)
      await onConfirm(selectedVariant, quantity)
      onOpenChange(false)
    } catch (error) {
      console.error("Error confirming variant:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedVariantData = variants.find((v) => v.id === selectedVariant)
  
  // Use pre-calculated display values if available, otherwise fallback to calculation
  const displayPrice = selectedVariantData?.displayPrice ?? 
    (selectedVariantData?.salePrice ?? salePrice ?? price)
    
  const displayOriginalPrice = selectedVariantData?.displayOriginalPrice ?? 
    (selectedVariantData?.originalPrice ?? originalPrice ?? price)

  const discount = selectedVariantData?.discountPercent ?? 
    (displayOriginalPrice > displayPrice 
      ? Math.round(((displayOriginalPrice - displayPrice) / displayOriginalPrice) * 100) 
      : 0)

  const getProductImageUrl = () => {
    if (Array.isArray(productImage)) {
      const mainImage = productImage.find(img => img.isMain)
      return mainImage?.url || productImage[0]?.url || "/placeholder.svg"
    }
    return productImage || "/placeholder.svg"
  }

  const displayImage = selectedVariantData?.image || getProductImageUrl()

  const content = (
    <div className="space-y-4">
      {/* Product Info */}
      <div className="flex gap-4">
        <div className="relative w-20 h-20 flex-shrink-0 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
          <Image
            src={displayImage || "/placeholder.svg"}
            alt={productName}
            fill
            className="object-cover"
          />
        </div>
        <div className="flex-1">
          <h3 className="font-medium line-clamp-2">{productName}</h3>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-bold text-primary">
              {displayPrice.toLocaleString("vi-VN")}₫
            </span>
            {displayOriginalPrice > displayPrice && (
              <span className="text-xs text-muted-foreground line-through">
                {displayOriginalPrice.toLocaleString("vi-VN")}₫
              </span>
            )}
            {discount > 0 && (
              <span className="text-xs font-semibold text-red-500 bg-red-50 dark:bg-red-900/30 px-1.5 py-0.5 rounded">
                -{discount}%
              </span>
            )}
          </div>
          {taxApplied && taxRate > 0 && taxIncluded && (
            <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-1">
              (Đã bao gồm thuế)
            </p>
          )}
        </div>
      </div>

      <div className="border-t border-border" />

      {/* Attribute or Variant Selection */}
      {hasAttributes ? (
        <div className="space-y-4">
          {attributes.map((attribute) => {
            const isLastAttribute = attributes.indexOf(attribute) === attributes.length - 1
            
            return (
              <div key={attribute.id} className="space-y-2">
                <label className="text-sm font-semibold">{attribute.name}</label>
                <div className="flex flex-wrap gap-2">
                  {attribute.ProductAttributeValue.map((value) => {
                    const testAttrs = {
                      ...selectedAttributes,
                      [attribute.id]: value.value
                    }
                    
                    const isSelected = selectedAttributes[attribute.id] === value.value
                    let isDisabled = false
                    let stockStatus = 0
                    
                    if (isLastAttribute || Object.keys(selectedAttributes).length === attributes.length - 1) {
                      const selectedValues = attributes.map(attr => {
                        if (attr.id === attribute.id) return value.value
                        return selectedAttributes[attr.id] || null
                      })
                      
                      if (!selectedValues.includes(null)) {
                        const variantName = selectedValues.join(' ')
                        const matchingVariant = variants.find(v => v.name === variantName)
                        isDisabled = !matchingVariant || matchingVariant.stock <= 0
                        stockStatus = matchingVariant?.stock ?? 0
                      }
                    }
                    
                    return (
                      <button
                        key={value.id}
                        onClick={() => {
                          if (!isDisabled) {
                            setSelectedAttributes(prev => ({
                              ...prev,
                              [attribute.id]: value.value
                            }))
                          }
                        }}
                        disabled={isDisabled}
                        className={`px-3 py-2 rounded-lg border-2 transition-all text-sm font-medium ${
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground"
                            : isDisabled
                            ? "border-border text-muted-foreground opacity-50 cursor-not-allowed"
                            : "border-border hover:border-primary/50 cursor-pointer"
                        }`}
                        title={isDisabled ? "Hết hàng" : ""}
                      >
                        {value.value}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="space-y-3">
          <label className="text-sm font-semibold">Phân loại</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {variants.map((variant) => (
              <button
                key={variant.id}
                onClick={() => setSelectedVariant(variant.id)}
                className={`relative p-3 rounded-lg border-2 transition-all text-left ${
                  selectedVariant === variant.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                } ${variant.stock <= 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                disabled={variant.stock <= 0}
              >
                {variant.image && (
                  <div className="relative w-full h-12 mb-2 rounded overflow-hidden bg-gray-200 dark:bg-gray-700">
                    <Image
                      src={variant.image}
                      alt={variant.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="text-xs font-medium line-clamp-1">
                  {variant.name}
                </div>
                {variant.stock <= 0 && (
                  <div className="text-xs text-red-500 font-semibold">Hết hàng</div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quantity Selection */}
      <div className="space-y-2">
        <label className="text-sm font-semibold">Số lượng</label>
        <div className="flex items-center border border-border rounded-lg w-fit">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="px-3 py-2 hover:bg-surface transition-colors"
            disabled={isSubmitting || isLoading}
          >
            −
          </button>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Number.parseInt(e.target.value) || 1))}
            className="w-12 text-center border-l border-r border-border py-2 bg-transparent"
            min="1"
            max={selectedVariantData?.stock || 999}
            disabled={isSubmitting || isLoading}
          />
          <button
            onClick={() =>
              setQuantity(
                Math.min(
                  quantity + 1,
                  selectedVariantData?.stock || 999
                )
              )
            }
            className="px-3 py-2 hover:bg-surface transition-colors"
            disabled={isSubmitting || isLoading || quantity >= (selectedVariantData?.stock || 0)}
          >
            +
          </button>
        </div>
        {selectedVariantData && selectedVariantData.stock > 0 && (
          <p className="text-xs text-muted-foreground">
            Còn {selectedVariantData.stock} sản phẩm
          </p>
        )}
      </div>

      <div className="border-t border-border" />

      {/* Action Buttons */}
      <Button
        onClick={handleConfirm}
        disabled={isSubmitting || isLoading || !selectedVariant}
        className="w-full h-10"
      >
        {isSubmitting || isLoading ? "Đang xử lý..." : "Xác nhận"}
      </Button>
    </div>
  )

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Chọn phân loại</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-4">{content}</div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Chọn phân loại</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  )
}
