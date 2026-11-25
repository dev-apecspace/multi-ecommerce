import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthFromRequest, isAdmin, unauthorizedResponse } from '@/lib/api-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuthFromRequest(request)
  if (!auth) return unauthorizedResponse()
  const { id: rawId } = await params
  const caseId = Number(rawId)
  if (!Number.isInteger(caseId)) return NextResponse.json({ error: 'Hồ sơ không hợp lệ.' }, { status: 400 })
  const { data: complaint } = await db.from('ComplaintCase').select('id,submitterUserId').eq('id', caseId).maybeSingle()
  if (!complaint) return NextResponse.json({ error: 'Không tìm thấy hồ sơ.' }, { status: 404 })
  if (!isAdmin(auth) && Number(complaint.submitterUserId) !== Number(auth.userId)) return unauthorizedResponse()

  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let previous = ''
      let closed = false
      let lastSentAt = Date.now()
      const close = () => { if (!closed) { closed = true; try { controller.close() } catch {} } }
      request.signal.addEventListener('abort', close, { once: true })
      const startedAt = Date.now()
      try {
        while (!closed && Date.now() - startedAt < 4 * 60 * 1000) {
          const [{ data: current }, { data: messages }, { data: events }] = await Promise.all([
            db.from('ComplaintCase').select('id,caseCode,categoryId,categoryName,subject,description,status,resolution,customerReplyDeadline,customerRating,customerFeedback,ratedAt,createdAt,updatedAt').eq('id', caseId).maybeSingle(),
            db.from('ComplaintMessage').select('id,caseId,senderRole,senderName,message,evidenceUrls,evidenceNames,createdAt').eq('caseId', caseId).order('createdAt'),
            db.from('ComplaintCaseEvent').select('id,status,message,createdAt').eq('caseId', caseId).order('createdAt'),
          ])
          if (!current) break
          const snapshot = JSON.stringify({ case: current, messages: messages || [], events: events || [] })
          if (snapshot !== previous && !closed) {
            controller.enqueue(encoder.encode(`event: snapshot\ndata: ${snapshot}\n\n`))
            previous = snapshot
            lastSentAt = Date.now()
          } else if (Date.now() - lastSentAt > 15000 && !closed) {
            controller.enqueue(encoder.encode(': heartbeat\n\n'))
            lastSentAt = Date.now()
          }
          await new Promise(resolve => setTimeout(resolve, 1500))
        }
      } catch {
        if (!closed) controller.enqueue(encoder.encode('event: reconnect\ndata: {}\n\n'))
      } finally {
        request.signal.removeEventListener('abort', close)
        close()
      }
    },
    cancel() {},
  })
  return new NextResponse(stream, { headers: { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' } })
}
