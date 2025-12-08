'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Eye, EyeOff, Loader2, User, Phone, Store } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MultiDocumentUpload } from '@/components/multi-document-upload'
import { useAuth } from '@/lib/auth-context'

export default function VendorRegisterPage() {
  const router = useRouter()
  const { vendorSignup, loading, error, clearError } = useAuth()
  const [step, setStep] = useState('account')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
    shopName: '',
    logo: '',
    businessDocuments: [] as Array<{ name: string; url: string }>,
  })
  const [localError, setLocalError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleNext = () => {
    setLocalError('')
    if (step === 'account') {
      if (!formData.email || !formData.password || !formData.name) {
        setLocalError('Vui lòng điền tất cả các trường bắt buộc')
        return
      }
      if (formData.password !== formData.confirmPassword) {
        setLocalError('Mật khẩu không khớp')
        return
      }
      if (formData.password.length < 8) {
        setLocalError('Mật khẩu phải có ít nhất 8 ký tự')
        return
      }
      setStep('business')
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError('')

    if (!formData.shopName || !formData.logo || formData.businessDocuments.length === 0) {
      setLocalError('Vui lòng điền Tên shop, tải lên logo và ít nhất 1 tài liệu')
      return
    }

    try {
      await vendorSignup(formData)
      router.push('/auth/vendor-pending')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Đăng ký thất bại'
      setLocalError(message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-card rounded-lg border border-border p-8">
          <h1 className="text-3xl font-bold text-center mb-2">Sàn TMĐT</h1>
          <p className="text-center text-muted-foreground mb-8">Đăng ký tài khoản nhà bán hàng</p>

          {step === 'account' && (
            <form onSubmit={(e) => { e.preventDefault(); handleNext() }} className="space-y-4">
              {(localError || error) && (
                <div className="p-3 bg-red-100 text-red-800 rounded-lg text-sm">
                  {localError || error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Tên đầy đủ</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                    <Input
                      type="text"
                      name="name"
                      placeholder="Tên của bạn"
                      value={formData.name}
                      onChange={handleChange}
                      className="pl-10"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Số điện thoại</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                    <Input
                      type="tel"
                      name="phone"
                      placeholder="Số điện thoại"
                      value={formData.phone}
                      onChange={handleChange}
                      className="pl-10"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="email"
                    name="email"
                    placeholder="Email của bạn"
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Mật khẩu</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="Mật khẩu (ít nhất 8 ký tự)"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-10 pr-10 py-2 border border-border rounded-lg"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Xác nhận mật khẩu</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="Xác nhận mật khẩu"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full pl-10 py-2 border border-border rounded-lg"
                    disabled={loading}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full">
                Tiếp tục
              </Button>
            </form>
          )}

          {step === 'business' && (
            <form onSubmit={handleRegister} className="space-y-4">
              {(localError || error) && (
                <div className="p-3 bg-red-100 text-red-800 rounded-lg text-sm">
                  {localError || error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">Tên cửa hàng *</label>
                <div className="relative">
                  <Store className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="text"
                    name="shopName"
                    placeholder="Tên cửa hàng của bạn"
                    value={formData.shopName}
                    onChange={handleChange}
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Logo cửa hàng * (JPG, PNG - tối đa 5MB)</label>
                {formData.logo ? (
                  <div className="flex items-center gap-3 p-4 border border-green-300 bg-green-50 rounded-lg">
                    <img 
                      src={formData.logo} 
                      alt="Logo preview" 
                      className="h-16 w-16 object-contain rounded"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-800">Logo đã tải lên</p>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, logo: '' }))}
                        className="text-xs text-green-600 hover:underline mt-1"
                        disabled={loading}
                      >
                        Thay đổi
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => document.getElementById('logo-upload')?.click()}
                    className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                  >
                    <p className="text-sm font-medium">Kéo thả logo hoặc click để chọn</p>
                    <p className="text-xs text-muted-foreground mt-1">JPG, PNG (tối đa 5MB)</p>
                    <input
                      id="logo-upload"
                      type="file"
                      accept="image/jpeg,image/png"
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        
                        if (file.size > 5 * 1024 * 1024) {
                          setLocalError('Logo quá lớn. Tối đa 5MB')
                          return
                        }
                        
                        if (!['image/jpeg', 'image/png'].includes(file.type)) {
                          setLocalError('Chỉ chấp nhận JPG hoặc PNG')
                          return
                        }

                        try {
                          const formData = new FormData()
                          formData.append('file', file)
                          
                          const response = await fetch('/api/upload', {
                            method: 'POST',
                            body: formData,
                          })
                          
                          if (!response.ok) throw new Error('Upload thất bại')
                          
                          const data = await response.json()
                          setFormData(prev => ({ ...prev, logo: data.url }))
                          setLocalError('')
                        } catch (err) {
                          setLocalError('Upload logo thất bại')
                        }
                      }}
                      className="hidden"
                      disabled={loading}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Hồ sơ / Tiệp đính kèm * (Thêm một hoặc nhiều tài liệu)</label>
                <MultiDocumentUpload
                  onDocumentsChange={(docs) => {
                    setFormData(prev => ({
                      ...prev,
                      businessDocuments: docs.map(doc => ({ name: doc.name, url: doc.url })),
                    }))
                  }}
                  disabled={loading}
                  minDocuments={1}
                />
              </div>

              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" className="mt-1" required disabled={loading} />
                <span className="text-xs text-muted-foreground">
                  Tôi xác nhận tất cả thông tin trên là chính xác và đúng sự thật. Tôi đồng ý với{' '}
                  <Link href="/client/dieu-khoan-dich-vu" className="text-primary hover:underline">
                    Điều khoản dịch vụ
                  </Link>{' '}
                  và{' '}
                  <Link href="/client/chinh-sach-bao-mat" className="text-primary hover:underline">
                    Chính sách bảo mật
                  </Link>
                </span>
              </label>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep('account')}
                  className="w-full"
                  disabled={loading}
                >
                  Quay lại
                </Button>
                <Button
                  type="submit"
                  disabled={!formData.shopName || !formData.logo || formData.businessDocuments.length === 0 || loading}
                  className="w-full"
                >
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Đăng ký
                </Button>
              </div>
            </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Đã có tài khoản?{' '}
              <Link href="/auth/login?type=vendor" className="text-primary hover:underline">
                Đăng nhập ngay
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
