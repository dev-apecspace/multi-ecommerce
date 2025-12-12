import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vendorId = searchParams.get('vendorId')
    const search = searchParams.get('search')

    if (!vendorId) {
      return NextResponse.json({ error: 'Vendor ID required' }, { status: 400 })
    }

    let query = supabase
      .from('Order')
      .select(`
        userId,
        total,
        User(
          id,
          name,
          email,
          phone,
          joinDate
        )
      `)
      .eq('vendorId', parseInt(vendorId))

    if (search) {
      query = query.or(`User.name.ilike.%${search}%,User.email.ilike.%${search}%,User.phone.ilike.%${search}%`)
    }

    const { data, error } = await query
      .order('date', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const customerMap = new Map<number, any>()
    
    data?.forEach((order: any) => {
      if (order.User) {
        if (!customerMap.has(order.User.id)) {
          customerMap.set(order.User.id, {
            id: order.User.id,
            name: order.User.name,
            email: order.User.email,
            phone: order.User.phone,
            joinDate: order.User.joinDate,
            totalSpent: 0,
            orders: 0
          })
        }
        const customer = customerMap.get(order.User.id)
        customer.totalSpent += order.total || 0
        customer.orders += 1
      }
    })

    const customers = Array.from(customerMap.values())

    return NextResponse.json({
      data: customers,
      pagination: { total: customers.length, limit: customers.length, offset: 0 }
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
