"use client"

import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function SellerWithdrawPage() {
  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold mb-8">Rút tiền</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Số dư khả dụng</p>
            <p className="text-3xl font-bold text-primary mt-2">125.5M₫</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Đang chờ rút</p>
            <p className="text-3xl font-bold text-yellow-600 mt-2">25.0M₫</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Đã rút</p>
            <p className="text-3xl font-bold text-green-600 mt-2">500.0M₫</p>
          </CardContent>
        </Card>
      </div>

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Yêu cầu rút tiền mới</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Số tiền muốn rút</Label>
            <div className="flex gap-2 mt-2">
              <Input type="number" placeholder="Nhập số tiền" />
              <span className="pt-2">₫</span>
            </div>
          </div>
          <div>
            <Label>Tài khoản ngân hàng</Label>
            <Input placeholder="0123456789" className="mt-2" />
          </div>
          <div>
            <Label>Ngân hàng</Label>
            <Input placeholder="VietcomBank" className="mt-2" />
          </div>
          <Button className="w-full">
            <Download className="h-4 w-4 mr-2" />
            Yêu cầu rút tiền
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
