import { NextRequest, NextResponse } from 'next/server'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import { getAuthFromRequest, isVendor, unauthorizedResponse } from '@/lib/api-auth'

export const runtime = 'nodejs'

const MAX_SIZE = 10 * 1024 * 1024
const EXTENSIONS = new Set(['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'])
const TYPES = new Set(['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'])

export async function POST(request: NextRequest) {
  const auth = await getAuthFromRequest(request)
  if (!auth || !isVendor(auth)) return unauthorizedResponse()

  const file = (await request.formData()).get('file') as File | null
  if (!file) return NextResponse.json({ error: 'Vui lòng chọn tệp.' }, { status: 400 })
  if (file.size > MAX_SIZE) return NextResponse.json({ error: 'Tệp tối đa 10MB.' }, { status: 400 })

  const extension = path.extname(file.name).toLowerCase()
  if (!EXTENSIONS.has(extension) || !TYPES.has(file.type)) {
    return NextResponse.json({ error: 'Chỉ hỗ trợ PDF, DOC, DOCX, JPG hoặc PNG.' }, { status: 400 })
  }

  const baseName = path.basename(file.name, extension).replace(/[^a-zA-Z0-9_-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'ho-so'
  const storedName = `${Date.now()}-${crypto.randomUUID()}-${baseName}${extension}`
  const directory = path.join(process.cwd(), 'public', 'uploads', 'ho-so-cua-hang')
  await mkdir(directory, { recursive: true })
  await writeFile(path.join(directory, storedName), Buffer.from(await file.arrayBuffer()))
  return NextResponse.json({ url: `/uploads/ho-so-cua-hang/${storedName}`, fileName: file.name })
}
