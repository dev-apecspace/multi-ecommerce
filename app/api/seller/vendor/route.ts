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

    const { data: vendor, error: vendorError } = await supabase
      .from('Vendor')
      .select('*')
      .eq('id', vendorId)
      .single()

    if (vendorError || !vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
    }

    const { data: user, error: userError } = await supabase
      .from('User')
      .select('name, email, phone')
      .eq('id', vendor.userId)
      .single()

    if (userError) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { data: userProfileArray, error: profileError } = await supabase
      .from('UserProfile')
      .select('avatar')
      .eq('userId', vendor.userId)

    const userProfile = userProfileArray && userProfileArray.length > 0 ? userProfileArray[0] : null

    const { data: shop } = await supabase
      .from('Shop')
      .select('id')
      .eq('vendorId', vendor.id)
      .maybeSingle()

    let shopDetail = null
    if (shop && shop.id) {
      const { data: detail } = await supabase
        .from('ShopDetail')
        .select('*')
        .eq('shopId', shop.id)
        .maybeSingle()
      shopDetail = detail
    }

    console.log('UserProfile query:', { userId: vendor.userId, data: userProfile, error: profileError })

    return NextResponse.json({
      vendor,
      user,
      userProfile,
      shop,
      shopDetail,
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
    const userId = auth.userId as number
    const body = await request.json()

    const { data: vendor, error: vendorError } = await supabase
      .from('Vendor')
      .select('id')
      .eq('id', vendorId)
      .single()

    if (vendorError || !vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
    }

    const vendorData: any = {}
    if (body.shopName) vendorData.name = body.shopName
    if (body.vendorLogo) vendorData.logo = body.vendorLogo
    if (body.shopLogo) vendorData.coverImage = body.shopLogo
    if (body.shopDescription) vendorData.description = body.shopDescription
    if (body.address) vendorData.businessAddress = body.address
    if (body.taxId) vendorData.taxId = body.taxId
    if (body.businessLicense) vendorData.businessLicense = body.businessLicense
    if (body.bankAccount) vendorData.bankAccount = body.bankAccount
    if (body.bankName) vendorData.bankName = body.bankName
    if (body.bankBranch) vendorData.bankBranch = body.bankBranch

    const { data: updatedVendor, error: updateError } = await supabase
      .from('Vendor')
      .update(vendorData)
      .eq('id', vendorId)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 })
    }

    const userData: any = {}
    if (body.ownerName) userData.name = body.ownerName
    if (body.email) userData.email = body.email
    if (body.phone) userData.phone = body.phone

    if (Object.keys(userData).length > 0) {
      await supabase
        .from('User')
        .update(userData)
        .eq('id', userId)
    }

    const { data: shop } = await supabase
      .from('Shop')
      .select('id')
      .eq('vendorId', vendorId)
      .maybeSingle()

    if (shop && shop.id) {
      const shopDetailData: any = {}
      if (body.address) shopDetailData.address = body.address
      if (body.email) shopDetailData.email = body.email
      if (body.phone) shopDetailData.phone = body.phone
      if (body.ownerName) shopDetailData.ownerName = body.ownerName
      if (body.taxId) shopDetailData.taxId = body.taxId
      if (body.businessLicense) shopDetailData.businessLicense = body.businessLicense
      if (body.bankAccount) shopDetailData.bankAccount = body.bankAccount
      if (body.bankName) shopDetailData.bankName = body.bankName
      if (body.bankBranch) shopDetailData.bankBranch = body.bankBranch

      if (Object.keys(shopDetailData).length > 0) {
        const { data: existingDetail } = await supabase
          .from('ShopDetail')
          .select('id')
          .eq('shopId', shop.id)
          .maybeSingle()

        if (existingDetail) {
          await supabase
            .from('ShopDetail')
            .update(shopDetailData)
            .eq('shopId', shop.id)
        } else {
          await supabase
            .from('ShopDetail')
            .insert([{ shopId: shop.id, ...shopDetailData }])
        }
      }
    }

    if (body.vendorLogo) {
      const { data: existingProfile } = await supabase
        .from('UserProfile')
        .select('id')
        .eq('userId', userId)
        .single()

      if (existingProfile) {
        await supabase
          .from('UserProfile')
          .update({ avatar: body.vendorLogo })
          .eq('userId', userId)
      } else {
        await supabase
          .from('UserProfile')
          .insert([{ userId, avatar: body.vendorLogo }])
      }
    }

    const { data: user } = await supabase
      .from('User')
      .select('name, email, phone')
      .eq('id', userId)
      .single()

    const { data: userProfileArray } = await supabase
      .from('UserProfile')
      .select('avatar')
      .eq('userId', userId)

    const userProfile = userProfileArray && userProfileArray.length > 0 ? userProfileArray[0] : null

    return NextResponse.json({
      vendor: updatedVendor,
      user,
      userProfile: userProfile || null,
    }, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    )
  }
}
