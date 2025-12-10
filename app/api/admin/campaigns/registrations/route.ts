import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('campaignId')
    const vendorId = searchParams.get('vendorId')
    const status = searchParams.get('status')
    const type = searchParams.get('type') // 'vendor', 'product'
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0

    if (type === 'vendor' || !type) {
      let query = supabase
        .from('CampaignVendorRegistration')
        .select('*, Campaign(name), Vendor(id, name, userId)', { count: 'exact' })

      if (campaignId) query = query.eq('campaignId', campaignId)
      if (vendorId) query = query.eq('vendorId', vendorId)
      if (status) query = query.eq('status', status)

      const { data, error, count } = await query
        .order('registeredAt', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      return NextResponse.json({
        data,
        type: 'vendor',
        pagination: {
          total: count,
          limit,
          offset,
        },
      })
    }

    if (type === 'product') {
      let query = supabase
        .from('CampaignProduct')
        .select(
          `
          *,
          Campaign(name),
          Vendor(id, name),
          Product(id, name, slug, price),
          ProductVariant(id, name, price)
        `,
          { count: 'exact' }
        )

      if (campaignId) query = query.eq('campaignId', campaignId)
      if (vendorId) query = query.eq('vendorId', vendorId)
      if (status) query = query.eq('status', status)

      const { data, error, count } = await query
        .order('registeredAt', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      return NextResponse.json({
        data,
        type: 'product',
        pagination: {
          total: count,
          limit,
          offset,
        },
      })
    }

    return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { registrationId, status, rejectionReason, type, approvedBy } = body

    if (!registrationId || !status || !type) {
      return NextResponse.json(
        { error: 'Registration ID, Status, and Type are required' },
        { status: 400 }
      )
    }

    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    if (!['vendor', 'product'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    const table = type === 'vendor' ? 'CampaignVendorRegistration' : 'CampaignProduct'

    const updateData: any = {
      status,
      updatedAt: new Date().toISOString(),
    }

    if (status === 'approved') {
      updateData.approvedAt = new Date().toISOString()
      if (approvedBy) {
        updateData.approvedBy = approvedBy
      }
    }

    if (status === 'rejected' && rejectionReason) {
      updateData.rejectionReason = rejectionReason
    }

    const { data, error } = await supabase
      .from(table)
      .update(updateData)
      .eq('id', registrationId)
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 })
    }

    const updated = data[0]

    // If approving a product, also mark vendor registration approved (upsert)
    if (type === 'product' && status === 'approved') {
      const campaignId = updated.campaignId
      const vendorId = updated.vendorId
      if (campaignId && vendorId) {
        // Try update existing vendor registration
        const { error: vendorUpdateError, data: vendorUpdateData } = await supabase
          .from('CampaignVendorRegistration')
          .update({
            status: 'approved',
            approvedAt: new Date().toISOString(),
            approvedBy: approvedBy || null,
            updatedAt: new Date().toISOString(),
          })
          .eq('campaignId', campaignId)
          .eq('vendorId', vendorId)
          .select()

        // If not found, insert a record as approved
        if (!vendorUpdateData || vendorUpdateData.length === 0) {
          const { error: vendorInsertError } = await supabase.from('CampaignVendorRegistration').insert([
            {
              campaignId,
              vendorId,
              status: 'approved',
              registeredAt: new Date().toISOString(),
              approvedAt: new Date().toISOString(),
              approvedBy: approvedBy || null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ])
          if (vendorInsertError) {
            console.error('Failed to upsert vendor registration', vendorInsertError)
          }
        } else if (vendorUpdateError) {
          console.error('Failed to update vendor registration', vendorUpdateError)
        }
      }
    }

    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
