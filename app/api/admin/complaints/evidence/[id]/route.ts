import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'
import { getAuthFromRequest, isAdmin, unauthorizedResponse } from '@/lib/api-auth'

export const runtime = 'nodejs'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuthFromRequest(request)
  if (!isAdmin(auth)) return unauthorizedResponse()
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: 'Tệp không hợp lệ.' }, { status: 400 })
  try {
    const file = await readFile(path.join(process.cwd(), '.private', 'complaint-evidence', id))
    const type = file.subarray(0, 5).toString() === '%PDF-' ? 'application/pdf' : file[0] === 0x89 ? 'image/png' : 'image/jpeg'
    return new Response(new Uint8Array(file), { headers: { 'Content-Type': type, 'Content-Disposition': 'inline', 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } })
  } catch {
    return NextResponse.json({ error: 'Không tìm thấy tệp bằng chứng.' }, { status: 404 })
  }
}
