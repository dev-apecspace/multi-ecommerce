"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { VendorApprovalBanner } from "@/components/vendor-approval-banner"

export default function SellerProfilePage() {
  return (
    <main className="p-6">
      <VendorApprovalBanner />
      <h1 className="text-3xl font-bold mb-8">Hồ sơ shop</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Thông tin cơ bản</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Tên shop</Label>
              <Input value="Samsung Việt Nam" className="mt-2" />
            </div>
            <div>
              <Label>Email</Label>
              <Input value="contact@samsung-vn.vn" className="mt-2" />
            </div>
            <div>
              <Label>Điện thoại</Label>
              <Input value="1900.123.456" className="mt-2" />
            </div>
            <div>
              <Label>Địa chỉ</Label>
              <Input value="Hà Nội, Việt Nam" className="mt-2" />
            </div>
            <Button>Lưu thay đổi</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Thống kê</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span>Đánh giá trung bình</span>
              <span className="font-bold">4.9 ⭐</span>
            </div>
            <div className="flex justify-between border-t border-border pt-3">
              <span>Người theo dõi</span>
              <span className="font-bold">450K</span>
            </div>
            <div className="flex justify-between border-t border-border pt-3">
              <span>Sản phẩm hoạt động</span>
              <span className="font-bold">850</span>
            </div>
            <div className="flex justify-between border-t border-border pt-3">
              <span>Hoa hồng hiện tại</span>
              <span className="font-bold text-orange-600">5%</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
