"use client"

import { FormEvent, useEffect, useState } from "react"
import { Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Method = { id: string; label: string; enabled: boolean; fee?: number }
type Settings = { storeName: string; supportEmail: string; supportPhone: string; codEnabled: boolean; accountEnabled: boolean; walletEnabled: boolean; standardShippingFee: number; expressShippingFee: number; paymentMethods: Method[]; shippingMethods: Method[] }
const defaultSettings: Settings = { storeName: "Sàn TMĐT APECSPACE", supportEmail: "support@sandtmdt.com", supportPhone: "1900-1234", codEnabled: true, accountEnabled: true, walletEnabled: false, standardShippingFee: 10000, expressShippingFee: 30000, paymentMethods: [{ id: 'cod', label: 'Thanh toán khi nhận hàng (COD)', enabled: true }, { id: 'bank', label: 'Tài khoản', enabled: true }, { id: 'wallet', label: 'Ví điện tử', enabled: false }], shippingMethods: [{ id: 'standard', label: 'Giao tiêu chuẩn 1-3 ngày', enabled: true, fee: 10000 }, { id: 'express', label: 'Giao nhanh 2-3 giờ', enabled: true, fee: 30000 }] }

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [initialSettings, setInitialSettings] = useState<Settings>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [newPayment, setNewPayment] = useState("")
  const [newShipping, setNewShipping] = useState("")
  const [newShippingFee, setNewShippingFee] = useState(0)
  useEffect(() => { fetch("/api/admin/settings").then(async response => { const result = await response.json(); if (!response.ok) throw new Error(result.error || "Không thể tải cài đặt."); setSettings(result.settings); setInitialSettings(result.settings) }).catch(error => setMessage(error.message)).finally(() => setLoading(false)) }, [])
  const update = <K extends keyof Settings>(key: K, value: Settings[K]) => setSettings(current => ({ ...current, [key]: value }))
  const makeId = (label: string) => `${label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${Date.now()}`
  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setMessage("")
    try { const payload = { ...settings, paymentMethods: [{ id: 'cod', label: 'Thanh toán khi nhận hàng (COD)', enabled: settings.codEnabled }, { id: 'bank', label: 'Tài khoản', enabled: settings.accountEnabled }, { id: 'wallet', label: 'Ví điện tử', enabled: settings.walletEnabled }, ...settings.paymentMethods.filter(method => !['cod', 'bank', 'wallet'].includes(method.id))], shippingMethods: [{ id: 'standard', label: 'Giao tiêu chuẩn 1-3 ngày', enabled: true, fee: settings.standardShippingFee }, { id: 'express', label: 'Giao nhanh 2-3 giờ', enabled: true, fee: settings.expressShippingFee }, ...settings.shippingMethods.filter(method => !['standard', 'express'].includes(method.id))] }; const response = await fetch("/api/admin/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); const result = await response.json(); if (!response.ok) throw new Error(result.error || "Không thể lưu cài đặt."); setSettings(result.settings); setInitialSettings(result.settings); setMessage("Đã lưu thay đổi.") } catch (error) { setMessage(error instanceof Error ? error.message : "Không thể lưu cài đặt.") } finally { setSaving(false) }
  }
  const disabled = loading || saving
  return <main className="p-6"><h1 className="text-3xl font-bold mb-8">Cài đặt hệ thống</h1><form onSubmit={saveSettings} className="grid grid-cols-1 gap-6 max-w-2xl">
    <Card><CardHeader><CardTitle>Thông tin chung</CardTitle></CardHeader><CardContent className="space-y-4">
      <div><Label>Tên cửa hàng</Label><Input value={settings.storeName} onChange={e => update("storeName", e.target.value)} disabled={disabled} /></div>
      <div><Label>Email hỗ trợ</Label><Input type="email" value={settings.supportEmail} onChange={e => update("supportEmail", e.target.value)} disabled={disabled} /></div>
      <div><Label>Số điện thoại</Label><Input value={settings.supportPhone} onChange={e => update("supportPhone", e.target.value)} disabled={disabled} /></div>
    </CardContent></Card>
    <Card><CardHeader><CardTitle>Cài đặt thanh toán</CardTitle></CardHeader><CardContent className="space-y-4">
      <div className="flex items-center gap-2"><input type="checkbox" id="cod" checked={settings.codEnabled} onChange={e => update("codEnabled", e.target.checked)} disabled={disabled} /><Label htmlFor="cod">Thanh toán khi nhận hàng (COD)</Label></div>
      <div className="flex items-center gap-2"><input type="checkbox" id="account" checked={settings.accountEnabled} onChange={e => update("accountEnabled", e.target.checked)} disabled={disabled} /><Label htmlFor="account">Tài khoản</Label></div>
      <div className="flex items-center gap-2"><input type="checkbox" id="wallet" checked={settings.walletEnabled} onChange={e => update("walletEnabled", e.target.checked)} disabled={disabled} /><Label htmlFor="wallet">Ví điện tử</Label></div>
      {settings.paymentMethods.filter(method => !['cod', 'bank', 'wallet'].includes(method.id)).map(method => <div key={method.id} className="flex items-center gap-2"><input type="checkbox" checked={method.enabled} onChange={e => update('paymentMethods', settings.paymentMethods.map(item => item.id === method.id ? { ...item, enabled: e.target.checked } : item))} disabled={disabled} /><span className="text-sm flex-1">{method.label}</span><Button type="button" size="sm" variant="outline" onClick={() => update('paymentMethods', settings.paymentMethods.filter(item => item.id !== method.id))}>Xóa</Button></div>)}
      <div className="flex gap-2"><Input placeholder="Thêm loại thanh toán" value={newPayment} onChange={e => setNewPayment(e.target.value)} /><Button type="button" variant="outline" onClick={() => { if (newPayment.trim()) { update('paymentMethods', [...settings.paymentMethods, { id: makeId(newPayment), label: newPayment.trim(), enabled: true }]); setNewPayment('') } }}>Thêm</Button></div>
    </CardContent></Card>
    <Card><CardHeader><CardTitle>Cài đặt giao hàng</CardTitle></CardHeader><CardContent className="space-y-4">
      <div><Label>Phí giao hàng tiêu chuẩn</Label><Input type="number" min="0" value={settings.standardShippingFee} onChange={e => update("standardShippingFee", Number(e.target.value))} disabled={disabled} /></div>
      <div><Label>Phí giao hàng express</Label><Input type="number" min="0" value={settings.expressShippingFee} onChange={e => update("expressShippingFee", Number(e.target.value))} disabled={disabled} /></div>
      {settings.shippingMethods.filter(method => !['standard', 'express'].includes(method.id)).map(method => <div key={method.id} className="flex gap-2 items-end"><div className="flex-1"><Label>{method.label}</Label><Input type="number" min="0" value={method.fee || 0} onChange={e => update('shippingMethods', settings.shippingMethods.map(item => item.id === method.id ? { ...item, fee: Number(e.target.value) } : item))} /></div><Button type="button" size="sm" variant="outline" onClick={() => update('shippingMethods', settings.shippingMethods.filter(item => item.id !== method.id))}>Xóa</Button></div>)}
      <div className="flex gap-2"><Input placeholder="Thêm hình thức vận chuyển" value={newShipping} onChange={e => setNewShipping(e.target.value)} /><Input className="w-32" type="number" min="0" placeholder="Phí" value={newShippingFee} onChange={e => setNewShippingFee(Number(e.target.value))} /><Button type="button" variant="outline" onClick={() => { if (newShipping.trim()) { update('shippingMethods', [...settings.shippingMethods, { id: makeId(newShipping), label: newShipping.trim(), enabled: true, fee: newShippingFee }]); setNewShipping(''); setNewShippingFee(0) } }}>Thêm</Button></div>
    </CardContent></Card>
    <div className="flex gap-2"><Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={disabled}><Save className="h-4 w-4 mr-2" />{saving ? "Đang lưu..." : "Lưu thay đổi"}</Button><Button type="button" variant="outline" onClick={() => { setSettings(initialSettings); setMessage("") }} disabled={saving}>Hủy</Button></div>
    {message && <p className={message === "Đã lưu thay đổi." ? "text-sm text-green-600" : "text-sm text-red-600"} role="status">{message}</p>}
  </form></main>
}
