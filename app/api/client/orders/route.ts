import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { isCampaignActive } from '@/lib/price-utils'

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
        updatedAt,
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
          variantName,
          productId,
          Product(id, name),
          ProductVariant(id, name, image)
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
    const { userId, cartItems, shippingAddress, paymentMethod, shippingMethod, estimatedDelivery, vendorVouchers = {} } = body

    if (!userId || !cartItems || !shippingAddress || !paymentMethod) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const parsedUserId = parseInt(userId)

    // Calculate shipping cost based on method
    const shippingCostPerVendor = shippingMethod === "express" ? 30000 : 10000

    // Get active campaigns
    const now = new Date().toISOString()
    const { data: rawCampaigns } = await supabase
      .from('Campaign')
      .select('*')
      .eq('status', 'active')
      .lte('startDate', now)
      .gte('endDate', now)

    const activeCampaigns = (rawCampaigns || []).filter(isCampaignActive)

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
        const campaignKey = `${item.productId}-${item.variantId || 'null'}`
        const campaign = campaignMap.get(campaignKey)

        let basePrice = 0
        let unitPrice = 0
        let unitOriginal = 0

        // IMPORTANT: If variantId exists, MUST use variant price. Never fallback to product price for variant items.
        if (item.variantId) {
          const { data: variantRow, error: variantErr } = await supabase
            .from('ProductVariant')
            .select('price, originalPrice, name')
            .eq('id', item.variantId)
            .eq('productId', item.productId)
            .single()
          if (variantErr || !variantRow) {
            return NextResponse.json({ error: `Variant ${item.variantId} not found` }, { status: 404 })
          }
          // Use variant price - if null, it's an error, don't fallback to product
          if (!variantRow.price && variantRow.price !== 0) {
            return NextResponse.json({ error: `Variant ${item.variantId} has no price set` }, { status: 400 })
          }
          basePrice = variantRow.price
          unitOriginal = variantRow.originalPrice ?? basePrice
          // Store variant name for order item
          item.variantName = variantRow.name
        } else {
          // No variant, use product price
          const { data: productRow, error: productErr } = await supabase
            .from('Product')
            .select('price, originalPrice')
            .eq('id', item.productId)
            .single()
          if (productErr || !productRow) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 })
          }
          basePrice = productRow.price
          unitOriginal = productRow.originalPrice ?? basePrice
        }

        // Apply campaign discount if available
        let itemDiscount = 0
        if (campaign) {
          if (campaign.type === 'percentage') {
            itemDiscount = (basePrice * campaign.discountValue / 100) * item.quantity
            unitPrice = basePrice * (1 - campaign.discountValue / 100)
          } else if (campaign.type === 'fixed') {
            itemDiscount = campaign.discountValue * item.quantity
            unitPrice = Math.max(0, basePrice - campaign.discountValue)
          }
          discountAmount += itemDiscount
        } else {
          unitPrice = basePrice
        }

        const finalPrice = unitPrice * item.quantity
        itemsSubtotal += finalPrice

        itemsWithDiscounts.push({
          ...item,
          price: unitPrice,
          originalPrice: unitOriginal,
          discount: itemDiscount,
          finalPrice: finalPrice,
          campaign: campaign,
          taxApplied: item.taxApplied || false,
          taxRate: item.taxRate || 0,
        })
      }

      // Calculate tax for this vendor's items
      let totalTax = 0
      for (const item of itemsWithDiscounts) {
        if (item.taxApplied && item.taxRate && item.taxRate > 0) {
          const unitPrice = item.finalPrice / parseInt(item.quantity)
          const itemTax = Math.round(unitPrice * (item.taxRate / 100)) * parseInt(item.quantity)
          totalTax += itemTax
        }
      }
      
      let vendorTotal = itemsSubtotal + totalTax + shippingCostPerVendor
      
      // Apply voucher discount for this vendor
      const vendorVoucherInfo = vendorVouchers[vendorId.toString()]
      let voucherDiscount = 0
      if (vendorVoucherInfo) {
        voucherDiscount = vendorVoucherInfo.discountAmount || 0
        vendorTotal = Math.max(0, vendorTotal - voucherDiscount)
      }

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

      // Create OrderItems for this vendor with final price (after discount and tax)
      const orderItems = itemsWithDiscounts.map((item: any) => {
        let unitPrice = item.price
        
        let taxAmount = 0
        if (item.taxApplied && item.taxRate && item.taxRate > 0) {
          taxAmount = Math.round(unitPrice * (item.taxRate / 100))
        }
        
        return {
          orderId,
          productId: parseInt(item.productId),
          vendorId,
          variantId: item.variantId ? parseInt(item.variantId) : null,
          variantName: item.variantName || null,
          quantity: parseInt(item.quantity),
          price: unitPrice + taxAmount
        }
      })

      const { error: itemsError } = await supabase
        .from('OrderItem')
        .insert(orderItems)

      if (itemsError) {
        return NextResponse.json({ error: itemsError.message }, { status: 400 })
      }

      // Handle voucher usage tracking
      if (vendorVoucherInfo && vendorVoucherInfo.voucherId) {
        const voucherId = vendorVoucherInfo.voucherId
        const discountAmount = vendorVoucherInfo.discountAmount

        // Create VoucherUsage record
        const { error: usageError } = await supabase
          .from('VoucherUsage')
          .insert([{
            voucherId,
            userId: parsedUserId,
            orderId,
            discountAmount,
          }])

        if (usageError) {
          console.error('Failed to create voucher usage:', usageError)
        }

        // Increment usageCount on Voucher
        const { data: voucherData, error: voucherFetchError } = await supabase
          .from('Voucher')
          .select('usageCount')
          .eq('id', voucherId)
          .single()

        if (!voucherFetchError && voucherData) {
          await supabase
            .from('Voucher')
            .update({ usageCount: (voucherData.usageCount || 0) + 1 })
            .eq('id', voucherId)
        }
      }

      // Update campaign purchased quantity and deduct stock
      for (const item of itemsWithDiscounts) {
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
        } else {
          const { data: productRow } = await supabase
            .from('Product')
            .select('id, stock')
            .eq('id', item.productId)
            .single()

          if (productRow) {
            const newStock = Math.max(0, (productRow.stock || 0) - item.quantity)
            await supabase.from('Product').update({ stock: newStock }).eq('id', item.productId)
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
        updatedAt,
        shippingAddress,
        paymentMethod,
        Vendor(id, name),
        OrderItem(
          id,
          quantity,
          price,
          vendorId,
          variantId,
          variantName,
          productId,
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

    const parsedOrderId = parseInt(orderId)

    // Fetch existing order with items
    const { data: existingOrder, error: fetchError } = await supabase
      .from('Order')
      .select(`
        status,
        OrderItem(id)
      `)
      .eq('id', parsedOrderId)
      .single()

    if (fetchError || !existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Allow specific status transitions
    const validTransitions: Record<string, string[]> = {
      'pending': ['cancelled'],
      'delivered': ['completed']
    }

    const allowedStatuses = validTransitions[existingOrder.status] || []
    if (!allowedStatuses.includes(status)) {
      return NextResponse.json({ error: `Cannot update order from ${existingOrder.status} to ${status}` }, { status: 400 })
    }

    // If transitioning to 'completed', check for pending returns
    if (status === 'completed') {
      const orderItemIds = (existingOrder.OrderItem || []).map((item: any) => item.id)
      
      if (orderItemIds.length > 0) {
        const { data: pendingReturns, error: returnsError } = await supabase
          .from('Return')
          .select('id, status')
          .in('orderItemId', orderItemIds)
          .not('status', 'in', '("rejected","completed","cancelled")')

        if (!returnsError && pendingReturns && pendingReturns.length > 0) {
          return NextResponse.json(
            { error: 'Cannot complete order with pending returns. Please wait for all returns to be processed.' },
            { status: 400 }
          )
        }
      }
    }

    // Update order status
    const { data, error } = await supabase
      .from('Order')
      .update({ status })
      .eq('id', parsedOrderId)
      .select(`
        id,
        orderNumber,
        status,
        total,
        shippingCost,
        date,
        updatedAt,
        paymentMethod,
        shippingAddress,
        Vendor(id, name),
        OrderItem(
          id,
          quantity,
          price,
          vendorId,
          variantId,
          variantName,
          productId,
          Product(id, name),
          ProductVariant(id, name, image)
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
