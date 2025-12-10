import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { campaignId, vendorId } = body

    if (!campaignId || !vendorId) {
      return NextResponse.json({ error: 'Campaign ID and Vendor ID are required' }, { status: 400 })
    }

    // Check if campaign exists
    const { data: campaign, error: campaignError } = await supabase
      .from('Campaign')
      .select('*')
      .eq('id', campaignId)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Only allow registration when campaign is in a registerable state
    if (!['draft', 'upcoming'].includes(campaign.status)) {
      return NextResponse.json(
        { error: 'Campaign is not open for vendor registration' },
        { status: 400 }
      )
    }

    // Check if vendor already registered
    const { data: existing } = await supabase
      .from('CampaignVendorRegistration')
      .select('*')
      .eq('campaignId', campaignId)
      .eq('vendorId', vendorId)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Vendor already registered for this campaign' }, { status: 400 })
    }

    // Create registration
    const { data, error } = await supabase
      .from('CampaignVendorRegistration')
      .insert([
        {
          campaignId,
          vendorId,
          status: 'pending',
          registeredAt: new Date().toISOString(),
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
