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
        .order('createdAt', { ascending: false })
        .limit(5),
      supabase
        .from('Review')
        .select('rating')
        .eq('vendorId', vendorId),
    ])

    const productIds = productsRes.data?.map((p: any) => p.id) || []
    const orderItemsRes = productIds.length > 0
      ? await supabase
          .from('OrderItem')
          .select('quantity, price, Product(*)')
          .in('productId', productIds)
      : { data: [] }

    const vendor = vendorRes.data
    const products = productsRes.data || []
    const orders = ordersRes.data || []
    const reviews = reviewsRes.data || []
    const orderItems = orderItemsRes.data || []

    const totalRevenue = orders.reduce((sum: number, order: any) => sum + (order.total || 0), 0)
    const allOrders = await supabase
      .from('Order')
      .select('*')
      .eq('vendorId', vendorId)
    const completedOrders = allOrders.data?.filter((o: any) => o.status === 'completed' || o.status === 'delivered').length || 0
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
      orderCount: allOrders.count || 0,
      completedOrders,
      totalRevenue,
      averageRating,
      followers: vendor?.followers || 0,
    }

    return NextResponse.json({
      vendor: vendor || {},
      stats,
      recentOrders,
      topProducts,
    })
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    )
  }
}
