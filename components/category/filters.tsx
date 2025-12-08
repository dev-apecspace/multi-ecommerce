"use client"

import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { ChevronDown } from "lucide-react"
import { useState } from "react"

interface FiltersProps {
  filters: {
    priceMin: number
    priceMax: number
    rating: number
    condition: string
    seller: string
    inStock: boolean
  }
  onChange: (filters: any) => void
}

export function CategoryFilters({ filters, onChange }: FiltersProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    price: true,
    rating: true,
    condition: false,
    seller: false,
  })

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  return (
    <div className="space-y-4">
      {/* Price Filter */}
      <Card className="p-4">
        <button
          onClick={() => toggleSection("price")}
          className="w-full flex items-center justify-between font-bold mb-3"
        >
          <span>Giá</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${expandedSections.price ? "rotate-180" : ""}`} />
        </button>

        {expandedSections.price && (
          <div className="space-y-4">
            <Slider
              value={[filters.priceMin, filters.priceMax]}
              onValueChange={(value) => onChange({ ...filters, priceMin: value[0], priceMax: value[1] })}
              min={0}
              max={100000000}
              step={100000}
              className="mt-2"
            />
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Từ"
                value={filters.priceMin}
                onChange={(e) => onChange({ ...filters, priceMin: Number.parseInt(e.target.value) || 0 })}
                className="flex-1 px-3 py-2 border border-border rounded-lg text-xs font-mono min-w-0 overflow-hidden"
              />
              <input
                type="number"
                placeholder="Đến"
                value={filters.priceMax}
                onChange={(e) =>
                  onChange({
                    ...filters,
                    priceMax: Number.parseInt(e.target.value) || 100000000,
                  })
                }
                className="flex-1 px-3 py-2 border border-border rounded-lg text-xs font-mono min-w-0 overflow-hidden"
              />
            </div>
            <Button size="sm" className="w-full">
              Áp dụng
            </Button>
          </div>
        )}
      </Card>

      {/* Rating Filter */}
      <Card className="p-4">
        <button
          onClick={() => toggleSection("rating")}
          className="w-full flex items-center justify-between font-bold mb-3"
        >
          <span>Đánh giá</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${expandedSections.rating ? "rotate-180" : ""}`} />
        </button>

        {expandedSections.rating && (
          <RadioGroup value={String(filters.rating)} onValueChange={(value) => onChange({ ...filters, rating: Number(value) })}>
            <div className="space-y-3">
              {[5, 4, 3, 2, 1].map((star) => (
                <div key={star} className="flex items-center gap-2">
                  <RadioGroupItem value={String(star)} id={`rating-${star}`} />
                  <Label htmlFor={`rating-${star}`} className="cursor-pointer flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} className={`text-xs ${i < star ? "text-yellow-400" : "text-gray-300"}`}>
                        ★
                      </span>
                    ))}
                    <span className="text-sm text-muted-foreground ml-1">Trở lên</span>
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        )}
      </Card>

      {/* Condition Filter */}
      <Card className="p-4">
        <button
          onClick={() => toggleSection("condition")}
          className="w-full flex items-center justify-between font-bold mb-3"
        >
          <span>Tình trạng</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${expandedSections.condition ? "rotate-180" : ""}`} />
        </button>

        {expandedSections.condition && (
          <RadioGroup value={filters.condition} onValueChange={(value) => onChange({ ...filters, condition: value })}>
            <div className="space-y-3">
              {[
                { value: "new", label: "Mới" },
                { value: "like-new", label: "Như mới" },
                { value: "used", label: "Đã sử dụng" },
              ].map((option) => (
                <div key={option.value} className="flex items-center gap-2">
                  <RadioGroupItem value={option.value} id={`condition-${option.value}`} />
                  <Label htmlFor={`condition-${option.value}`} className="cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        )}
      </Card>

      {/* Seller Filter */}
      <Card className="p-4">
        <button
          onClick={() => toggleSection("seller")}
          className="w-full flex items-center justify-between font-bold mb-3"
        >
          <span>Loại bán</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${expandedSections.seller ? "rotate-180" : ""}`} />
        </button>

        {expandedSections.seller && (
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={filters.inStock}
                onCheckedChange={(checked) => onChange({ ...filters, inStock: !!checked })}
              />
              <span className="text-sm">Còn hàng</span>
            </label>
          </div>
        )}
      </Card>

      {/* Reset Button */}
      <Button variant="outline" className="w-full bg-transparent">
        Xóa bộ lọc
      </Button>
    </div>
  )
}
