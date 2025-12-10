import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    let query = supabase
      .from('Order')
      .select(`
        id,
        orderNumber,
        status,
        total,
        shippingCost,
        date,
        paymentMethod,
        paymentStatus,
        shippingAddress,
        estimatedDelivery,
        Vendor(id, name),
        OrderItem(
          id,
          quantity,
          price,
          vendorId,
          variantId,
          Product(id, name),
          ProductVariant(id, name),
          productId
        )
      `, { count: 'exact' })
      .eq('userId', parseInt(userId))

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error, count } = await query
      .order('date', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      data,
      pagination: { total: count, limit, offset }
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, cartItems, shippingAddress, paymentMethod, shippingMethod, estimatedDelivery } = body

    if (!userId || !cartItems || !shippingAddress || !paymentMethod) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const parsedUserId = parseInt(userId)

    // Calculate shipping cost based on method
    const shippingCostPerVendor = shippingMethod === "express" ? 30000 : 10000

    // Get active campaigns
    const now = new Date().toISOString()
    const { data: activeCampaigns } = await supabase
      .from('Campaign')
      .select('*')
      .eq('status', 'active')
      .lte('startDate', now)
      .gte('endDate', now)

    // Get approved campaign products
    let campaignProducts: any[] = []
    if (activeCampaigns && activeCampaigns.length > 0) {
      const { data } = await supabase
        .from('CampaignProduct')
        .select('*')
        .eq('status', 'approved')
        .in(
          'campaignId',
          activeCampaigns.map((c) => c.id)
        )
      campaignProducts = data || []
    }

    // Build campaign map: key = productId-variantId (or productId-null)
    const campaignMap = new Map()
    campaignProducts.forEach((cp) => {
      const key = `${cp.productId}-${cp.variantId || 'null'}`
      const campaign = activeCampaigns?.find((c) => c.id === cp.campaignId)
      campaignMap.set(key, campaign)
    })

    // Group cart items by vendorId
    const itemsByVendor: Map<number, any[]> = new Map()

    for (const item of cartItems) {
      if (!item.vendorId) {
        return NextResponse.json({ error: 'Cart item must have vendorId' }, { status: 400 })
      }
      const vendorId = parseInt(item.vendorId)
      if (!itemsByVendor.has(vendorId)) {
        itemsByVendor.set(vendorId, [])
      }
      itemsByVendor.get(vendorId)!.push(item)
    }

    const createdOrders = []

    // Create separate Order for each vendor
    for (const [vendorId, vendorItems] of itemsByVendor.entries()) {
      let itemsSubtotal = 0
      let discountAmount = 0

      // Calculate subtotal and discount for each item, using server-trusted prices
      const itemsWithDiscounts = []
      for (const item of vendorItems) {
        // Fetch latest price for product/variant
        const { data: productRow, error: productErr } = await supabase
          .from('Product')
          .select('price, originalPrice')
          .eq('id', item.productId)
          .single()
        if (productErr || !productRow) {
          return NextResponse.json({ error: 'Product not found' }, { status: 404 })
        }
        let unitPrice = productRow.price
        let unitOriginal = productRow.originalPrice ?? productRow.price

        if (item.variantId) {
          const { data: variantRow, error: variantErr } = await supabase
            .from('ProductVariant')
            .select('price, originalPrice')
            .eq('id', item.variantId)
            .eq('productId', item.productId)
            .single()
          if (variantErr || !variantRow) {
            return NextResponse.json({ error: 'Variant not found' }, { status: 404 })
          }
          unitPrice = variantRow.price ?? unitPrice
          unitOriginal = variantRow.originalPrice ?? unitOriginal
        }

        const basePrice = unitPrice * item.quantity
        const campaignKey = `${item.productId}-${item.variantId || 'null'}`
        const campaign = campaignMap.get(campaignKey)

        let itemDiscount = 0
        let finalPrice = basePrice

        if (campaign) {
          if (campaign.type === 'percentage') {
            itemDiscount = (basePrice * campaign.discountValue) / 100
          } else if (campaign.type === 'fixed') {
            itemDiscount = campaign.discountValue * item.quantity
          }
          finalPrice = Math.max(0, basePrice - itemDiscount)
          discountAmount += itemDiscount
        }

        itemsSubtotal += finalPrice

        itemsWithDiscounts.push({
          ...item,
          price: unitPrice,
          originalPrice: unitOriginal,
          discount: itemDiscount,
          finalPrice: finalPrice,
          campaign: campaign,
        })
      }

      const vendorTotal = itemsSubtotal + shippingCostPerVendor
      const orderNumber = `ORD${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`

      // Determine payment status based on payment method
      // wallet: paid immediately
      // bank: pending (needs confirmation)
      // cod: pending (will be paid on delivery)
      const paymentStatus = paymentMethod === 'wallet' ? 'paid' : 'pending'

      const { data: orderData, error: orderError } = await supabase
        .from('Order')
        .insert([{
          orderNumber,
          userId: parsedUserId,
          vendorId,
          status: 'pending',
          total: vendorTotal,
          shippingCost: shippingCostPerVendor,
          paymentMethod,
          paymentStatus,
          shippingAddress: JSON.stringify(shippingAddress),
          estimatedDelivery
        }])
        .select()

      if (orderError) {
        return NextResponse.json({ error: orderError.message }, { status: 400 })
      }

      const orderId = orderData[0].id
      createdOrders.push(orderData[0])

      // Create OrderItems for this vendor with final price (after discount)
      const orderItems = itemsWithDiscounts.map((item: any) => ({
        orderId,
        productId: parseInt(item.productId),
        vendorId,
        variantId: item.variantId ? parseInt(item.variantId) : null,
        quantity: parseInt(item.quantity),
        price: item.finalPrice / parseInt(item.quantity)
      }))

      const { error: itemsError } = await supabase
        .from('OrderItem')
        .insert(orderItems)

      if (itemsError) {
        return NextResponse.json({ error: itemsError.message }, { status: 400 })
      }

      // Update campaign purchased quantity and deduct stock
      for (const item of itemsWithDiscounts) {
        // Deduct stock for product / variant
        const { data: productRow } = await supabase
          .from('Product')
          .select('id, stock')
          .eq('id', item.productId)
          .single()

        if (productRow) {
          const newStock = Math.max(0, (productRow.stock || 0) - item.quantity)
          await supabase.from('Product').update({ stock: newStock }).eq('id', item.productId)
        }

        if (item.variantId) {
          const { data: variantRow } = await supabase
            .from('ProductVariant')
            .select('id, stock')
            .eq('id', item.variantId)
            .single()
          if (variantRow) {
            const newVariantStock = Math.max(0, (variantRow.stock || 0) - item.quantity)
            await supabase.from('ProductVariant').update({ stock: newVariantStock }).eq('id', item.variantId)
          }
        }

        // Update campaign product purchased quantity
        if (item.campaign) {
          const { data: campaignProd } = await supabase
            .from('CampaignProduct')
            .select('id, purchasedQuantity')
            .eq('campaignId', item.campaign.id)
            .eq('productId', item.productId)
            .eq('variantId', item.variantId || null)
            .single()

          if (campaignProd) {
            await supabase
              .from('CampaignProduct')
              .update({
                purchasedQuantity: (campaignProd.purchasedQuantity || 0) + item.quantity
              })
              .eq('id', campaignProd.id)
          }
        }
      }
    }

    // Clear cart for this user
    await supabase
      .from('CartItem')
      .delete()
      .eq('userId', parsedUserId)

    // Fetch complete order data for all created orders
    const { data: allOrders } = await supabase
      .from('Order')
      .select(`
        id,
        orderNumber,
        status,
        total,
        shippingCost,
        date,
        shippingAddress,
        paymentMethod,
        Vendor(id, name),
        OrderItem(
          id,
          quantity,
          price,
          vendorId,
          variantId,
          Product(id, name),
          ProductVariant(id, name, image)
        )
      `)
      .in('id', createdOrders.map(o => o.id))

    return NextResponse.json({ data: allOrders }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, status } = body

    if (!orderId || !status) {
      return NextResponse.json({ error: 'Order ID and status required' }, { status: 400 })
    }

    // Only allow cancellation of pending orders
    const { data: existingOrder, error: fetchError } = await supabase
      .from('Order')
      .select('status')
      .eq('id', parseInt(orderId))
      .single()

    if (fetchError || !existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (existingOrder.status !== 'pending') {
      return NextResponse.json({ error: 'Only pending orders can be cancelled' }, { status: 400 })
    }

    // Update order status
    const { data, error } = await supabase
      .from('Order')
      .update({ status })
      .eq('id', parseInt(orderId))
      .select(`
        id,
        orderNumber,
        status,
        total,
        shippingCost,
        date,
        paymentMethod,
        shippingAddress,
        Vendor(id, name),
        OrderItem(
          id,
          quantity,
          price,
          vendorId,
          variantId,
          Product(id, name),
          ProductVariant(id, name)
        )
      `)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data: data[0] })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
