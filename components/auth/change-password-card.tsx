'use client'

import { useState, type FormEvent } from 'react'
import { KeyRound, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function ChangePasswordCard() {
  const [values, setValues] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ text: string; success: boolean } | null>(null)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)
    if (values.newPassword !== values.confirmPassword) {
      setMessage({ text: 'Mật khẩu xác nhận chưa khớp.', success: false })
      return
    }
    if (values.newPassword.length < 8) {
      setMessage({ text: 'Mật khẩu mới cần có ít nhất 8 ký tự.', success: false })
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword: values.oldPassword, newPassword: values.newPassword }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Không thể đổi mật khẩu.')
      setValues({ oldPassword: '', newPassword: '', confirmPassword: '' })
      setMessage({ text: 'Đổi mật khẩu thành công.', success: true })
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'Không thể đổi mật khẩu.', success: false })
    } finally {
      setSaving(false)
    }
  }

  return <Card>
    <CardHeader><CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5 text-orange-600" />Đổi mật khẩu</CardTitle></CardHeader>
    <CardContent>
      <form onSubmit={submit} className="space-y-4">
        <div><Label htmlFor="change-password-current">Mật khẩu hiện tại</Label><Input id="change-password-current" type="password" autoComplete="current-password" required value={values.oldPassword} onChange={(event) => setValues({ ...values, oldPassword: event.target.value })} className="mt-2" /></div>
        <div><Label htmlFor="change-password-new">Mật khẩu mới</Label><Input id="change-password-new" type="password" autoComplete="new-password" minLength={8} maxLength={128} required value={values.newPassword} onChange={(event) => setValues({ ...values, newPassword: event.target.value })} className="mt-2" /><p className="mt-1 text-xs text-muted-foreground">Mật khẩu cần có từ 8 đến 128 ký tự.</p></div>
        <div><Label htmlFor="change-password-confirm">Xác nhận mật khẩu mới</Label><Input id="change-password-confirm" type="password" autoComplete="new-password" minLength={8} maxLength={128} required value={values.confirmPassword} onChange={(event) => setValues({ ...values, confirmPassword: event.target.value })} className="mt-2" /></div>
        <Button type="submit" disabled={saving}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}Cập nhật mật khẩu</Button>
        {message && <p role="status" className={`text-sm ${message.success ? 'text-emerald-700' : 'text-red-600'}`}>{message.text}</p>}
      </form>
    </CardContent>
  </Card>
}
