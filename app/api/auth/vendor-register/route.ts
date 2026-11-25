import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcryptjs from 'bcryptjs'
import { generateToken } from '@/lib/jwt'
import { generateSlug } from '@/lib/utils'
import { getAuthFromRequest } from '@/lib/api-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request)
    let {
      email,
      password,
      name,
      phone,
      shopName,
      shopDescription,
      businessAddress,
      taxId,
      businessLicense,
      logo,
      businessDocuments,
      bankAccount,
      bankName,
      bankCode,
      bankBin,
      bankAccountHolder,
      warningVersion,
      warningAccepted,
      regulatedBusiness,
    } = await request.json()

    console.log('Vendor register request:', {
      email,
      password: '***',
      name,
      phone,
      shopName,
      logo: logo ? 'provided' : 'missing',
      businessDocuments,
    })

    const hasAccountSession = Boolean(auth)
    if ((!hasAccountSession && (!email || !password || !name || !phone)) || !shopName || !shopDescription || !businessAddress || !taxId || !businessLicense || !logo || !bankAccount || !bankName || !bankCode || !bankBin || !bankAccountHolder || !Array.isArray(businessDocuments) || businessDocuments.length === 0) {
      return NextResponse.json(
        { error: 'Email, password, name, shop name, logo, and at least one business document are required' },
        { status: 400 }
      )
    }

    if (!hasAccountSession && (!password || password.length < 8)) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    if (warningAccepted !== true || !Number.isInteger(Number(warningVersion))) {
      return NextResponse.json({ error: 'Bạn cần đọc và xác nhận cảnh báo dành cho nhà bán hàng.' }, { status: 400 })
    }
    const { data: activeWarning, error: warningError } = await supabase
      .from('VendorRegistrationWarning')
      .select('title, content, version')
      .eq('id', 1)
      .single()
    if (warningError || !activeWarning || activeWarning.version !== Number(warningVersion)) {
      return NextResponse.json({ error: 'Nội dung cảnh báo đã được cập nhật. Vui lòng đọc và xác nhận lại.' }, { status: 409 })
    }
    const documentTypes = (Array.isArray(businessDocuments) ? businessDocuments : []).map((document: { documentType?: string; url?: string }) => document.url ? String(document.documentType || '') : '')
    if (!documentTypes.some((type: string) => /giấy phép kinh doanh|gpkd/i.test(type))) {
      return NextResponse.json({ error: 'Cần tải giấy phép kinh doanh của cửa hàng.' }, { status: 400 })
    }
    if (!documentTypes.some((type: string) => /tài khoản|ngân hàng|bank|chính chủ|sao kê/i.test(type))) {
      return NextResponse.json({ error: 'Cần tải giấy tờ chứng minh tài khoản ngân hàng công ty chính chủ.' }, { status: 400 })
    }
    if (regulatedBusiness === true && !documentTypes.some((type: string) => /giấy phép|pháp lý|đăng ký kinh doanh|chứng nhận/i.test(type))) {
      return NextResponse.json({ error: 'Ngành nghề có điều kiện cần giấy phép/chứng nhận pháp lý chuyên ngành.' }, { status: 400 })
    }

    let user: any
    let createdUser = false
    if (auth) {
      if (auth.role !== 'customer' && auth.role !== 'vendor') return NextResponse.json({ error: 'Tài khoản này không thể đăng ký làm nhà bán hàng.' }, { status: 403 })
      const { data: account, error: accountError } = await supabase.from('User').select('id, email, name, phone, role, status').eq('id', auth.userId).maybeSingle()
      if (accountError || !account) return NextResponse.json({ error: 'Không tìm thấy tài khoản đang đăng nhập.' }, { status: 401 })
      const { data: previousVendor } = await supabase.from('Vendor').select('id, status').eq('userId', account.id)
        .order('createdAt', { ascending: false }).order('id', { ascending: false }).limit(1).maybeSingle()
      if (account.role === 'customer' && !['active', 'approved'].includes(String(account.status))) {
        return NextResponse.json({ error: 'Tài khoản hiện không đủ điều kiện đăng ký nhà bán hàng.' }, { status: 403 })
      }
      if (account.role === 'vendor' && previousVendor?.status !== 'rejected') {
        return NextResponse.json({ error: 'Tài khoản này đã có hồ sơ nhà bán hàng và không thể đăng ký thêm lúc này.' }, { status: 409 })
      }
      if (account.role === 'customer' && previousVendor) return NextResponse.json({ error: 'Tài khoản đã có hồ sơ nhà bán hàng.' }, { status: 409 })
      user = { ...account, role: 'vendor', status: 'pending_approval' }
      name = account.name
      email = account.email
      phone = account.phone
    } else {
      const { data: existingUser } = await supabase.from('User').select('id').eq('email', email).limit(1)
      if (existingUser?.length) return NextResponse.json({ error: 'Email đã được sử dụng. Hãy đăng nhập để đăng ký shop bằng tài khoản hiện có.' }, { status: 409 })
      const hashedPassword = await bcryptjs.hash(password, 10)
      const { data: newUser, error: userError } = await supabase.from('User').insert({ email, password: hashedPassword, name, phone, role: 'vendor', status: 'pending_approval' }).select('id, email, name, phone, role, status').single()
      if (userError || !newUser) return NextResponse.json({ error: userError?.message || 'Không thể tạo tài khoản.' }, { status: 400 })
      user = newUser
      createdUser = true
    }

    const { data: vendorData, error: vendorError } = await supabase
      .from('Vendor')
      .insert({
        userId: user.id,
        name: shopName,
        slug: `${generateSlug(shopName)}-${Date.now().toString(36)}`,
        description: shopDescription,
        businessAddress,
        taxId,
        businessLicense,
        bankAccount,
        bankName,
        bankCode,
        bankBin,
        bankAccountHolder,
        logo,
        status: 'pending',
        rating: 0,
        products: 0,
        followers: 0,
      })
      .select()

    if (vendorError) {
      console.error('Vendor insert error:', vendorError)
      if (createdUser) await supabase.from('User').delete().eq('id', user.id)
      
      return NextResponse.json(
        { error: vendorError.message },
        { status: 400 }
      )
    }

    const vendorId = vendorData?.[0]?.id

    const documentsToCreate = businessDocuments.map((document: { name?: string; url?: string; documentType?: string }) => ({
      vendorId,
      documentType: document.documentType?.trim() || 'Hồ sơ đăng ký',
      documentName: document.name || 'Tài liệu đăng ký',
      documentUrl: document.url,
      status: 'pending',
    })).filter((document: { documentUrl?: string }) => Boolean(document.documentUrl))

    const { error: documentsError } = await supabase
      .from('VendorDocument')
      .insert(documentsToCreate)

    if (documentsError) {
      console.error('Vendor documents insert error:', documentsError)
      await supabase.from('Vendor').delete().eq('id', vendorId)
      if (createdUser) await supabase.from('User').delete().eq('id', user.id)
      return NextResponse.json({ error: 'Không thể lưu hồ sơ đăng ký: ' + documentsError.message }, { status: 400 })
    }

    const { error: acceptanceError } = await supabase.from('VendorWarningAcceptance').insert({
      userId: user.id,
      vendorId,
      userName: name,
      email,
      shopName,
      warningVersion: activeWarning.version,
      warningTitle: activeWarning.title,
      warningContent: activeWarning.content,
    })
    if (acceptanceError) {
      console.error('Vendor warning acceptance insert error:', acceptanceError)
      await supabase.from('Vendor').delete().eq('id', vendorId)
      if (createdUser) await supabase.from('User').delete().eq('id', user.id)
      return NextResponse.json({ error: 'Không thể ghi nhận xác nhận cảnh báo. Vui lòng thử lại.' }, { status: 400 })
    }

    if (!createdUser) {
      const { error: accountUpdateError } = await supabase.from('User').update({ role: 'vendor', status: 'pending_approval' }).eq('id', user.id)
      if (accountUpdateError) {
        await supabase.from('Vendor').delete().eq('id', vendorId)
        return NextResponse.json({ error: 'Không thể cập nhật tài khoản để gửi hồ sơ shop.' }, { status: 500 })
      }
    }

    const tokenPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone || '',
      role: user.role,
      status: user.status,
      vendorId,
    }

    const jwtToken = await generateToken(tokenPayload)

    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      status: user.status,
      vendorId,
    }

    const response = NextResponse.json(
      {
        user: userData,
        token: jwtToken,
        message: 'Vendor registration submitted successfully. Please wait for admin approval.',
      },
      { status: 201 }
    )

    response.cookies.set('token', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    })

    response.cookies.set('auth_token', JSON.stringify(userData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Vendor register error:', error)
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    )
  }
}
