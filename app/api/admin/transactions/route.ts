import { isRevenueEligible, getOrderRevenue, isPendingRevenue, getRetainedOrderValue } from '@/lib/order-revenue'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthFromRequest, isAdmin, unauthorizedResponse } from '@/lib/api-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request)
    if (!isAdmin(auth)) return unauthorizedResponse()

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate') || searchParams.get('start') || ''
    const endDate = searchParams.get('endDate') || searchParams.get('end') || ''
    const paymentStatus = searchParams.get('paymentStatus') || ''
    const paymentMethod = searchParams.get('paymentMethod') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '15')
    const offset = (page - 1) * limit

    let query = supabase
      .from('Order')
      .select(`
        id,
        orderNumber,
        status,
        total,
        shippingCost,
        date,
        createdAt,
        paymentMethod,
        paymentStatus,
        Return(status,returnType,refundAmount,orderItemId,quantity),
        paymentProofUrl,
        paymentSubmittedAt,
        paymentVerificationStatus,
        paymentVerificationData,
        paymentVerifiedAt,
        Vendor(id, name),
        User(id, name, email, phone),
        OrderItem(
          id,
          quantity,
          price,
          variantName,
          Product(id, name, media)
        )
      `, { count: 'exact' })

    const { data: allOrdersData, error: allOrdersErr } = await supabase
      .from('Order')
      .select('id, total, status, paymentMethod, paymentStatus, createdAt, Return(status,returnType,refundAmount,orderItemId,quantity)')

    if (allOrdersErr) {
      return NextResponse.json({ error: allOrdersErr.message }, { status: 400 })
    }

    const filteredSummaryOrders = (allOrdersData || []).filter((order: any) => {
      const createdAt = order.createdAt ? new Date(order.createdAt) : null
      if (!createdAt || isNaN(createdAt.getTime())) return false

      if (startDate || endDate) {
        if (startDate) {
          const start = new Date(`${startDate}T00:00:00`)
          if (createdAt < start) return false
        }
        if (endDate) {
          const end = new Date(`${endDate}T23:59:59.999`)
          if (createdAt > end) return false
        }
      }
      return true
    })

    const isEligible = isRevenueEligible

    const paidOrders = filteredSummaryOrders.filter(isEligible)
    const totalPlatformRevenue = paidOrders.reduce((sum: number, o: any) => sum + getOrderRevenue(o), 0)
    const pendingOrders = filteredSummaryOrders.filter(isPendingRevenue)
    const pendingRevenue = pendingOrders.reduce((sum: number, o: any) => sum + getRetainedOrderValue(o), 0)
    const cancelledOrders = filteredSummaryOrders.filter((o: any) => o.status === 'cancelled')
    const cancelledRevenue = cancelledOrders.reduce((sum: number, o: any) => sum + Number(o.total || 0), 0)

    let filteredQuery = query.order('createdAt', { ascending: false })

    if (paymentMethod) {
      filteredQuery = filteredQuery.eq('paymentMethod', paymentMethod)
    }

    if (paymentStatus === 'paid') {
      filteredQuery = filteredQuery.in('id', paidOrders.map((order: any) => order.id))
    } else if (paymentStatus === 'pending') {
      filteredQuery = filteredQuery.in('id', pendingOrders.map((order: any) => order.id))
    } else if (paymentStatus === 'returned') {
      filteredQuery = filteredQuery.eq('status', 'returned')
    } else if (paymentStatus === 'refunded') {
      filteredQuery = filteredQuery.eq('paymentStatus', 'refunded')
    } else if (paymentStatus === 'cancelled') {
      filteredQuery = filteredQuery.eq('status', 'cancelled')
    }

    if (startDate) {
      filteredQuery = filteredQuery.gte('createdAt', `${startDate}T00:00:00`)
    }
    if (endDate) {
      filteredQuery = filteredQuery.lte('createdAt', `${endDate}T23:59:59.999`)
    }

    const { data: pageOrders, error: pageErr, count } = await filteredQuery.range(offset, offset + limit - 1)

    if (pageErr) {
      return NextResponse.json({ error: pageErr.message }, { status: 400 })
    }

    const transformedData = pageOrders?.map((order: any) => {
      const isOrderPaid = isEligible(order)
      if (order.OrderItem) {
        order.OrderItem = order.OrderItem.map((item: any) => {
          if (item.Product && item.Product.media) {
            const media = item.Product.media
            let image = null
            if (Array.isArray(media) && media.length > 0) {
              const mainImage = media.find((m: any) => m.isMain)
              image = mainImage ? mainImage.url : media[0].url
            }
            item.Product.image = image
          }
          return item
        })
      }
      return {
        ...order,
        isEligibleRevenue: isOrderPaid,
        netRevenue: getOrderRevenue(order),
      }
    }) || []

    return NextResponse.json({
      summary: {
        totalRevenue: totalPlatformRevenue,
        pendingRevenue,
        cancelledRevenue,
        totalTransactions: count || 0,
        paidTransactionsCount: paidOrders.length,
      },
      data: transformedData,
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
