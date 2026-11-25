'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Power, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

type Category = { id: number; name: string; groupName: string; sortOrder: number; active: boolean }

export default function ComplaintCategoriesPage() {
  const { toast } = useToast()
  const [categories, setCategories] = useState<Category[]>([])
  const [newCategory, setNewCategory] = useState('')
  const [newGroup, setNewGroup] = useState('general')
  const [loading, setLoading] = useState(true)

  const loadCategories = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/complaint-categories', { cache: 'no-store' })
      const json = await response.json()
      if (!response.ok) throw new Error(json.error || 'Không tải được loại vấn đề.')
      setCategories(json.data || [])
    } catch (error) {
      toast({ title: 'Không tải được loại vấn đề', description: error instanceof Error ? error.message : 'Thử lại sau.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { void loadCategories() }, [loadCategories])

  async function addCategory() {
    if (!newCategory.trim()) return
    try {
      const response = await fetch('/api/complaint-categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newCategory, groupName: newGroup }) })
      const json = await response.json()
      if (!response.ok) throw new Error(json.error || 'Không thêm được loại vấn đề.')
      setNewCategory('')
      await loadCategories()
    } catch (error) {
      toast({ title: 'Không thêm được loại vấn đề', description: error instanceof Error ? error.message : 'Thử lại sau.', variant: 'destructive' })
    }
  }

  async function toggleCategory(category: Category) {
    try {
      const response = await fetch('/api/complaint-categories', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...category, active: !category.active }) })
      const json = await response.json()
      if (!response.ok) throw new Error(json.error || 'Không cập nhật được loại vấn đề.')
      setCategories(current => current.map(item => item.id === category.id ? json.data : item))
    } catch (error) {
      toast({ title: 'Không cập nhật được loại vấn đề', description: error instanceof Error ? error.message : 'Thử lại sau.', variant: 'destructive' })
    }
  }

  return <main className="space-y-6 p-4 md:p-6">
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div><Link href="/admin/complaints" className="mb-3 inline-flex items-center gap-2 text-sm text-orange-700"><ArrowLeft className="h-4 w-4"/>Quay lại phản ánh</Link><p className="text-sm font-medium text-orange-600">HỖ TRỢ NGƯỜI DÙNG</p><h1 className="text-3xl font-bold">Quản lý loại vấn đề</h1><p className="mt-1 text-sm text-muted-foreground">Các loại đang hiển thị trong trung tâm hỗ trợ của khách hàng.</p></div>
      <Button variant="outline" onClick={loadCategories} disabled={loading}><RefreshCw className={`mr-2 h-4 w-4 ${loading?'animate-spin':''}`}/>Làm mới</Button>
    </header>
    <section className="rounded-xl border bg-white p-5">
      <h2 className="text-lg font-semibold">Thêm loại vấn đề</h2>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row"><Input value={newCategory} maxLength={100} placeholder="Nhập tên loại vấn đề mới" onChange={event=>setNewCategory(event.target.value)}/><select className="h-10 rounded-md border bg-background px-3" value={newGroup} onChange={event=>setNewGroup(event.target.value)}><option value="general">Vấn đề chung</option><option value="service">Theo dịch vụ</option></select><Button onClick={addCategory} disabled={!newCategory.trim()}><Plus className="mr-2 h-4 w-4"/>Thêm loại</Button></div>
    </section>
    <section className="rounded-xl border bg-white p-5">
      <h2 className="text-lg font-semibold">Danh sách loại vấn đề</h2>
      <Tabs defaultValue="general" className="mt-4"><TabsList className="grid w-full grid-cols-2 sm:w-fit"><TabsTrigger value="general">Vấn đề chung ({categories.filter(category=>category.groupName==='general').length})</TabsTrigger><TabsTrigger value="service">Theo dịch vụ ({categories.filter(category=>category.groupName==='service').length})</TabsTrigger></TabsList>
        {(['general','service'] as const).map(groupName=><TabsContent key={groupName} value={groupName}><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{categories.filter(category=>category.groupName===groupName).map(category=><div key={category.id} className="flex items-center justify-between gap-3 rounded-lg border p-3"><div><p className="text-sm font-medium">{category.name}</p><p className="text-xs text-muted-foreground">{category.active?'Đang hiển thị':'Đã ẩn'}</p></div><Button size="sm" variant="outline" onClick={()=>toggleCategory(category)} aria-label={category.active?'Ẩn loại vấn đề':'Hiện loại vấn đề'}><Power className="h-4 w-4"/></Button></div>)}</div>{!loading&&!categories.some(category=>category.groupName===groupName)&&<p className="py-8 text-center text-sm text-muted-foreground">Chưa có loại vấn đề trong nhóm này.</p>}</TabsContent>)}
      </Tabs>
    </section>
  </main>
}
