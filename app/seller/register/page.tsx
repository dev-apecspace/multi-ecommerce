"use client"

import { useState } from "react"
import { FileCheck, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useLoading } from "@/hooks/use-loading"
import { toast } from "@/hooks/use-toast"

export default function SellerRegisterPage() {
  const { setIsLoading } = useLoading()
  const [step, setStep] = useState<"personal" | "business" | "documents" | "review">("personal")
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    businessName: "",
    taxId: "",
    address: "",
    businessLicense: null as File | null,
    idCard: null as File | null,
    idCardBack: null as File | null,
  })

  const handleFileChange = (key: string, file: File | null) => {
    setFormData((prev) => ({ ...prev, [key]: file }))
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast({
        title: "Đăng ký cửa hàng thành công",
        description: "Chúng tôi sẽ kiểm duyệt trong vòng 24–48 giờ.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const steps = [
    { id: "personal", label: "Thông tin cá nhân", icon: "👤" },
    { id: "business", label: "Thông tin kinh doanh", icon: "🏢" },
    { id: "documents", label: "Tài liệu", icon: "📄" },
    { id: "review", label: "Kiểm tra", icon: "✓" },
  ]

  return (
    <main className="min-h-screen bg-surface dark:bg-slate-950">
      <div className="container-viewport py-12">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Đăng ký bán hàng</h1>
          <p className="text-muted-foreground mb-8">
            Trở thành người bán trên Sàn TMĐT APECSPACE và kiếm tiền từ cửa hàng của bạn
          </p>

          {/* Steps */}
          <div className="mb-8 flex flex-col md:flex-row gap-4">
            {steps.map((s, idx) => (
              <div
                key={s.id}
                className={`flex-1 flex items-center gap-3 p-4 rounded-lg border transition-all cursor-pointer ${
                  step === s.id
                    ? "bg-primary/10 border-primary"
                    : step > s.id
                      ? "bg-green-50 dark:bg-green-950 border-green-300"
                      : "border-border"
                }`}
                onClick={() => setStep(s.id as any)}
              >
                <div className="text-2xl">{s.icon}</div>
                <div>
                  <p className="text-xs text-muted-foreground">Bước {idx + 1}</p>
                  <p className="font-semibold text-sm">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{steps.find((s) => s.id === step)?.label}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {step === "personal" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Họ</label>
                      <Input
                        placeholder="Nhập họ"
                        value={formData.firstName}
                        onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Tên</label>
                      <Input
                        placeholder="Nhập tên"
                        value={formData.lastName}
                        onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <Input
                      type="email"
                      placeholder="email@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Số điện thoại</label>
                    <Input
                      placeholder="0912345678"
                      value={formData.phone}
                      onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              {step === "business" && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Tên cửa hàng</label>
                    <Input
                      placeholder="Tên cửa hàng của bạn"
                      value={formData.businessName}
                      onChange={(e) => setFormData((prev) => ({ ...prev, businessName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Mã số thuế (GPKD)</label>
                    <Input
                      placeholder="0123456789"
                      value={formData.taxId}
                      onChange={(e) => setFormData((prev) => ({ ...prev, taxId: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Địa chỉ kinh doanh</label>
                    <Input
                      placeholder="Địa chỉ"
                      value={formData.address}
                      onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              {step === "documents" && (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg flex gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-700">
                      <p className="font-semibold mb-1">Tài liệu cần chuẩn bị:</p>
                      <ul className="space-y-1 text-xs">
                        <li>- CMND/CCCD mặt trước và mặt sau</li>
                        <li>- Giấy phép kinh doanh</li>
                        <li>- Ảnh chân dung rõ ràng</li>
                      </ul>
                    </div>
                  </div>

                  <FileUploadField
                    label="CMND/CCCD (Mặt trước)"
                    icon="🆔"
                    onFile={(file) => handleFileChange("idCard", file)}
                  />

                  <FileUploadField
                    label="CMND/CCCD (Mặt sau)"
                    icon="🆔"
                    onFile={(file) => handleFileChange("idCardBack", file)}
                  />

                  <FileUploadField
                    label="Giấy phép kinh doanh"
                    icon="📄"
                    onFile={(file) => handleFileChange("businessLicense", file)}
                  />
                </div>
              )}

              {step === "review" && (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg flex gap-3 mb-4">
                    <FileCheck className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-green-700">Tất cả thông tin đã hoàn tất</p>
                      <p className="text-sm text-green-600">Kiểm tra lại thông tin trước khi gửi</p>
                    </div>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="border-t border-border pt-3">
                      <p className="text-muted-foreground">Họ tên</p>
                      <p className="font-semibold">
                        {formData.firstName} {formData.lastName}
                      </p>
                    </div>
                    <div className="border-t border-border pt-3">
                      <p className="text-muted-foreground">Tên cửa hàng</p>
                      <p className="font-semibold">{formData.businessName}</p>
                    </div>
                    <div className="border-t border-border pt-3">
                      <p className="text-muted-foreground">Email</p>
                      <p className="font-semibold">{formData.email}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex gap-4 pt-6 border-t border-border">
                {step !== "personal" && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      const stepOrder: any[] = ["personal", "business", "documents", "review"]
                      const idx = stepOrder.indexOf(step)
                      setStep(stepOrder[idx - 1])
                    }}
                  >
                    Quay lại
                  </Button>
                )}
                {step !== "review" && (
                  <Button
                    className="flex-1"
                    onClick={() => {
                      const stepOrder: any[] = ["personal", "business", "documents", "review"]
                      const idx = stepOrder.indexOf(step)
                      setStep(stepOrder[idx + 1])
                    }}
                  >
                    Tiếp tục
                  </Button>
                )}
                {step === "review" && (
                  <Button className="flex-1" onClick={handleSubmit}>
                    Gửi đăng ký
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}

function FileUploadField({
  label,
  icon,
  onFile,
}: {
  label: string
  icon: string
  onFile: (file: File | null) => void
}) {
  const [fileName, setFileName] = useState<string | null>(null)

  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <div className="mt-2 border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors">
        <label className="cursor-pointer block">
          <div className="text-3xl mb-2">{icon}</div>
          <p className="text-sm font-medium">Nhấp để tải lên hoặc kéo thả</p>
          <p className="text-xs text-muted-foreground">PNG, JPG, GIF tối đa 10MB</p>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) {
                setFileName(file.name)
                onFile(file)
              }
            }}
            className="hidden"
          />
        </label>
        {fileName && <p className="text-xs text-green-600 font-semibold mt-3">✓ {fileName} tải lên</p>}
      </div>
    </div>
  )
}
