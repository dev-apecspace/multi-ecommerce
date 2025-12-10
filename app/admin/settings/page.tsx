"use client"

import { Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function AdminSettingsPage() {
  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold mb-8">Cài đặt hệ thống</h1>

      <div className="grid grid-cols-1 gap-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Thông tin chung</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Tên cửa hàng</Label>
              <Input defaultValue="Sàn TMĐT APECSPACE" />
            </div>
            <div>
              <Label>Email hỗ trợ</Label>
              <Input defaultValue="support@sandtmdt.com" />
            </div>
            <div>
              <Label>Số điện thoại</Label>
              <Input defaultValue="1900-1234" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cài đặt thanh toán</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <input type="checkbox" id="cod" defaultChecked />
              <Label htmlFor="cod">Thanh toán khi nhận hàng (COD)</Label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="bankTransfer" defaultChecked />
              <Label htmlFor="bankTransfer">Chuyển khoản ngân hàng</Label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="vnpay" />
              <Label htmlFor="vnpay">VNPay</Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cài đặt giao hàng</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Phí giao hàng tiêu chuẩn</Label>
              <Input defaultValue="10000" />
            </div>
            <div>
              <Label>Phí giao hàng express</Label>
              <Input defaultValue="30000" />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Save className="h-4 w-4 mr-2" />
            Lưu thay đổi
          </Button>
          <Button variant="outline">Hủy</Button>
        </div>
      </div>
    </main>
  )
}
