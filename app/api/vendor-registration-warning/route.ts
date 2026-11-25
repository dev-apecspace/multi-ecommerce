import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export async function GET() {
  const { data, error } = await supabase.from('VendorRegistrationWarning').select('title, content, version, minReadSeconds').eq('id', 1).maybeSingle()
  if (error || !data) return NextResponse.json({ error: 'Chưa cấu hình nội dung cảnh báo đăng ký nhà bán hàng.' }, { status: 503 })
  return NextResponse.json({ warning: data })
}
