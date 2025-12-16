import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { generateSlug } from '@/lib/utils'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    let query = supabase
      .from('Vendor')
      .select('*', { count: 'exact' })

    if (status) query = query.eq('status', status)

    const { data, error, count } = await query
      .order('joinDate', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    
    let enrichedData = data || []
    if (data && data.length > 0) {
      enrichedData = await Promise.all(
        data.map(async (vendor: any) => {
          const { data: userData } = await supabase
            .from('User')
            .select('email, phone')
            .eq('id', vendor.userId)
            .maybeSingle()
          
          const { count: productCount } = await supabase
            .from('Product')
            .select('*', { count: 'exact', head: true })
            .eq('vendorId', vendor.id)
            .eq('status', 'approved')
          
          const { data: reviews } = await supabase
            .from('ProductReview')
            .select('rating')
            .in('productId', 
              (await supabase
                .from('Product')
                .select('id')
                .eq('vendorId', vendor.id)
              ).data?.map((p: any) => p.id) || []
            )
          
          const avgRating = reviews && reviews.length > 0 
            ? (reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length).toFixed(1)
            : 0
          
          return {
            ...vendor,
            products: productCount || 0,
            rating: parseFloat(avgRating as string) || 0,
            Shop: {
              ShopDetail: {
                email: userData?.email || '',
                phone: userData?.phone || '',
                address: vendor.businessAddress || '',
                taxId: vendor.taxId || '',
                businessLicense: vendor.businessLicense || '',
                bankAccount: vendor.bankAccount || '',
                bankName: vendor.bankName || '',
              },
            },
          }
        })
      )
    }
    
    const totalPages = Math.ceil((count || 0) / limit)
    
    return NextResponse.json({
      data: enrichedData,
      pagination: { total: count, limit, page, totalPages },
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    if (!body.name) {
      return NextResponse.json({ error: 'Vendor name is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('Vendor')
      .insert([{
        name: body.name,
        slug: generateSlug(body.name),
        status: body.status || 'pending',
      }])
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    return NextResponse.json(data[0], { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vendorId = searchParams.get('id')
    const action = searchParams.get('action')
    const body = await request.json()

    if (!vendorId) return NextResponse.json({ error: 'Vendor ID required' }, { status: 400 })

    if (action === 'lock') {
      const { data: vendorData } = await supabase
        .from('Vendor')
        .select('*')
        .eq('id', vendorId)
        .maybeSingle()

      if (!vendorData) {
        return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
      }

      const { data: shopData } = await supabase
        .from('Shop')
        .select('*')
        .eq('vendorId', vendorId)
        .maybeSingle()

      if (shopData) {
        await supabase
          .from('Shop')
          .update({
            locked: true,
            lockedReason: body.reason || '',
            lockedAt: new Date().toISOString(),
          })
          .eq('vendorId', vendorId)
      }

      return NextResponse.json({ success: true, message: 'Vendor locked successfully' })
    }

    if (action === 'unlock') {
      const { data: shopData } = await supabase
        .from('Shop')
        .select('*')
        .eq('vendorId', vendorId)
        .maybeSingle()

      if (shopData) {
        await supabase
          .from('Shop')
          .update({
            locked: false,
            lockedReason: null,
            lockedAt: null,
          })
          .eq('vendorId', vendorId)
      }

      return NextResponse.json({ success: true, message: 'Vendor unlocked successfully' })
    }

    const { data: vendorData, error: vendorError } = await supabase
      .from('Vendor')
      .select('userId')
      .eq('id', vendorId)
      .maybeSingle()

    if (vendorError || !vendorData) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
    }

    const { data, error } = await supabase
      .from('Vendor')
      .update(body)
      .eq('id', vendorId)
      .select()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    if (body.status && vendorData.userId) {
      let userStatus = 'active'
      if (body.status === 'approved') {
        userStatus = 'active'
      } else if (body.status === 'rejected') {
        userStatus = 'inactive'
      } else if (body.status === 'pending') {
        userStatus = 'pending'
      }

      await supabase
        .from('User')
        .update({ status: userStatus })
        .eq('id', vendorData.userId)
    }

    return NextResponse.json(data[0])
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vendorId = searchParams.get('id')

    if (!vendorId) {
      return NextResponse.json({ error: 'Vendor ID required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('Vendor')
      .delete()
      .eq('id', vendorId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ message: 'Vendor deleted successfully' })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
