import { NextRequest, NextResponse } from 'next/server'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import { getAuthFromRequest, unauthorizedResponse } from '@/lib/api-auth'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
const maxBytes = 10 * 1024 * 1024
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export async function POST(request: NextRequest) {
  const auth = await getAuthFromRequest(request)
  if (!auth) return unauthorizedResponse()
  const form = await request.formData()
  const file = form.get('file')
  if (!(file instanceof File) || file.size === 0) return NextResponse.json({ error: 'Vui lòng chọn tệp bằng chứng.' }, { status: 400 })
  if (file.size > maxBytes) return NextResponse.json({ error: 'Mỗi tệp tối đa 10MB.' }, { status: 400 })
  const bytes = Buffer.from(await file.arrayBuffer())
  const ext = path.extname(file.name).toLowerCase()
  const valid = (ext === '.pdf' && bytes.subarray(0, 5).toString() === '%PDF-')
    || (['.jpg', '.jpeg'].includes(ext) && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)
    || (ext === '.png' && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])))
  if (!valid) return NextResponse.json({ error: 'Chỉ nhận PDF, JPG hoặc PNG hợp lệ.' }, { status: 400 })
  const id = crypto.randomUUID()
  const safeName = path.basename(file.name).replace(/[^\p{L}\p{N}._ -]/gu, '_').slice(0, 120)
  const dir = path.join(process.cwd(), '.private', 'complaint-evidence')
  await mkdir(dir, { recursive: true })
  await writeFile(path.join(dir, id), bytes, { flag: 'wx' })
  await writeFile(path.join(dir, `${id}.owner`), String(auth.userId), { flag: 'wx' })
  return NextResponse.json({ data: { id, name: safeName, size: file.size } }, { status: 201 })
}
