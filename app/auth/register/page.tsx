'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Eye, EyeOff, Loader2, User, Phone } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/lib/auth-context'

export default function RegisterPage() {
  const router = useRouter()
  const { signup, loading, error, clearError } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
  })
  const [localError, setLocalError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError('')

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

    try {
      await signup(formData.email, formData.password, formData.name, formData.phone)
      router.push('/client')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Đăng ký thất bại'
      setLocalError(message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-lg border border-border p-8">
          <h1 className="text-3xl font-bold text-center mb-2">Sàn TMĐT APECSPACE</h1>
          <p className="text-center text-muted-foreground mb-8">Tạo tài khoản mua sắm</p>

          <form onSubmit={handleRegister} className="space-y-4">
            {(localError || error) && (
              <div className="p-3 bg-red-100 text-red-800 rounded-lg text-sm">
                {localError || error}
              </div>
            )}

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
              <label className="block text-sm font-medium mb-2">Số điện thoại (tùy chọn)</label>
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

            <label className="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" className="mt-1" required disabled={loading} />
              <span className="text-xs text-muted-foreground">
                Tôi đồng ý với{' '}
                <Link href="/client/dieu-khoan-dich-vu" className="text-primary hover:underline">
                  Điều khoản dịch vụ
                </Link>{' '}
                và{' '}
                <Link href="/client/chinh-sach-bao-mat" className="text-primary hover:underline">
                  Chính sách bảo mật
                </Link>
              </span>
            </label>

            <Button
              type="submit"
              disabled={!formData.email || !formData.password || !formData.name || loading}
              className="w-full"
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Đăng ký
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Đã có tài khoản?{' '}
              <Link href="/auth/login" className="text-primary hover:underline">
                Đăng nhập ngay
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
