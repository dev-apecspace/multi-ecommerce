import { NextRequest, NextResponse } from 'next/server'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'
import { getAuthFromRequest, isVendor, unauthorizedResponse } from '@/lib/api-auth'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
const imageTypes = ['image/jpeg', 'image/png', 'image/webp']

function toFileSlug(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'cua-hang'
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request)
    if (!auth || !isVendor(auth)) return unauthorizedResponse()

    const formData = await request.formData()
    const file = formData.get('file')
    const uploadType = String(formData.get('uploadType') || '')
    if (!(file instanceof File) || !['logo', 'cover'].includes(uploadType)) return NextResponse.json({ error: 'Thiếu ảnh hoặc loại ảnh không hợp lệ.' }, { status: 400 })
    if (!imageTypes.includes(file.type) || file.size > 5 * 1024 * 1024) return NextResponse.json({ error: 'Chỉ hỗ trợ JPG, PNG, WEBP với dung lượng tối đa 5MB.' }, { status: 400 })

    const { data: vendor, error } = await supabase.from('Vendor').select('name').eq('id', auth.vendorId).single()
    if (error || !vendor) return NextResponse.json({ error: 'Không tìm thấy cửa hàng.' }, { status: 404 })

    const extension = path.extname(file.name).toLowerCase() || (file.type === 'image/png' ? '.png' : file.type === 'image/webp' ? '.webp' : '.jpg')
    const shopSlug = toFileSlug(vendor.name)
    const folder = uploadType === 'logo' ? 'logo' : 'anh-bia'
    const prefix = uploadType === 'logo' ? `${shopSlug}-logo` : `anh-bia-${shopSlug}`
    const storedName = `${prefix}-${Date.now()}-${crypto.randomUUID().slice(0, 8)}${extension}`
    const directory = path.join(process.cwd(), 'public', 'uploads', 'ho-so-cua-hang', folder)
    await mkdir(directory, { recursive: true })
    await writeFile(path.join(directory, storedName), Buffer.from(await file.arrayBuffer()))

    return NextResponse.json({ url: `/uploads/ho-so-cua-hang/${folder}/${storedName}`, fileName: storedName })
  } catch (error) {
    console.error('Vendor image upload error:', error)
    return NextResponse.json({ error: 'Không thể tải ảnh lên.' }, { status: 500 })
  }
}
