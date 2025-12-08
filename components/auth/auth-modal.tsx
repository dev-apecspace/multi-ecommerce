"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/lib/auth-context"

interface AuthModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialTab?: "login" | "register"
}

export function AuthModal({ open, onOpenChange, initialTab = "login" }: AuthModalProps) {
  const router = useRouter()
  const { login, signup, loading, error } = useAuth()
  const [activeTab, setActiveTab] = useState(initialTab)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [name, setName] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const handleLogin = async () => {
    try {
      const userData = await login(email, password)
      onOpenChange(false)
      const redirectPath = userData.role === 'admin' ? '/admin' : userData.role === 'vendor' ? '/seller' : '/client'
      router.push(redirectPath)
    } catch {
      console.error("Login failed")
    }
  }

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      alert("Mật khẩu không khớp!")
      return
    }
    if (password.length < 8) {
      alert("Mật khẩu phải có ít nhất 8 ký tự!")
      return
    }
    try {
      const userData = await signup(email, password, name)
      onOpenChange(false)
      const redirectPath = userData.role === 'admin' ? '/admin' : userData.role === 'vendor' ? '/seller' : '/client'
      router.push(redirectPath)
    } catch {
      console.error("Registration failed")
    }
  }

  const handleVendorRegister = () => {
    onOpenChange(false)
    router.push("/auth/vendor-register")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Sàn TMĐT</DialogTitle>
          <DialogClose />
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Đăng nhập</TabsTrigger>
            <TabsTrigger value="register">Đăng ký</TabsTrigger>
          </TabsList>

          {/* Login Tab */}
          <TabsContent value="login" className="space-y-4 mt-4">
            {error && (
              <div className="p-3 bg-red-100 text-red-800 rounded-lg text-sm">
                {error}
              </div>
            )}
            <p className="text-sm text-muted-foreground mb-4">Đăng nhập bằng email hoặc số điện thoại</p>
            <div className="space-y-3">
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
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
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
              <Button onClick={handleLogin} disabled={!email || !password || loading} className="w-full">
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Đăng nhập
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              <a href="#" className="text-primary hover:underline">
                Quên mật khẩu?
              </a>
            </p>



            {/* Social Login */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background dark:bg-slate-950 px-2 text-muted-foreground">Hoặc</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Button variant="outline" size="sm" className="text-xs bg-transparent">
                Google
              </Button>
              <Button variant="outline" size="sm" className="text-xs bg-transparent">
                Facebook
              </Button>
              <Button variant="outline" size="sm" className="text-xs bg-transparent">
                Apple
              </Button>
            </div>
          </TabsContent>

          {/* Register Tab */}
          <TabsContent value="register" className="space-y-4 mt-4">
            {error && (
              <div className="p-3 bg-red-100 text-red-800 rounded-lg text-sm">
                {error}
              </div>
            )}
            <p className="text-sm text-muted-foreground mb-4">Tạo tài khoản Sàn TMĐT của bạn</p>
            <div className="space-y-3">
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Tên của bạn"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10"
                  disabled={loading}
                />
              </div>

              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  disabled={loading}
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Mật khẩu (ít nhất 8 ký tự)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 border border-border rounded-lg"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <input
                  type="password"
                  placeholder="Xác nhận mật khẩu"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 py-2 border border-border rounded-lg"
                  disabled={loading}
                />
              </div>

              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" className="mt-1" required disabled={loading} />
                <span className="text-xs text-muted-foreground">
                  Tôi đồng ý với{" "}
                  <a href="/client/dieu-khoan-dich-vu" className="text-primary hover:underline">
                    Điều khoản dịch vụ
                  </a>{" "}
                  và{" "}
                  <a href="/client/chinh-sach-bao-mat" className="text-primary hover:underline">
                    Chính sách bảo mật
                  </a>
                </span>
              </label>

              <Button
                onClick={handleRegister}
                disabled={!email || !name || password.length < 8 || !confirmPassword || loading}
                className="w-full"
              >
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Đăng ký
              </Button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background dark:bg-slate-950 px-2 text-muted-foreground">Hoặc</span>
                </div>
              </div>

              <Button
                type="button"
                onClick={handleVendorRegister}
                variant="outline"
                className="w-full"
              >
                Đăng ký bán hàng
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
