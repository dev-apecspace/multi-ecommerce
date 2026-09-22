import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
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
    const params = new URL(request.url).searchParams
    const startDate = params.get('startDate') || params.get('start')
    const endDate = params.get('endDate') || params.get('end')
    const month = params.get('month') || new Date().toISOString().slice(0, 7)

    const [vendorRes, productsRes, ordersRes, reviewsRes] = await Promise.all([
      supabase
        .from('Vendor')
        .select('*')
        .eq('id', vendorId)
        .single(),
      supabase
        .from('Product')
        .select('*', { count: 'exact' })
        .eq('vendorId', vendorId),
      supabase
        .from('Order')
        .select('*, User(*), OrderItem(*, Product(*))')
        .eq('vendorId', vendorId)
        .order('createdAt', { ascending: false }),
      supabase
        .from('ProductReview')
        .select('rating, productId'),
    ])

    const productIds = productsRes.data?.map((p: any) => p.id) || []
    const sourceOrders = ordersRes.data || []
    const allOrders = sourceOrders.filter((order: any) => {
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
        return true
      }

      return String(order.createdAt || '').slice(0, 7) === month
    })
    const isRevenueEligible = (order: any) => ['delivered', 'completed'].includes(order.status) || (['bank', 'wallet'].includes(order.paymentMethod) && order.paymentStatus === 'paid')
    const settledOrders = allOrders.filter(isRevenueEligible)
    const currentMonthOrders = allOrders
    const currentMonthRevenueOrders = currentMonthOrders.filter(isRevenueEligible)
    const settledOrderIds = settledOrders.map((order: any) => order.id)
    const orderItemsRes = productIds.length > 0 && settledOrderIds.length > 0
      ? await supabase
          .from('OrderItem')
          .select('quantity, price, Product(*)')
          .in('productId', productIds)
          .in('orderId', settledOrderIds)
      : { data: [] }

    const vendor = vendorRes.data
    const products = productsRes.data || []
    const orders = allOrders.slice(0, 5)
    const reviews = (reviewsRes.data || []).filter((review: any) => productIds.includes(review.productId))
    const orderItems = orderItemsRes.data || []

    const totalRevenue = currentMonthRevenueOrders.reduce((sum: number, order: any) => sum + Number(order.total || 0), 0)
    const completedOrders = currentMonthRevenueOrders.length
    const averageRating = reviews.length > 0
      ? (reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
      : 0

    const topProducts = products
      .map((product: any) => {
        const itemsSold = orderItems.filter((item: any) => item.Product?.id === product.id)
        const totalSales = itemsSold.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0)
        const totalRevenue = itemsSold.reduce((sum: number, item: any) => sum + ((item.price || 0) * (item.quantity || 0)), 0)
        return {
          id: product.id,
          name: product.name,
          sales: totalSales,
          revenue: totalRevenue,
        }
      })
      .filter((p: any) => p.sales > 0)
      .sort((a: any, b: any) => b.sales - a.sales)
      .slice(0, 3)

    const recentOrders = orders.map((order: any) => {
      const productNames = order.OrderItem?.map((item: any) => item.Product?.name).filter(Boolean) || []
      const itemCount = order.OrderItem?.length || 0
      const buyerName = Array.isArray(order.User) 
        ? order.User[0]?.fullName 
        : order.User?.fullName
      return {
        id: order.id,
        buyer: buyerName || 'Khách hàng',
        products: productNames.length > 0 ? productNames.join(', ') : 'Sản phẩm',
        productCount: itemCount,
        amount: order.total || 0,
        status: order.status,
        date: order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN') : 'N/A',
      }
    })

    const stats = {
      productCount: productsRes.count || 0,
      orderCount: allOrders.length,
      completedOrders,
      totalRevenue,
      averageRating,
      followers: vendor?.followers || 0,
      orderStatus: { pending: currentMonthOrders.filter((o: any) => o.status === 'pending').length, processing: currentMonthOrders.filter((o: any) => o.status === 'processing').length, shipped: currentMonthOrders.filter((o: any) => o.status === 'shipped').length, delivered: currentMonthOrders.filter((o: any) => o.status === 'delivered').length, completed: currentMonthOrders.filter((o: any) => o.status === 'completed').length, cancelled: currentMonthOrders.filter((o: any) => o.status === 'cancelled').length },
    }

    return NextResponse.json({
      vendor: vendor || {},
      stats,
      recentOrders,
      topProducts,
      selectedMonth: month,
      monthly: Array.from({ length: 6 }, (_, index) => { const date = new Date(); date.setMonth(date.getMonth() - (5 - index)); const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; const monthOrders = sourceOrders.filter((order: any) => String(order.createdAt || '').slice(0, 7) === key); return { month: `T${date.getMonth() + 1}`, orders: monthOrders.length, revenue: monthOrders.filter(isRevenueEligible).reduce((sum: number, order: any) => sum + Number(order.total || 0), 0) } }),
    })
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    )
  }
}
