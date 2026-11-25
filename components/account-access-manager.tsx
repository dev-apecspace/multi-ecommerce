'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { Check, Clipboard, KeyRound, Loader2, Pencil, ShieldCheck, UserPlus } from 'lucide-react'
import { ACCOUNT_PERMISSION_OPTIONS, AccountScope } from '@/lib/account-permissions'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type ManagedAccount = { id: number; name: string; email: string; phone?: string | null; status: string; permissions: string[] }

export function AccountAccessManager({ scope, endpoint }: { scope: AccountScope; endpoint: string }) {
  const { user } = useAuth()
  const options = ACCOUNT_PERMISSION_OPTIONS[scope]
  const [accounts, setAccounts] = useState<ManagedAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [successPassword, setSuccessPassword] = useState('')
  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  const [newPermissions, setNewPermissions] = useState<string[]>(['dashboard'])
  const [editing, setEditing] = useState<number | null>(null)
  const [editPermissions, setEditPermissions] = useState<string[]>([])

  const loadAccounts = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(endpoint, { cache: 'no-store' })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Không tải được danh sách tài khoản.')
      setAccounts(result.data || [])
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không tải được danh sách tài khoản.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadAccounts() }, [endpoint])

  const togglePermission = (list: string[], key: string, setter: (value: string[]) => void) => {
    setter(list.includes(key) ? list.filter((item) => item !== key) : [...list, key])
  }

  const submitNewAccount = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSuccessPassword('')
    try {
      const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, permissions: newPermissions }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Không thể tạo tài khoản.')
      setForm({ name: '', email: '', phone: '' })
      setNewPermissions(['dashboard'])
      setSuccessPassword(result.initialPassword || '')
      await loadAccounts()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không thể tạo tài khoản.')
    } finally {
      setSaving(false)
    }
  }

  const updateAccount = async (userId: number, update: Record<string, unknown>) => {
    setSaving(true)
    setError('')
    try {
      const response = await fetch(endpoint, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, ...update }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Không thể cập nhật tài khoản.')
      setEditing(null)
      await loadAccounts()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không thể cập nhật tài khoản.')
    } finally {
      setSaving(false)
    }
  }

  const PermissionChecks = ({ selected, onToggle }: { selected: string[]; onToggle: (key: string) => void }) => <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{options.map((option) => {
    const canGrant = !Array.isArray(user?.permissions) || user.permissions.includes(option.key)
    return <label key={option.key} className={`flex min-h-11 items-center gap-2 rounded-lg border px-3 py-2 text-sm ${canGrant ? 'cursor-pointer border-slate-200 hover:bg-orange-50/50' : 'cursor-not-allowed border-slate-100 opacity-50'}`}><input type="checkbox" checked={selected.includes(option.key)} disabled={!canGrant || saving} onChange={() => onToggle(option.key)} className="h-4 w-4 accent-orange-600"/><span>{option.label}</span></label>
  })}</div>

  return <div className="space-y-6 p-4 sm:p-6">
    <header><p className="text-sm font-semibold uppercase tracking-wide text-orange-600">{scope === 'admin' ? 'Quản trị nền tảng' : 'Quản lý shop'}</p><h1 className="mt-1 text-2xl font-bold">Tài khoản & phân quyền</h1><p className="mt-2 text-sm text-muted-foreground">Tạo tài khoản riêng và chọn từng chức năng được phép truy cập bằng checkbox. Khi thay đổi quyền, nhân viên cần đăng nhập lại để áp dụng.</p></header>
    {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}
    {successPassword && <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"><p className="flex items-center gap-2 font-semibold"><Check className="h-4 w-4"/>Đã tạo tài khoản. Mật khẩu khởi tạo chỉ hiển thị lần này:</p><div className="mt-2 flex flex-wrap items-center gap-2"><code className="rounded bg-white px-3 py-2 font-semibold">{successPassword}</code><Button type="button" size="sm" variant="outline" onClick={() => void navigator.clipboard.writeText(successPassword)}><Clipboard className="mr-2 h-4 w-4"/>Sao chép</Button></div><p className="mt-2 text-xs">Gửi mật khẩu này cho nhân viên và đề nghị đổi sau lần đăng nhập đầu tiên.</p></div>}

    <Card><CardHeader><CardTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5 text-orange-600"/>Thêm tài khoản</CardTitle></CardHeader><CardContent><form onSubmit={submitNewAccount} className="space-y-5"><div className="grid gap-4 sm:grid-cols-3"><div><Label htmlFor="account-name">Họ tên</Label><Input id="account-name" className="mt-2" required maxLength={120} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })}/></div><div><Label htmlFor="account-email">Email đăng nhập</Label><Input id="account-email" type="email" className="mt-2" required maxLength={255} value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })}/></div><div><Label htmlFor="account-phone">Số điện thoại</Label><Input id="account-phone" className="mt-2" maxLength={30} value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })}/></div></div><div><h2 className="mb-2 flex items-center gap-2 text-sm font-semibold"><ShieldCheck className="h-4 w-4 text-emerald-600"/>Quyền được cấp</h2><PermissionChecks selected={newPermissions} onToggle={(key) => togglePermission(newPermissions, key, setNewPermissions)}/></div><Button disabled={saving} className="bg-orange-600 hover:bg-orange-700">{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <KeyRound className="mr-2 h-4 w-4"/>}Tạo tài khoản</Button></form></CardContent></Card>

    <Card><CardHeader className="flex-row items-center justify-between"><CardTitle>Danh sách tài khoản ({accounts.length})</CardTitle><Button type="button" variant="outline" size="sm" onClick={() => void loadAccounts()}>Làm mới</Button></CardHeader><CardContent className="space-y-3">{loading ? <p className="py-6 text-center text-sm text-muted-foreground">Đang tải tài khoản...</p> : accounts.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">Chưa có tài khoản phụ.</p> : accounts.map((account) => <article key={account.id} className="rounded-xl border p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><h3 className="font-semibold">{account.name}</h3><p className="text-sm text-muted-foreground">{account.email}{account.phone ? ` · ${account.phone}` : ''}</p><p className="mt-1 text-xs text-muted-foreground">{account.permissions.length} quyền · {account.status === 'active' ? 'Đang hoạt động' : 'Đã tạm ngưng'}</p></div><Button type="button" size="sm" variant="outline" onClick={() => { setEditing(editing === account.id ? null : account.id); setEditPermissions(account.permissions) }}><Pencil className="mr-1.5 h-4 w-4"/>Phân quyền</Button></div>{editing === account.id && <div className="mt-4 space-y-3 border-t pt-4"><PermissionChecks selected={editPermissions} onToggle={(key) => togglePermission(editPermissions, key, setEditPermissions)}/><Button type="button" size="sm" disabled={saving} onClick={() => void updateAccount(account.id, { permissions: editPermissions })}>Lưu quyền</Button></div>}</article>)}</CardContent></Card>
  </div>
}
