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

interface AddressManagementProps {
  userId: number | null
}

export function AddressManagement({ userId }: AddressManagementProps) {
  const { toast } = useToast()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
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
    if (userId) {
      fetchAddresses()
    }
  }, [userId])

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

  const handleOpenDialog = (address?: Address) => {
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
    } else {
      resetForm()
    }
    setDialogOpen(true)
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
      setDialogOpen(false)
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

  if (loading) {
    return <div className="text-center py-8">Đang tải...</div>
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {addresses.map((addr) => (
          <Card key={addr.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <h3 className="font-bold">{addr.label}</h3>
                </div>
                {addr.isDefault && <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">Mặc định</span>}
              </div>
              <p className="text-sm text-muted-foreground mb-1">{addr.fullName} | {addr.phone}</p>
              <p className="text-sm text-muted-foreground mb-4">
                {addr.street}, {addr.ward}, {addr.district}, {addr.city}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleOpenDialog(addr)}>
                  <Edit2 className="h-4 w-4 mr-1" />
                  Sửa
                </Button>
                {!addr.isDefault && (
                  <Button variant="outline" size="sm" onClick={() => handleSetDefault(addr.id)}>
                    Đặt mặc định
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => handleDelete(addr.id)}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Xóa
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        <Card>
          <CardContent className="p-6 flex items-center justify-center">
            <Button variant="outline" className="gap-2 bg-transparent" onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4" />
              Thêm địa chỉ mới
            </Button>
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Sửa địa chỉ" : "Thêm địa chỉ mới"}</DialogTitle>
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
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleSaveAddress}>{editingId ? "Cập nhật" : "Thêm"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
