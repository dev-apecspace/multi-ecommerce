'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Building2, CheckCircle2, ChevronLeft, ChevronRight, Eye, EyeOff, FileText, Loader2, Lock, Mail, MapPin, Phone, ShieldCheck, Store, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { VendorRegistrationDocumentsUpload } from '@/components/vendor-registration-documents-upload'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/lib/auth-context'

type BusinessDocument = { name: string; url?: string; documentType: string; file: File }

const required = <span className="text-destructive"> *</span>

export default function VendorRegisterPage() {
  const router = useRouter()
  const { vendorSignup, loading, error, clearError } = useAuth()
  const { toast } = useToast()
  const [step, setStep] = useState<'account' | 'shop'>('account')
  const [showPassword, setShowPassword] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const businessDocumentsRef = useRef<BusinessDocument[]>([])
  const [localError, setLocalError] = useState('')
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: '',
    shopName: '', shopDescription: '', businessAddress: '', taxId: '', businessLicense: '', logo: '',
    businessDocuments: [] as BusinessDocument[],
  })

  const update = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
  }

  const setError = (message: string) => {
    setLocalError(message)
    toast({ title: 'Vui lòng kiểm tra thông tin', description: message, variant: 'destructive' })
  }

  const validateAccount = () => {
    clearError()
    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim() || !formData.password || !formData.confirmPassword) {
      setError('Vui lòng điền đầy đủ thông tin tài khoản bắt buộc.')
      return false
    }
    if (formData.password.length < 8) { setError('Mật khẩu cần có ít nhất 8 ký tự.'); return false }
    if (formData.password !== formData.confirmPassword) { setError('Xác nhận mật khẩu chưa khớp.'); return false }
    setLocalError('')
    return true
  }

  const validateShop = () => {
    clearError()
    const missingFields = [
      !formData.shopName.trim() && 'Tên cửa hàng',
      !formData.shopDescription.trim() && 'Mô tả cửa hàng',
      !formData.businessAddress.trim() && 'Địa chỉ kinh doanh',
      !formData.taxId.trim() && 'Mã số thuế',
      !formData.businessLicense.trim() && 'Số giấy phép kinh doanh',
      !logoFile && 'Logo cửa hàng',
      !businessDocumentsRef.current.some((document) => document.file) && 'Ít nhất một hồ sơ/tệp đính kèm',
    ].filter(Boolean)
    if (missingFields.length) { setError(`Bạn chưa hoàn tất: ${missingFields.join(', ')}.`); return false }
    if (!acceptedTerms) { setError('Bạn cần xác nhận thông tin và đồng ý với các chính sách.'); return false }
    setLocalError('')
    return true
  }

  const uploadLogo = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!['image/jpeg', 'image/png'].includes(file.type)) { setError('Logo chỉ hỗ trợ định dạng JPG hoặc PNG.'); return }
    if (file.size > 5 * 1024 * 1024) { setError('Logo không được vượt quá 5MB.'); return }
    setLogoFile(file)
    setFormData((current) => ({ ...current, logo: URL.createObjectURL(file) }))
    toast({ title: 'Đã chọn logo', description: 'Logo sẽ chỉ được tải lên khi bạn gửi đăng ký.' })
    event.target.value = ''
  }

  const uploadRegistrationFiles = async () => {
    if (!logoFile) throw new Error('Vui lòng chọn logo cửa hàng.')
    setUploadingLogo(true)
    try {
      const logoPayload = new FormData()
      logoPayload.append('file', logoFile)
      logoPayload.append('shopName', formData.shopName)
      const logoResponse = await fetch('/api/auth/vendor-register/upload-logo', { method: 'POST', body: logoPayload })
      const logoResult = await logoResponse.json()
      if (!logoResponse.ok) throw new Error(logoResult.error || 'Không thể tải logo lên.')

      const uploadedDocuments = await Promise.all(businessDocumentsRef.current.map(async (document) => {
        const payload = new FormData()
        payload.append('file', document.file)
        payload.append('shopName', formData.shopName)
        const response = await fetch('/api/auth/vendor-register/upload-document', { method: 'POST', body: payload })
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || `Không thể tải ${document.name}.`)
        return { name: result.fileName || document.name, url: result.url, documentType: document.documentType }
      }))
      return { logo: logoResult.url as string, businessDocuments: uploadedDocuments }
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!validateShop()) return
    try {
      const uploadedFiles = await uploadRegistrationFiles()
      await vendorSignup({ ...formData, ...uploadedFiles })
      router.push('/auth/vendor-pending')
    } catch (registrationError) {
      setError(registrationError instanceof Error ? registrationError.message : 'Đăng ký nhà bán hàng thất bại.')
    }
  }

  const errorMessage = localError || error
  const fieldClass = 'h-11 border-slate-200 bg-white shadow-sm focus-visible:ring-orange-500'

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 px-4 py-8 sm:py-12">
      <section className="mx-auto w-full max-w-4xl overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-xl shadow-orange-950/5">
        <header className="border-b border-orange-100 bg-[linear-gradient(120deg,#fff7ed_0%,#ffffff_52%,#fffaf0_100%)] px-6 py-7 sm:px-10">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-orange-600"><Store className="h-4 w-4" /> APECSPACE Marketplace</p>
              <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Đăng ký trở thành nhà bán hàng</h1>
              <p className="mt-2 text-sm text-slate-600">Cung cấp hồ sơ một lần, chủ động cập nhật tại Cài đặt shop sau khi đăng nhập.</p>
            </div>
            <div className="rounded-xl border border-orange-200 bg-white/80 px-4 py-3 text-sm shadow-sm">
              <p className="font-semibold text-slate-800">Hồ sơ xét duyệt</p>
              <p className="mt-1 text-xs text-slate-500">Thông tin được bảo mật</p>
            </div>
          </div>
          <ol className="mt-7 grid grid-cols-2 gap-3" aria-label="Tiến trình đăng ký">
            {[['account', '1', 'Tài khoản', 'Thông tin chủ shop'], ['shop', '2', 'Hồ sơ cửa hàng', 'Thông tin kinh doanh']].map(([id, number, label, note]) => {
              const active = step === id
              const complete = step === 'shop' && id === 'account'
              return <li key={id} className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${active ? 'border-orange-500 bg-orange-500 text-white shadow-sm' : complete ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-white text-slate-500'}`}>
                <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${active ? 'bg-white text-orange-600' : complete ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'}`}>{complete ? <CheckCircle2 className="h-4 w-4" /> : number}</span>
                <span><span className="block text-sm font-bold">{label}</span><span className={`block text-xs ${active ? 'text-orange-100' : 'opacity-75'}`}>{note}</span></span>
              </li>
            })}
          </ol>
        </header>

        <div className="px-6 py-7 sm:px-10 sm:py-9">
          {errorMessage && <div role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{errorMessage}</div>}

          {step === 'account' ? (
            <form onSubmit={(event) => { event.preventDefault(); if (validateAccount()) setStep('shop') }} className="space-y-6">
              <div><h2 className="text-lg font-bold text-slate-900">Thông tin tài khoản</h2><p className="mt-1 text-sm text-slate-500">Dùng để liên hệ và quản lý cửa hàng của bạn.</p></div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div><Label htmlFor="name">Họ và tên{required}</Label><div className="relative mt-2"><User className="absolute left-3 top-3 h-5 w-5 text-slate-400" /><Input id="name" name="name" value={formData.name} onChange={update} placeholder="Nguyễn Văn A" className={`${fieldClass} pl-10`} disabled={loading} /></div></div>
                <div><Label htmlFor="phone">Số điện thoại{required}</Label><div className="relative mt-2"><Phone className="absolute left-3 top-3 h-5 w-5 text-slate-400" /><Input id="phone" name="phone" value={formData.phone} onChange={update} placeholder="09xx xxx xxx" className={`${fieldClass} pl-10`} disabled={loading} /></div></div>
                <div className="sm:col-span-2"><Label htmlFor="email">Email đăng nhập{required}</Label><div className="relative mt-2"><Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" /><Input id="email" name="email" type="email" value={formData.email} onChange={update} placeholder="email@doanhnghiep.vn" className={`${fieldClass} pl-10`} disabled={loading} /></div></div>
                <div><Label htmlFor="password">Mật khẩu{required}</Label><div className="relative mt-2"><Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" /><Input id="password" name="password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={update} placeholder="Tối thiểu 8 ký tự" className={`${fieldClass} pl-10 pr-11`} disabled={loading} /><button type="button" aria-label="Hiện hoặc ẩn mật khẩu" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-slate-400 hover:text-slate-700">{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button></div></div>
                <div><Label htmlFor="confirmPassword">Xác nhận mật khẩu{required}</Label><div className="relative mt-2"><Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" /><Input id="confirmPassword" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={update} placeholder="Nhập lại mật khẩu" className={`${fieldClass} pl-10`} disabled={loading} /></div></div>
              </div>
              <div className="flex justify-end border-t border-slate-100 pt-6"><Button type="submit" className="h-11 min-w-40 bg-orange-600 px-6 font-semibold hover:bg-orange-700">Tiếp tục <ChevronRight className="ml-2 h-4 w-4" /></Button></div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-7">
              <div className="flex flex-col justify-between gap-3 sm:flex-row"><div><h2 className="text-lg font-bold text-slate-900">Hồ sơ cửa hàng</h2><p className="mt-1 text-sm text-slate-500">Các mục có dấu <span className="text-destructive">*</span> là bắt buộc để gửi duyệt.</p></div><div className="flex items-center gap-2 text-xs font-medium text-emerald-700"><ShieldCheck className="h-4 w-4" /> Dữ liệu hiển thị cho quản trị viên</div></div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div><Label htmlFor="shopName">Tên cửa hàng{required}</Label><div className="relative mt-2"><Store className="absolute left-3 top-3 h-5 w-5 text-slate-400" /><Input id="shopName" name="shopName" value={formData.shopName} onChange={update} placeholder="Tên hiển thị của cửa hàng" className={`${fieldClass} pl-10`} disabled={loading} /></div></div>
                <div><Label htmlFor="taxId">Mã số thuế{required}</Label><Input id="taxId" name="taxId" value={formData.taxId} onChange={update} placeholder="Ví dụ: 0319596563" className={`mt-2 ${fieldClass}`} disabled={loading} /></div>
                <div className="sm:col-span-2"><Label htmlFor="shopDescription">Mô tả cửa hàng{required}</Label><textarea id="shopDescription" name="shopDescription" value={formData.shopDescription} onChange={update} placeholder="Giới thiệu ngắn về sản phẩm, ngành hàng hoặc thế mạnh của cửa hàng" rows={4} className="mt-2 flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-orange-500 disabled:cursor-not-allowed disabled:opacity-50" disabled={loading} /></div>
                <div className="sm:col-span-2"><Label htmlFor="businessAddress">Địa chỉ kinh doanh{required}</Label><div className="relative mt-2"><MapPin className="absolute left-3 top-3 h-5 w-5 text-slate-400" /><Input id="businessAddress" name="businessAddress" value={formData.businessAddress} onChange={update} placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành" className={`${fieldClass} pl-10`} disabled={loading} /></div></div>
                <div className="sm:col-span-2"><Label htmlFor="businessLicense">Số giấy phép kinh doanh{required}</Label><div className="relative mt-2"><Building2 className="absolute left-3 top-3 h-5 w-5 text-slate-400" /><Input id="businessLicense" name="businessLicense" value={formData.businessLicense} onChange={update} placeholder="Số giấy chứng nhận đăng ký kinh doanh" className={`${fieldClass} pl-10`} disabled={loading} /></div></div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-5"><Label htmlFor="logo-upload">Logo cửa hàng{required}</Label><p className="mt-1 text-xs text-slate-500">JPG, PNG · dung lượng tối đa 5MB · chỉ tải lên khi gửi đăng ký</p>{uploadingLogo ? <div className="mt-4 flex items-center justify-center gap-3 rounded-lg border border-orange-200 bg-orange-50 px-4 py-7 text-sm font-semibold text-orange-700"><Loader2 className="h-5 w-5 animate-spin" /> Đang tải hồ sơ đăng ký...</div> : formData.logo ? <div className="mt-4 flex items-center gap-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3"><img src={formData.logo} alt="Logo cửa hàng" className="h-14 w-14 rounded-lg object-contain bg-white" /><div className="min-w-0 flex-1"><p className="flex items-center gap-1 text-sm font-semibold text-emerald-800"><CheckCircle2 className="h-4 w-4" /> Logo đã chọn</p><p className="mt-1 text-xs text-emerald-700">Sẽ tải lên khi gửi đăng ký</p><button type="button" onClick={() => { setLogoFile(null); setFormData((current) => ({ ...current, logo: '' })) }} className="mt-1 text-xs font-medium text-orange-700 hover:underline">Thay đổi logo</button></div></div> : <label htmlFor="logo-upload" className="mt-4 flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-orange-200 bg-white px-4 py-7 text-center transition hover:border-orange-500 hover:bg-orange-50"><span><Store className="mx-auto mb-2 h-6 w-6 text-orange-500" /><span className="block text-sm font-semibold text-slate-700">Chọn logo cửa hàng</span><span className="mt-1 block text-xs text-slate-500">File chỉ được lưu tạm trong trình duyệt</span></span></label>}<input id="logo-upload" type="file" accept="image/jpeg,image/png" onChange={uploadLogo} className="sr-only" disabled={loading || uploadingLogo} /></div>
              <div className="rounded-xl border border-slate-200 p-5"><div className="mb-4"><Label>Hồ sơ / tệp đính kèm{required}</Label><p className="mt-1 text-xs text-slate-500">Tệp chỉ được tải vào hệ thống khi bạn gửi đăng ký.</p></div><VendorRegistrationDocumentsUpload documents={formData.businessDocuments} onChange={(documents) => { businessDocumentsRef.current = documents; setFormData((current) => ({ ...current, businessDocuments: documents })) }} disabled={loading || uploadingLogo} /></div>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-orange-100 bg-orange-50/70 p-4 text-sm text-slate-700"><input type="checkbox" checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500" disabled={loading} /><span>Tôi xác nhận các thông tin kê khai là chính xác và đồng ý với <Link href="/api/legal-documents/view/terms-of-service" target="_blank" rel="noopener noreferrer" className="font-medium text-orange-700 underline underline-offset-2">Điều khoản dịch vụ</Link> cùng <Link href="/api/legal-documents/view/privacy-policy" target="_blank" rel="noopener noreferrer" className="font-medium text-orange-700 underline underline-offset-2">Chính sách bảo mật</Link>.</span></label>
              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-between"><Button type="button" variant="outline" onClick={() => { setLocalError(''); setStep('account') }} className="h-11 sm:min-w-36" disabled={loading || uploadingLogo}><ChevronLeft className="mr-2 h-4 w-4" /> Quay lại</Button><Button type="submit" className="h-11 bg-orange-600 px-7 font-semibold hover:bg-orange-700" disabled={loading || uploadingLogo}>{(loading || uploadingLogo) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{uploadingLogo ? 'Đang tải logo...' : 'Gửi đăng ký'}</Button></div>
            </form>
          )}
          <p className="mt-7 text-center text-sm text-slate-600">Đã có tài khoản? <Link href="/auth/login?type=vendor" className="font-semibold text-orange-700 hover:underline">Đăng nhập ngay</Link></p>
        </div>
      </section>
    </main>
  )
}
