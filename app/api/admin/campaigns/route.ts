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
    const status = searchParams.get('status')
    const campaignType = searchParams.get('campaignType')
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0

    let query = supabase
      .from('Campaign')
      .select('*, User!createdBy(id, name, email)', { count: 'exact' })

    if (campaignId) {
      query = query.eq('id', campaignId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (campaignType) {
      query = query.eq('campaignType', campaignType)
    }

    const { data, error, count } = await query
      .order('createdAt', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      data,
      pagination: {
        total: count,
        limit,
        offset,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, type, discountValue, startDate, endDate, budget, createdBy, status, campaignType, flashSaleStartTime, flashSaleEndTime } = body

    if (!name || !type || discountValue === undefined || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required fields: name, type, discountValue, startDate, endDate' },
        { status: 400 }
      )
    }

    if (!['percentage', 'fixed'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type. Must be "percentage" or "fixed"' }, { status: 400 })
    }

    if (campaignType && !['regular', 'flash_sale'].includes(campaignType)) {
      return NextResponse.json({ error: 'Invalid campaignType. Must be "regular" or "flash_sale"' }, { status: 400 })
    }

    if (campaignType === 'flash_sale' && (!flashSaleStartTime || !flashSaleEndTime)) {
      return NextResponse.json(
        { error: 'Flash sale requires flashSaleStartTime and flashSaleEndTime' },
        { status: 400 }
      )
    }

    if (type === 'percentage' && (discountValue < 0 || discountValue > 100)) {
      return NextResponse.json({ error: 'Discount percentage must be between 0 and 100' }, { status: 400 })
    }

    const startDateObj = new Date(startDate)
    const endDateObj = new Date(endDate)

    if (startDateObj >= endDateObj) {
      return NextResponse.json({ error: 'Start date must be before end date' }, { status: 400 })
    }

    const flashStartTime = campaignType === 'flash_sale' && flashSaleStartTime ? flashSaleStartTime : null
    const flashEndTime = campaignType === 'flash_sale' && flashSaleEndTime ? flashSaleEndTime : null

    const { data, error } = await supabase
      .from('Campaign')
      .insert([
        {
          name,
          description: description || null,
          type,
          discountValue,
          startDate: startDateObj.toISOString(),
          endDate: endDateObj.toISOString(),
          flashSaleStartTime: flashStartTime,
          flashSaleEndTime: flashEndTime,
          budget: budget || null,
          createdBy,
          campaignType: campaignType || 'regular',
          status: status && ['draft', 'upcoming', 'active', 'ended'].includes(status) ? status : 'draft',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ])
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data[0], { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { campaignId, ...updateData } = body

    if (!campaignId) {
      return NextResponse.json({ error: 'Campaign ID is required' }, { status: 400 })
    }

    if (updateData.type && !['percentage', 'fixed'].includes(updateData.type)) {
      return NextResponse.json({ error: 'Invalid type. Must be "percentage" or "fixed"' }, { status: 400 })
    }

    if (updateData.campaignType && !['regular', 'flash_sale'].includes(updateData.campaignType)) {
      return NextResponse.json({ error: 'Invalid campaignType. Must be "regular" or "flash_sale"' }, { status: 400 })
    }

    if (updateData.campaignType === 'flash_sale' && (!updateData.flashSaleStartTime || !updateData.flashSaleEndTime)) {
      return NextResponse.json(
        { error: 'Flash sale requires flashSaleStartTime and flashSaleEndTime' },
        { status: 400 }
      )
    }

    if (updateData.status && !['draft', 'upcoming', 'active', 'ended'].includes(updateData.status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    if (updateData.startDate && updateData.endDate) {
      const startDateObj = new Date(updateData.startDate)
      const endDateObj = new Date(updateData.endDate)
      if (startDateObj >= endDateObj) {
        return NextResponse.json({ error: 'Start date must be before end date' }, { status: 400 })
      }
    }

    updateData.updatedAt = new Date().toISOString()

    if (updateData.flashSaleStartTime === '') updateData.flashSaleStartTime = null
    if (updateData.flashSaleEndTime === '') updateData.flashSaleEndTime = null

    const { data, error } = await supabase
      .from('Campaign')
      .update(updateData)
      .eq('id', campaignId)
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    return NextResponse.json(data[0])
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { campaignId } = body

    if (!campaignId) {
      return NextResponse.json({ error: 'Campaign ID is required' }, { status: 400 })
    }

    const { error } = await supabase.from('Campaign').delete().eq('id', campaignId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ message: 'Campaign deleted successfully' })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
