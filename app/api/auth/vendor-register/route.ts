import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcryptjs from 'bcryptjs'
import { generateToken } from '@/lib/jwt'
import { generateSlug } from '@/lib/utils'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const {
      email,
      password,
      name,
      phone,
      shopName,
      logo,
      businessDocuments,
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

    if (!email || !password || !name || !shopName || !logo || !businessDocuments || businessDocuments.length === 0) {
      return NextResponse.json(
        { error: 'Email, password, name, shop name, logo, and at least one business document are required' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    const existingUser = await supabase
      .from('User')
      .select('id')
      .eq('email', email)

    console.log('Email check result:', existingUser)

    if (existingUser.data && existingUser.data.length > 0) {
      console.log('Email already exists')
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      )
    }

    const hashedPassword = await bcryptjs.hash(password, 10)

    const { data: newUser, error: userError } = await supabase
      .from('User')
      .insert({
        email,
        password: hashedPassword,
        name,
        phone,
        role: 'vendor',
        status: 'pending_approval',
      })
      .select()

    if (userError) {
      console.error('User insert error:', userError)
      return NextResponse.json(
        { error: userError.message },
        { status: 400 }
      )
    }

    const user = newUser[0]
    console.log('User created:', user.id)

    const { data: vendorData, error: vendorError } = await supabase
      .from('Vendor')
      .insert({
        userId: user.id,
        name: shopName,
        slug: generateSlug(shopName),
        status: 'pending',
        rating: 0,
        products: 0,
        followers: 0,
      })
      .select()

    if (vendorError) {
      console.error('Vendor insert error:', vendorError)
      await supabase
        .from('User')
        .delete()
        .eq('id', user.id)
      
      return NextResponse.json(
        { error: vendorError.message },
        { status: 400 }
      )
    }

    const vendorId = vendorData?.[0]?.id

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
