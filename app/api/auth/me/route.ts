import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateToken } from '@/lib/jwt'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const authToken = request.cookies.get('auth_token')?.value
    
    if (!authToken) {
      return NextResponse.json(
        { error: 'No auth token' },
        { status: 401 }
      )
    }

    let user
    try {
      user = JSON.parse(authToken)
    } catch {
      return NextResponse.json(
        { error: 'Invalid auth token' },
        { status: 401 }
      )
    }

    const { data: userData, error } = await supabase
      .from('User')
      .select('id, email, name, phone, role, status')
      .eq('id', user.id)
      .single()

    if (error || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    let vendorId: number | undefined
    const { data: accessGrant } = await supabase.from('AccountAccess').select('scope, vendorId, permissions').eq('userId', userData.id).maybeSingle()

    if (userData.role === 'vendor') {
      if (accessGrant?.scope === 'seller' && accessGrant.vendorId) {
        vendorId = accessGrant.vendorId
      } else {
        const { data: vendorData } = await supabase
          .from('Vendor')
          .select('id')
          .eq('userId', userData.id)
          .order('createdAt', { ascending: false })
          .order('id', { ascending: false })
          .limit(1)
          .maybeSingle()
        vendorId = vendorData?.id
      }
    }

    const updatedUserData = {
      ...userData,
      vendorId,
      permissions: accessGrant?.permissions,
      accountScope: accessGrant?.scope,
    }

    const jwtToken = await generateToken({
      id: userData.id,
      email: userData.email,
      name: userData.name,
      phone: userData.phone || '',
      role: userData.role,
      status: userData.status,
      vendorId,
      permissions: accessGrant?.permissions,
      accountScope: accessGrant?.scope,
    })

    const response = NextResponse.json({
      user: updatedUserData,
    })

    response.cookies.set('token', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    })

    response.cookies.set('auth_token', JSON.stringify(updatedUserData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    })

    return response
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    )
  }
}
