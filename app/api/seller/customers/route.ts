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
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

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
      // Note: This search on joined table might not work as expected with Supabase simple query builder
      // It's better to filter after fetching or use a more complex query.
      // But for now let's keep it or rely on client side search if this fails.
      // Actually, the previous code had: query = query.or(...) which is correct for Supabase if configured right.
      // But here I'm just reading what was there.
      // The previous code: query = query.or(`User.name.ilike.%${search}%,User.email.ilike.%${search}%,User.phone.ilike.%${search}%`)
      // This syntax is for top level columns usually. For joined columns it's tricky.
      // Let's assume the previous code was working or intended to work.
      // However, since we are aggregating in memory, maybe we should filter in memory too?
      // Let's fetch all orders for the vendor first (as before) then filter/paginate in memory.
    }

    const { data, error } = await query
      .order('date', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const customerMap = new Map<number, any>()
    
    data?.forEach((order: any) => {
      if (order.User) {
        // Filter by search term if provided (in memory to be safe)
        if (search) {
          const searchLower = search.toLowerCase()
          const name = order.User.name?.toLowerCase() || ''
          const email = order.User.email?.toLowerCase() || ''
          const phone = order.User.phone?.toLowerCase() || ''
          if (!name.includes(searchLower) && !email.includes(searchLower) && !phone.includes(searchLower)) {
            return
          }
        }

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

    const allCustomers = Array.from(customerMap.values())
    const total = allCustomers.length
    const paginatedCustomers = allCustomers.slice(offset, offset + limit)

    return NextResponse.json({
      data: paginatedCustomers,
      pagination: { total: total, limit, offset }
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
