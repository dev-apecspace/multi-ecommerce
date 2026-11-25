import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthFromRequest, unauthorizedResponse } from '@/lib/api-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export async function GET(request: NextRequest) {
  const auth = await getAuthFromRequest(request)
  if (!auth) return unauthorizedResponse()
  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let previous = ''
      let closed = false
      const close = () => { if (!closed) { closed = true; try { controller.close() } catch {} } }
      request.signal.addEventListener('abort', close, { once: true })
      const startedAt = Date.now()
      try {
        while (!closed && Date.now() - startedAt < 4 * 60 * 1000) {
          const { data, error } = await db.from('ComplaintCase').select('id,status,updatedAt,createdAt').eq('submitterUserId', Number(auth.userId)).order('updatedAt', { ascending: false })
          if (error) throw error
          const snapshot = JSON.stringify(data || [])
          if (snapshot !== previous && !closed) {
            controller.enqueue(encoder.encode(`event: cases\ndata: ${snapshot}\n\n`))
            previous = snapshot
          } else if (!closed) controller.enqueue(encoder.encode(': heartbeat\n\n'))
          await new Promise(resolve => setTimeout(resolve, 2500))
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
