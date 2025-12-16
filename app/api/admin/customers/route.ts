import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    let query = supabase
      .from('User')
      .select('id, name, email, phone, status, joinDate, createdAt', { count: 'exact' })
      .eq('role', 'customer')

    if (status) {
      query = query.eq('status', status)
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)
    }

    const { data: users, error, count } = await query
      .order('createdAt', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const { data: allOrders } = await supabase
      .from('Order')
      .select('userId, total')

    const orderMap = new Map<number, { totalSpent: number; orders: number }>()
    allOrders?.forEach((order: any) => {
      if (!orderMap.has(order.userId)) {
        orderMap.set(order.userId, { totalSpent: 0, orders: 0 })
      }
      const stats = orderMap.get(order.userId)!
      stats.totalSpent += order.total || 0
      stats.orders += 1
    })

    const enrichedUsers = users?.map((user: any) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone || 'N/A',
      status: user.status,
      joinDate: user.joinDate,
      createdAt: user.createdAt,
      totalSpent: orderMap.get(user.id)?.totalSpent || 0,
      orders: orderMap.get(user.id)?.orders || 0
    })) || []

    const totalPages = Math.ceil((count || 0) / limit)

    return NextResponse.json({
      data: enrichedUsers,
      pagination: { total: count || 0, limit, page, totalPages }
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, status } = body

    if (!userId || !status) {
      return NextResponse.json({ error: 'User ID and status required' }, { status: 400 })
    }

    const validStatuses = ['active', 'locked']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('User')
      .update({ status })
      .eq('id', parseInt(userId))
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    return NextResponse.json({ data: data[0] })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
