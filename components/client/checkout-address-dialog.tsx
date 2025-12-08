"use client"

import { useState, useEffect } from "react"
import { MapPin, Plus, Trash2, Edit2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

interface Address {
  id: number
  userId: number
  label: string
  fullName: string
  phone: string
  street: string
  ward: string
  district: string
  city: string
  postalCode?: string
  isDefault: boolean
  createdAt: string
}

interface CheckoutAddressDialogProps {
  userId: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedAddressId: number | null
  onSelectAddress: (address: Address) => void
}

export function CheckoutAddressDialog({
  userId,
  open,
  onOpenChange,
  selectedAddressId,
  onSelectAddress,
}: CheckoutAddressDialogProps) {
  const { toast } = useToast()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<"list" | "edit" | "add">("list")
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    label: "Địa chỉ",
    fullName: "",
    phone: "",
    street: "",
    ward: "",
    district: "",
    city: "",
    postalCode: "",
    isDefault: false,
  })

  useEffect(() => {
    if (open && userId) {
      fetchAddresses()
      setMode("list")
    }
  }, [open, userId])

  const fetchAddresses = async () => {
    if (!userId) return
    try {
      setLoading(true)
      const response = await fetch(`/api/addresses?userId=${userId}`)
      const data = await response.json()
      setAddresses(Array.isArray(data) ? data : [])
    } catch (error) {
      toast({ title: "Lỗi", description: "Không thể tải địa chỉ", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({ label: "Địa chỉ", fullName: "", phone: "", street: "", ward: "", district: "", city: "", postalCode: "", isDefault: false })
    setEditingId(null)
  }

  const handleOpenAddNew = () => {
    resetForm()
  }

  const handleSaveAddress = async () => {
    if (!userId || !formData.fullName || !formData.phone || !formData.street) {
      toast({ title: "Lỗi", description: "Vui lòng điền đầy đủ thông tin", variant: "destructive" })
      return
    }

    try {
      if (editingId) {
        const response = await fetch(`/api/addresses?id=${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        })
        if (!response.ok) throw new Error("Failed to update")
        toast({ title: "Thành công", description: "Cập nhật địa chỉ thành công" })
      } else {
        const response = await fetch("/api/addresses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...formData, userId, isDefault: formData.isDefault || addresses.length === 0 }),
        })
        if (!response.ok) throw new Error("Failed to create")
        toast({ title: "Thành công", description: "Thêm địa chỉ thành công" })
      }
      resetForm()
      fetchAddresses()
    } catch (error) {
      toast({ title: "Lỗi", description: "Không thể lưu địa chỉ", variant: "destructive" })
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn chắc chắn muốn xóa địa chỉ này?")) return

    try {
      const response = await fetch(`/api/addresses?id=${id}`, { method: "DELETE" })
      if (!response.ok) throw new Error("Failed to delete")
      toast({ title: "Thành công", description: "Xóa địa chỉ thành công" })
      fetchAddresses()
    } catch (error) {
      toast({ title: "Lỗi", description: "Không thể xóa địa chỉ", variant: "destructive" })
    }
  }

  const handleSetDefault = async (id: number) => {
    try {
      const response = await fetch(`/api/addresses?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: true }),
      })
      if (!response.ok) throw new Error("Failed to update")
      fetchAddresses()
    } catch (error) {
      toast({ title: "Lỗi", description: "Không thể cập nhật địa chỉ mặc định", variant: "destructive" })
    }
  }

  if (loading && open) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <div className="text-center py-8">Đang tải...</div>
        </DialogContent>
      </Dialog>
    )
  }

  if (mode === "add" || mode === "edit") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{mode === "edit" ? "Sửa địa chỉ" : "Thêm địa chỉ mới"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nhãn địa chỉ</Label>
              <Input
                placeholder="Nhà, Văn phòng, ..."
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              />
            </div>
            <div>
              <Label>Họ tên</Label>
              <Input
                placeholder="Nguyễn Văn A"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              />
            </div>
            <div>
              <Label>Số điện thoại</Label>
              <Input
                placeholder="0912345678"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div>
              <Label>Địa chỉ</Label>
              <Input
                placeholder="123 Đường ABC"
                value={formData.street}
                onChange={(e) => setFormData({ ...formData, street: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Phường/Xã</Label>
                <Input
                  placeholder="Phường 1"
                  value={formData.ward}
                  onChange={(e) => setFormData({ ...formData, ward: e.target.value })}
                />
              </div>
              <div>
                <Label>Quận/Huyện</Label>
                <Input
                  placeholder="Quận 1"
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                />
              </div>
              <div>
                <Label>Thành phố</Label>
                <Input
                  placeholder="TP.HCM"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="isDefault"
                checked={formData.isDefault}
                onCheckedChange={(checked) => setFormData({ ...formData, isDefault: checked as boolean })}
              />
              <Label htmlFor="isDefault" className="cursor-pointer">Đặt làm địa chỉ mặc định</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setMode("list"); resetForm() }}>
              Hủy
            </Button>
            <Button onClick={() => {
              handleSaveAddress()
              setMode("list")
            }}>
              {mode === "edit" ? "Cập nhật" : "Thêm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Chọn/Quản lý địa chỉ giao hàng</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {addresses.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Bạn chưa thêm địa chỉ nào</p>
            </div>
          ) : (
            addresses.map((addr) => (
              <div
                key={addr.id}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedAddressId === addr.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div
                    className="flex-1"
                    onClick={() => {
                      const selected = addresses.find(a => a.id === addr.id)
                      if (selected) {
                        onSelectAddress(selected)
                        onOpenChange(false)
                      }
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <p className="font-semibold">{addr.label}</p>
                      {addr.isDefault && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                          Mặc định
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {addr.fullName} | {addr.phone}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {addr.street}, {addr.ward}, {addr.district}, {addr.city}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const address = addresses.find(a => a.id === addr.id)
                        if (address) {
                          setFormData({
                            label: address.label,
                            fullName: address.fullName,
                            phone: address.phone,
                            street: address.street,
                            ward: address.ward,
                            district: address.district,
                            city: address.city,
                            postalCode: address.postalCode || "",
                            isDefault: address.isDefault,
                          })
                          setEditingId(address.id)
                          setMode("edit")
                        }
                      }}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    {!addr.isDefault && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetDefault(addr.id)}
                      >
                        Mặc định
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(addr.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}

          <div className="pt-4 border-t border-border">
            <Button
              className="w-full gap-2"
              onClick={() => {
                resetForm()
                setMode("add")
              }}
            >
              <Plus className="h-4 w-4" />
              Thêm địa chỉ mới
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
