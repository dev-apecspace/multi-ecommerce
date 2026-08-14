import { NextRequest, NextResponse } from 'next/server'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'

export const runtime = 'nodejs'

const MAX_SIZE = 10 * 1024 * 1024
const ALLOWED_TYPES = new Set(['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'])

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const shopName = String(formData.get('shopName') || '')
  if (!file) return NextResponse.json({ error: 'Vui lòng chọn tệp.' }, { status: 400 })
  if (file.size > MAX_SIZE) return NextResponse.json({ error: 'Tệp tối đa 10MB.' }, { status: 400 })
  const extension = path.extname(file.name).toLowerCase()
  if (!ALLOWED_TYPES.has(file.type) || !['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'].includes(extension)) {
    return NextResponse.json({ error: 'Chỉ hỗ trợ PDF, DOC, DOCX, JPG hoặc PNG.' }, { status: 400 })
  }
  const shopSlug = shopName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'cua-hang'
  const storedName = `GPKD-${shopSlug}-${Date.now()}-${crypto.randomUUID().slice(0, 8)}${extension}`
  const directory = path.join(process.cwd(), 'public', 'uploads', 'ho-so-cua-hang', 'giay-phep')
  await mkdir(directory, { recursive: true })
  await writeFile(path.join(directory, storedName), Buffer.from(await file.arrayBuffer()))
  return NextResponse.json({ url: `/uploads/ho-so-cua-hang/giay-phep/${storedName}`, fileName: file.name })
}
