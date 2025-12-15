'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/lib/auth-context'

export default function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, loading, error, clearError } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [localError, setLocalError] = useState('')

  const accountType = searchParams.get('type') || 'customer'
  const callback = searchParams.get('callback')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError('')

    if (!email || !password) {
      setLocalError('Vui lòng nhập email và mật khẩu')
      return
    }

    try {
      const userData = await login(email, password)
      
      let redirectUrl: string
      
      if (userData.role === 'vendor') {
        redirectUrl = '/seller'
      } else if (userData.role === 'admin') {
        redirectUrl = '/admin'
      } else if (callback) {
        redirectUrl = callback
      } else {
        redirectUrl = '/client'
      }
      
      router.replace(redirectUrl)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Đăng nhập thất bại'
      setLocalError(message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-lg border border-border p-8">
          <h1 className="text-3xl font-bold text-center mb-2">Sàn TMĐT APECSPACE</h1>
          <p className="text-center text-muted-foreground mb-8">
            {accountType === 'vendor' ? 'Đăng nhập Nhà bán hàng' : 'Đăng nhập'}
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            {(localError || error) && (
              <div className="p-3 bg-red-100 text-red-800 rounded-lg text-sm">
                {localError || error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">Email hoặc số điện thoại</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Email hoặc số điện thoại"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  placeholder="Mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

            <Button
              type="submit"
              disabled={!email || !password || loading}
              className="w-full"
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Đăng nhập
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Chưa có tài khoản?{' '}
              <Link
                href={accountType === 'vendor' ? '/auth/vendor-register' : '/auth/register'}
                className="text-primary hover:underline"
              >
                Đăng ký ngay
              </Link>
            </p>
          </div>

          {accountType !== 'vendor' && (
            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-sm text-center text-muted-foreground mb-4">Bạn là nhà bán hàng?</p>
              <Link href="/auth/vendor-register" className="w-full">
                <Button variant="outline" className="w-full">
                  Đăng ký bán hàng
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
