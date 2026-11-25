import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthFromRequest, isAdmin, unauthorizedResponse } from '@/lib/api-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export async function GET(request: NextRequest) {
  if (!isAdmin(await getAuthFromRequest(request))) return unauthorizedResponse()
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
          const { data } = await db.from('ComplaintCase').select('id,status,updatedAt,createdAt').order('updatedAt', { ascending: false })
          const snapshot = JSON.stringify(data || [])
          if (snapshot !== previous && !closed) {
            controller.enqueue(encoder.encode(`event: cases\ndata: ${snapshot}\n\n`))
            previous = snapshot
            lastSentAt = Date.now()
          } else if (Date.now() - lastSentAt > 15000 && !closed) {
            controller.enqueue(encoder.encode(': heartbeat\n\n'))
            lastSentAt = Date.now()
          }
          await new Promise(resolve => setTimeout(resolve, 3000))
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
