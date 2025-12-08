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

    const { data: vendor } = await supabase
      .from('Vendor')
      .select('id, userId')
      .eq('id', vendorId)
      .single()

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
    }

    const { data: shop, error: shopError } = await supabase
      .from('Shop')
      .select('*')
      .eq('vendorId', vendorId)
      .single()

    if (shopError && shopError.code !== 'PGRST116') {
      return NextResponse.json({ error: shopError.message }, { status: 400 })
    }

    const { data: shopDetail, error: detailError } = await supabase
      .from('ShopDetail')
      .select('*')
      .eq('shopId', shop?.id)
      .single()

    if (detailError && detailError.code !== 'PGRST116') {
      return NextResponse.json({ error: detailError.message }, { status: 400 })
    }

    return NextResponse.json({
      shop: shop || {},
      shopDetail: shopDetail || {},
    })
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request)
    if (!auth || !isVendor(auth)) {
      return unauthorizedResponse()
    }

    const vendorId = auth.vendorId
    const body = await request.json()

    const { data: vendor } = await supabase
      .from('Vendor')
      .select('id')
      .eq('id', vendorId)
      .single()

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
    }

    const { data: existingShop } = await supabase
      .from('Shop')
      .select('id')
      .eq('vendorId', vendorId)
      .single()

    let shop

    const shopData = {
      vendorId,
      name: body.shopName,
      image: body.shopLogo,
      description: body.shopDescription,
    }

    if (existingShop) {
      const { data: updatedShop, error: shopError } = await supabase
        .from('Shop')
        .update(shopData)
        .eq('id', existingShop.id)
        .select()
        .single()

      if (shopError) {
        return NextResponse.json({ error: shopError.message }, { status: 400 })
      }
      shop = updatedShop
    } else {
      const { data: newShop, error: shopError } = await supabase
        .from('Shop')
        .insert([shopData])
        .select()
        .single()

      if (shopError) {
        return NextResponse.json({ error: shopError.message }, { status: 400 })
      }
      shop = newShop
    }

    const { data: existingDetail } = await supabase
      .from('ShopDetail')
      .select('id')
      .eq('shopId', shop.id)
      .single()

    const shopDetailData = {
      shopId: shop.id,
      ownerName: body.ownerName,
      email: body.email,
      phone: body.phone,
      address: body.address,
      taxId: body.taxId,
      businessLicense: body.businessLicense,
      bankAccount: body.bankAccount,
      bankName: body.bankName,
      bankBranch: body.bankBranch,
    }

    if (existingDetail) {
      await supabase
        .from('ShopDetail')
        .update(shopDetailData)
        .eq('id', existingDetail.id)
    } else {
      await supabase
        .from('ShopDetail')
        .insert([shopDetailData])
    }

    let responseData: any = {
      shop,
    }

    const { data: updatedDetail } = await supabase
      .from('ShopDetail')
      .select('*')
      .eq('shopId', shop.id)
      .single()

    if (updatedDetail) {
      responseData.shopDetail = updatedDetail
    }

    return NextResponse.json(responseData, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    )
  }
}
