import { NextRequest, NextResponse } from 'next/server'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

const imageTypes = ['image/jpeg', 'image/png', 'image/webp']

function toFileSlug(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'cua-hang'
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')
    const shopName = String(formData.get('shopName') || '')
    if (!(file instanceof File)) return NextResponse.json({ error: 'Vui lòng chọn logo.' }, { status: 400 })
    if (!imageTypes.includes(file.type) || file.size > 5 * 1024 * 1024) return NextResponse.json({ error: 'Logo chỉ hỗ trợ JPG, PNG, WEBP với dung lượng tối đa 5MB.' }, { status: 400 })

    const extension = path.extname(file.name).toLowerCase() || (file.type === 'image/png' ? '.png' : file.type === 'image/webp' ? '.webp' : '.jpg')
    const storedName = `${toFileSlug(shopName)}-logo-${Date.now()}-${crypto.randomUUID().slice(0, 8)}${extension}`
    const directory = path.join(process.cwd(), 'public', 'uploads', 'ho-so-cua-hang', 'logo')
    await mkdir(directory, { recursive: true })
    await writeFile(path.join(directory, storedName), Buffer.from(await file.arrayBuffer()))
    return NextResponse.json({ url: `/uploads/ho-so-cua-hang/logo/${storedName}`, fileName: storedName })
  } catch (error) {
    console.error('Vendor registration logo upload error:', error)
    return NextResponse.json({ error: 'Không thể tải logo lên.' }, { status: 500 })
  }
}
