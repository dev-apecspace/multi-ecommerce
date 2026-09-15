import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest, { params }: { params: Promise<{ orderNumber: string }> }) {
  const userId = Number(request.nextUrl.searchParams.get('userId'))
  const { orderNumber } = await params

  if (!Number.isInteger(userId) || userId <= 0) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 })
  }

  const { data: order, error } = await supabase
    .from('Order')
    .select(`
      id, orderNumber, status, total, shippingCost, date, updatedAt,
      paymentMethod, paymentStatus, paymentProofUrl, paymentSubmittedAt,
      paymentVerificationStatus, paymentVerificationData, paymentVerifiedAt,
      shippingAddress, estimatedDelivery,
      Vendor(id, name, bankAccount, bankName, bankCode, bankBin, bankBranch, walletProvider, walletAccount, walletQrUrl),
      OrderItem(id, quantity, price, vendorId, variantId, variantName, productId, Product(id, name, media), ProductVariant(id, name, image))
    `)
    .eq('userId', userId)
    .eq('orderNumber', decodeURIComponent(orderNumber))
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  const transformedOrder: any = {
    ...order,
    OrderItem: order.OrderItem?.map((item: any) => {
      const media = item.Product?.media
      const image = Array.isArray(media) && media.length
        ? (media.find((entry: any) => entry.isMain)?.url || media[0]?.url || null)
        : null
      return { ...item, Product: item.Product ? { ...item.Product, image } : item.Product }
    }) || [],
  }

  return NextResponse.json({ data: transformedOrder })
}
