import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthFromRequest, unauthorizedResponse } from '@/lib/api-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const parseUserId = (value: string | number | null | undefined) => {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const parsed = parseInt(value, 10)
    return Number.isNaN(parsed) ? null : parsed
  }
  return null
}

const ensureOrderEligibility = async (productId: number, orderId: number, userId: number) => {
  const { data: order, error: orderError } = await supabase
    .from('Order')
    .select('id, userId, status')
    .eq('id', orderId)
    .single()

  if (orderError) throw orderError
  const orderUserId = typeof order?.userId === 'number' ? order.userId : parseInt(String(order?.userId), 10)
  if (!order || !orderUserId || orderUserId !== userId) {
    return { ok: false, status: 403, message: 'Không thể đánh giá đơn hàng này' }
  }

  if (order.status !== 'completed') {
    return { ok: false, status: 400, message: 'Chỉ có thể đánh giá khi đơn hàng đã hoàn thành' }
  }

  const { data: orderItem, error: orderItemError } = await supabase
    .from('OrderItem')
    .select('id')
    .eq('orderId', orderId)
    .eq('productId', productId)
    .limit(1)
    .maybeSingle()

  if (orderItemError) throw orderItemError
  if (!orderItem) {
    return { ok: false, status: 400, message: 'Sản phẩm không thuộc đơn hàng này' }
  }

  return { ok: true }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request)

    if (!auth) {
      return unauthorizedResponse()
    }

    const userId = parseUserId(auth.userId)

    if (!userId) {
      return NextResponse.json({ error: 'Invalid user' }, { status: 400 })
    }

    const body = await request.json()
    const { productId, orderId, rating, comment } = body

    const parsedProductId = Number(productId)
    const parsedOrderId = Number(orderId)
    const parsedRating = Number(rating)

    if (!Number.isInteger(parsedProductId) || !Number.isInteger(parsedOrderId) || Number.isNaN(parsedRating)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      )
    }

    const eligibility = await ensureOrderEligibility(parsedProductId, parsedOrderId, userId)

    if (!eligibility.ok) {
      return NextResponse.json({ error: eligibility.message }, { status: eligibility.status })
    }

    const { data, error } = await supabase
      .from('ProductReview')
      .insert({
        productId: parsedProductId,
        userId,
        orderId: parsedOrderId,
        rating: parsedRating,
        comment: typeof comment === 'string' && comment.trim().length > 0 ? comment : null,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'You have already reviewed this product from this order' },
          { status: 409 }
        )
      }
      throw error
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error creating review:', error)
    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const productId = searchParams.get('productId')
    const userId = searchParams.get('userId')
    const orderId = searchParams.get('orderId')
    const vendorId = searchParams.get('vendorId')
    const rating = searchParams.get('rating')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('ProductReview')
      .select(`
        id,
        productId,
        userId,
        orderId,
        rating,
        comment,
        createdAt,
        User:userId(id, name, email),
        Product:productId(id, name)
      `, { count: 'exact' })
      .order('createdAt', { ascending: false })

    if (productId) {
      query = query.eq('productId', parseInt(productId))
    }

    if (userId) {
      query = query.eq('userId', parseInt(userId))
    }

    if (orderId) {
      query = query.eq('orderId', parseInt(orderId))
    }

    if (rating) {
      query = query.eq('rating', parseInt(rating))
    }
    
    if (vendorId) {
      // Find products by this vendor first
      const { data: products } = await supabase
        .from('Product')
        .select('id')
        .eq('vendorId', parseInt(vendorId))
      
      if (products && products.length > 0) {
        const productIds = products.map(p => p.id)
        query = query.in('productId', productIds)
      } else {
        // Vendor has no products, so no reviews
        return NextResponse.json({ 
          data: [],
          pagination: { total: 0, limit, offset }
        })
      }
    }

    const { data, error, count } = await query.range(offset, offset + limit - 1)

    if (error) throw error

    return NextResponse.json({ 
      data,
      pagination: { total: count, limit, offset }
    })
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request)

    if (!auth) {
      return unauthorizedResponse()
    }

    const userId = parseUserId(auth.userId)

    if (!userId) {
      return NextResponse.json({ error: 'Invalid user' }, { status: 400 })
    }

    const body = await request.json()
    const { id, rating, comment } = body

    const reviewId = Number(id)
    const parsedRating = Number(rating)

    if (!Number.isInteger(reviewId) || Number.isNaN(parsedRating)) {
      return NextResponse.json({ error: 'Invalid review data' }, { status: 400 })
    }

    if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
    }

    const { data: existing, error: existingError } = await supabase
      .from('ProductReview')
      .select('id, userId, orderId, productId')
      .eq('id', reviewId)
      .single()

    if (existingError || !existing) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    if (existing.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized to update this review' }, { status: 403 })
    }

    const eligibility = await ensureOrderEligibility(existing.productId, existing.orderId, userId)

    if (!eligibility.ok) {
      return NextResponse.json({ error: eligibility.message }, { status: eligibility.status })
    }

    const { data, error } = await supabase
      .from('ProductReview')
      .update({
        rating: parsedRating,
        comment: typeof comment === 'string' && comment.trim().length > 0 ? comment : null,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', reviewId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating review:', error)
    return NextResponse.json(
      { error: 'Failed to update review' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request)

    if (!auth) {
      return unauthorizedResponse()
    }

    const userId = parseUserId(auth.userId)

    if (!userId) {
      return NextResponse.json({ error: 'Invalid user' }, { status: 400 })
    }

    const searchParams = request.nextUrl.searchParams
    const reviewId = searchParams.get('id')

    if (!reviewId) {
      return NextResponse.json(
        { error: 'Review ID is required' },
        { status: 400 }
      )
    }

    const parsedReviewId = parseInt(reviewId, 10)

    if (Number.isNaN(parsedReviewId)) {
      return NextResponse.json(
        { error: 'Invalid review ID' },
        { status: 400 }
      )
    }

    const { data: review } = await supabase
      .from('ProductReview')
      .select('userId')
      .eq('id', parsedReviewId)
      .single()

    if (!review || review.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this review' },
        { status: 403 }
      )
    }

    const { error } = await supabase
      .from('ProductReview')
      .delete()
      .eq('id', parsedReviewId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting review:', error)
    return NextResponse.json(
      { error: 'Failed to delete review' },
      { status: 500 }
    )
  }
}
