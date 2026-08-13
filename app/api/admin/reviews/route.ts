import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthFromRequest, isAdmin, unauthorizedResponse } from '@/lib/api-auth'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

async function requireAdmin(request: NextRequest) {
  const auth = await getAuthFromRequest(request)
  return auth && isAdmin(auth)
}

export async function GET(request: NextRequest) {
  try {
    if (!await requireAdmin(request)) return unauthorizedResponse()
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, Number(searchParams.get('page') || 1))
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || 20)))
    const { data, error, count } = await supabase.from('ProductReview')
      .select('id, productId, userId, rating, comment, createdAt, Product:productId(id, name, vendorId, Vendor:vendorId(id, name)), User:userId(id, name, email)', { count: 'exact' })
      .order('createdAt', { ascending: false }).range((page - 1) * limit, page * limit - 1)
    if (error) throw error
    return NextResponse.json({ data: data || [], pagination: { page, limit, total: count || 0, totalPages: Math.ceil((count || 0) / limit) } })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Không thể tải đánh giá' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!await requireAdmin(request)) return unauthorizedResponse()
    const reviewId = Number(new URL(request.url).searchParams.get('id'))
    if (!Number.isInteger(reviewId)) return NextResponse.json({ error: 'ID đánh giá không hợp lệ' }, { status: 400 })
    const { data: review, error: reviewError } = await supabase.from('ProductReview').select('id, productId').eq('id', reviewId).single()
    if (reviewError || !review) return NextResponse.json({ error: 'Không tìm thấy đánh giá' }, { status: 404 })
    const { error: deleteError } = await supabase.from('ProductReview').delete().eq('id', reviewId)
    if (deleteError) throw deleteError
    const { data: remaining, error: aggregateError } = await supabase.from('ProductReview').select('rating').eq('productId', review.productId)
    if (aggregateError) throw aggregateError
    const reviews = remaining?.length || 0
    const rating = reviews ? remaining!.reduce((sum, item) => sum + Number(item.rating || 0), 0) / reviews : 0
    const { error: productError } = await supabase.from('Product').update({ rating, reviews, updatedAt: new Date().toISOString() }).eq('id', review.productId)
    if (productError) throw productError
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Không thể xóa đánh giá' }, { status: 500 })
  }
}
