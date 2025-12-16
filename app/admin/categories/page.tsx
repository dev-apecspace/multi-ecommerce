"use client"

import { useEffect, useState } from "react"
import { Plus, Edit, Trash2, Copy, Loader2, AlertCircle, X, ChevronDown, ChevronRight, Grid3X3, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Pagination } from "@/components/pagination"
import { usePagination } from "@/hooks/use-pagination"

interface SubCategory {
  id: number
  name: string
  slug: string
  categoryId: number
  productsCount: number
  createdAt: string
  updatedAt: string
}

interface Category {
  id: number
  name: string
  slug: string
  icon: string | null
  subcategoriesCount: number
  productsCount: number
  createdAt: string
  updatedAt: string
  SubCategory?: SubCategory[]
}

interface FormData {
  name: string
  icon: string
  categoryId?: string
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string>('')
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set())
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState<'add_category' | 'edit_category' | 'add_subcategory' | 'edit_subcategory'>('add_category')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [parentCategoryId, setParentCategoryId] = useState<number | null>(null)
  const [formData, setFormData] = useState<FormData>({ name: '', icon: '' })
  const [error, setError] = useState('')
  const { toast } = useToast()
  const pagination = usePagination({ initialPage: 1, initialLimit: 10 })

  useEffect(() => {
    fetchCategories()
  }, [pagination.page, pagination.limit])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const url = new URL('/api/categories', window.location.origin)
      url.searchParams.append('withSubcategories', 'true')
      url.searchParams.append('page', String(pagination.page))
      url.searchParams.append('limit', String(pagination.limit))
      
      const response = await fetch(url.toString())
      const result = await response.json()

      if (Array.isArray(result.data)) {
        setCategories(result.data)
        pagination.setTotal(result.pagination?.total || 0)
      } else if (Array.isArray(result)) {
        setCategories(result)
      }
    } catch (err) {
      toast({
        title: 'Lỗi',
        description: err instanceof Error ? err.message : 'Không thể tải danh mục',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const toggleExpanded = (categoryId: number) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  const openAddCategoryModal = (parentId?: number) => {
    setModalType('add_category')
    setEditingId(null)
    setParentCategoryId(parentId || null)
    setFormData({ name: '', icon: '', categoryId: parentId?.toString() || '' })
    setError('')
    setShowModal(true)
  }

  const openAddSubcategoryModal = (categoryId: number) => {
    setModalType('add_subcategory')
    setEditingId(null)
    setParentCategoryId(categoryId)
    setFormData({ name: '', categoryId: categoryId.toString() })
    setError('')
    setShowModal(true)
  }

  const openEditCategoryModal = (category: Category) => {
    setModalType('edit_category')
    setEditingId(category.id)
    setParentCategoryId(null)
    setFormData({ name: category.name, icon: category.icon || '' })
    setError('')
    setShowModal(true)
  }

  const openEditSubcategoryModal = (subcat: SubCategory) => {
    setModalType('edit_subcategory')
    setEditingId(subcat.id)
    setParentCategoryId(subcat.categoryId)
    setFormData({ name: subcat.name, categoryId: subcat.categoryId.toString() })
    setError('')
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.name.trim()) {
      setError('Tên danh mục là bắt buộc')
      return
    }

    const isCategory = modalType.includes('category') && !modalType.includes('subcategory')
    const isEdit = modalType.includes('edit')
    const isAddingSubcategoryFromCategory = isCategory && !isEdit && formData.categoryId

    try {
      setActionLoading(isEdit ? `edit_${editingId}` : `add_${modalType}`)
      
      let url = ''
      let body: any = { name: formData.name }

      if (isAddingSubcategoryFromCategory) {
        url = '/api/admin/categories'
        body.categoryId = formData.categoryId
      } else if (isCategory) {
        url = isEdit ? `/api/admin/categories?id=${editingId}` : '/api/admin/categories'
        body.icon = formData.icon || null
      } else {
        url = isEdit ? `/api/admin/subcategories?id=${editingId}` : '/api/admin/subcategories'
        body.categoryId = formData.categoryId
      }

      const method = isEdit ? 'PUT' : 'POST'
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Không thể lưu')
      }

      toast({
        title: 'Thành công',
        description: isEdit ? 'Cập nhật thành công' : 'Thêm mới thành công',
      })

      setShowModal(false)
      fetchCategories()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra')
    } finally {
      setActionLoading('')
    }
  }

  const handleDelete = async (id: number, isSubcategory: boolean = false) => {
    const msg = isSubcategory ? 'danh mục con' : 'danh mục'
    if (!confirm(`Bạn chắc chắn muốn xóa ${msg} này?`)) return

    try {
      setActionLoading(`delete_${id}`)
      const url = isSubcategory ? `/api/admin/subcategories?id=${id}` : `/api/admin/categories?id=${id}`
      
      const response = await fetch(url, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || `Không thể xóa ${msg}`)
      }

      toast({
        title: 'Thành công',
        description: `${msg} đã được xóa`,
      })

      fetchCategories()
    } catch (err) {
      toast({
        title: 'Lỗi',
        description: err instanceof Error ? err.message : `Không thể xóa ${msg}`,
        variant: 'destructive',
      })
    } finally {
      setActionLoading('')
    }
  }

  const handleDuplicate = async (id: number, isSubcategory: boolean = false) => {
    try {
      setActionLoading(`duplicate_${id}`)
      const url = isSubcategory ? `/api/admin/subcategories/${id}/duplicate` : `/api/admin/categories/${id}/duplicate`
      
      const response = await fetch(url, {
        method: 'POST',
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Không thể sao chép')
      }

      toast({
        title: 'Thành công',
        description: 'Sao chép thành công',
      })

      fetchCategories()
    } catch (err) {
      toast({
        title: 'Lỗi',
        description: err instanceof Error ? err.message : 'Không thể sao chép',
        variant: 'destructive',
      })
    } finally {
      setActionLoading('')
    }
  }

  const isLoading = (action: string) => actionLoading === action || actionLoading.startsWith(action + '_')

  if (loading) {
    return (
      <main className="p-6 flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Đang tải danh mục...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Quản lý danh mục</h1>
        <Button 
          onClick={openAddCategoryModal}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Thêm danh mục
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cây danh mục ({categories.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Chưa có danh mục nào</p>
            </div>
          ) : (
            <div className="space-y-1">
              {categories.map((category) => {
                const isExpanded = expandedCategories.has(category.id)
                const hasSubcategories = category.SubCategory && category.SubCategory.length > 0

                return (
                  <div key={category.id} className="select-none">
                    {/* Category Row */}
                    <div className="flex items-center gap-2 py-2 px-3 rounded hover:bg-gray-50 dark:hover:bg-slate-900 group">
                      <button
                        onClick={() => toggleExpanded(category.id)}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-slate-800 rounded"
                        disabled={!hasSubcategories}
                      >
                        {hasSubcategories ? (
                          isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )
                        ) : (
                          <div className="h-4 w-4" />
                        )}
                      </button>

                      <Grid3X3 className="h-4 w-4 text-orange-500 flex-shrink-0" />

                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 dark:text-gray-100">
                          {category.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {category.SubCategory?.length || 0} danh mục con • {category.productsCount} sản phẩm
                        </div>
                      </div>

                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEditCategoryModal(category)}
                          disabled={isLoading(`edit_${category.id}`)}
                          className="p-1 hover:bg-orange-100 rounded transition disabled:opacity-50"
                          title="Chỉnh sửa"
                        >
                          <Edit className="h-4 w-4 text-orange-600" />
                        </button>
                        <button
                          onClick={() => handleDuplicate(category.id)}
                          disabled={isLoading(`duplicate_${category.id}`)}
                          className="p-1 hover:bg-blue-100 rounded transition disabled:opacity-50"
                          title="Sao chép"
                        >
                          {isLoading(`duplicate_${category.id}`) ? (
                            <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                          ) : (
                            <Copy className="h-4 w-4 text-blue-600" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(category.id)}
                          disabled={isLoading(`delete_${category.id}`) || category.productsCount > 0}
                          className="p-1 hover:bg-red-100 rounded transition disabled:opacity-50"
                          title={category.productsCount > 0 ? "Không thể xóa danh mục có sản phẩm" : "Xóa"}
                        >
                          {isLoading(`delete_${category.id}`) ? (
                            <Loader2 className="h-4 w-4 text-red-600 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 text-red-600" />
                          )}
                        </button>
                        <button
                          onClick={() => openAddSubcategoryModal(category.id)}
                          className="p-1 hover:bg-green-100 rounded transition"
                          title="Thêm danh mục con"
                        >
                          <Plus className="h-4 w-4 text-green-600" />
                        </button>
                      </div>
                    </div>

                    {/* Subcategories */}
                    {isExpanded && hasSubcategories && (
                      <div className="ml-4 space-y-1 border-l border-gray-200 dark:border-slate-700 pl-4 my-1">
                        {category.SubCategory!.map((subcat) => (
                          <div key={subcat.id} className="flex items-center gap-2 py-2 px-3 rounded hover:bg-gray-50 dark:hover:bg-slate-900 group">
                            <div className="p-1" />
                            <Tag className="h-4 w-4 text-blue-500 flex-shrink-0" />
                            
                            <div className="flex-1">
                              <div className="font-medium text-gray-800 dark:text-gray-200">
                                {subcat.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {subcat.productsCount} sản phẩm
                              </div>
                            </div>

                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => openEditSubcategoryModal(subcat)}
                                disabled={isLoading(`edit_${subcat.id}`)}
                                className="p-1 hover:bg-orange-100 rounded transition disabled:opacity-50"
                                title="Chỉnh sửa"
                              >
                                <Edit className="h-4 w-4 text-orange-600" />
                              </button>
                              <button
                                onClick={() => handleDuplicate(subcat.id, true)}
                                disabled={isLoading(`duplicate_${subcat.id}`)}
                                className="p-1 hover:bg-blue-100 rounded transition disabled:opacity-50"
                                title="Sao chép"
                              >
                                {isLoading(`duplicate_${subcat.id}`) ? (
                                  <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                                ) : (
                                  <Copy className="h-4 w-4 text-blue-600" />
                                )}
                              </button>
                              <button
                                onClick={() => handleDelete(subcat.id, true)}
                                disabled={isLoading(`delete_${subcat.id}`) || subcat.productsCount > 0}
                                className="p-1 hover:bg-red-100 rounded transition disabled:opacity-50"
                                title={subcat.productsCount > 0 ? "Không thể xóa có sản phẩm" : "Xóa"}
                              >
                                {isLoading(`delete_${subcat.id}`) ? (
                                  <Loader2 className="h-4 w-4 text-red-600 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                )}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
          {categories.length > 0 && (
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={pagination.goToPage}
              limit={pagination.limit}
              onLimitChange={pagination.setPageLimit}
              total={pagination.total}
            />
          )}
        </CardContent>
      </Card>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle>
                {modalType === 'add_category' && (formData.categoryId ? 'Thêm danh mục con mới' : 'Thêm danh mục mới')}
                {modalType === 'edit_category' && 'Chỉnh sửa danh mục'}
                {modalType === 'add_subcategory' && 'Thêm danh mục con mới'}
                {modalType === 'edit_subcategory' && 'Chỉnh sửa danh mục con'}
              </CardTitle>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="flex gap-2 p-3 bg-red-100 text-red-800 rounded text-sm">
                    <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <p>{error}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Tên danh mục {modalType.includes('subcategory') ? 'con' : ''} *
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nhập tên danh mục"
                    disabled={actionLoading !== ''}
                  />
                </div>

                {modalType === 'add_category' && (
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Danh mục cha (Để trống nếu đây là danh mục chính)
                    </label>
                    <select
                      value={formData.categoryId || ''}
                      onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                      disabled={actionLoading !== ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-900 dark:border-slate-700"
                    >
                      <option value="">-- Không có danh mục cha (Danh mục chính) --</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id.toString()}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {modalType === 'edit_category' && (
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Icon (URL)
                    </label>
                    <Input
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      placeholder="https://example.com/icon.svg"
                      disabled={actionLoading !== ''}
                    />
                  </div>
                )}

                {modalType === 'add_category' && !formData.categoryId && (
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Icon (URL)
                    </label>
                    <Input
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      placeholder="https://example.com/icon.svg"
                      disabled={actionLoading !== ''}
                    />
                  </div>
                )}

                <div className="flex gap-2 justify-end pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowModal(false)}
                    disabled={actionLoading !== ''}
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={actionLoading !== ''}
                  >
                    {actionLoading !== '' && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {modalType.includes('add') ? 'Thêm' : 'Cập nhật'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  )
}
