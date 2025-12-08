import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthFromRequest, isVendor, unauthorizedResponse } from '@/lib/api-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request)

    if (!auth || !isVendor(auth)) {
      return unauthorizedResponse()
    }

    const vendorId = auth.vendorId

    const [ordersRes, withdrawalsRes] = await Promise.all([
      supabase.from('Order').select('total, status').eq('vendorId', vendorId),
      supabase.from('WithdrawRequest').select('*').eq('vendorId', vendorId),
    ])

    const totalEarnings = ordersRes.data?.reduce((sum: number, o: any) => sum + (o.total || 0), 0) || 0
    const totalWithdrawals = withdrawalsRes.data?.reduce((sum: number, w: any) => sum + (w.amount || 0), 0) || 0
    const completedWithdrawals = withdrawalsRes.data?.filter((w: any) => w.status === 'completed') || []
    const pendingWithdrawals = withdrawalsRes.data?.filter((w: any) => w.status === 'pending') || []

    return NextResponse.json({
      balance: totalEarnings - totalWithdrawals,
      totalEarnings,
      totalWithdrawals,
      pendingAmount: pendingWithdrawals.reduce((sum: number, w: any) => sum + (w.amount || 0), 0),
      completedWithdrawalCount: completedWithdrawals.length,
      pendingWithdrawalCount: pendingWithdrawals.length,
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
