import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'
import { getAuthFromRequest, isAdmin, unauthorizedResponse } from '@/lib/api-auth'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuthFromRequest(request)
  if (!auth) return unauthorizedResponse()
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: 'Tệp không hợp lệ.' }, { status: 400 })
  const directory = path.join(process.cwd(), '.private', 'complaint-evidence')
  try {
    const owner = await readFile(path.join(directory, `${id}.owner`), 'utf8')
    if (!isAdmin(auth) && owner !== String(auth.userId)) {
      const [{ data: messageReferences }, { data: caseReferences }] = await Promise.all([
        db.from('ComplaintMessage').select('caseId').contains('evidenceUrls', [id]),
        db.from('ComplaintCase').select('id').contains('evidenceUrls', [id]),
      ])
      const caseIds = [...new Set([...(messageReferences || []).map(item => item.caseId), ...(caseReferences || []).map(item => item.id)])]
      if (!caseIds.length) return unauthorizedResponse()
      const { data: ownedCase } = await db.from('ComplaintCase').select('id').in('id', caseIds).eq('submitterUserId', Number(auth.userId)).limit(1).maybeSingle()
      if (!ownedCase) return unauthorizedResponse()
    }
    const file = await readFile(path.join(directory, id))
    const type = file.subarray(0, 5).toString() === '%PDF-' ? 'application/pdf' : file[0] === 0x89 ? 'image/png' : 'image/jpeg'
    return new Response(new Uint8Array(file), { headers: { 'Content-Type': type, 'Content-Disposition': 'inline', 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } })
  } catch {
    return NextResponse.json({ error: 'Không tìm thấy tệp đính kèm.' }, { status: 404 })
  }
}
