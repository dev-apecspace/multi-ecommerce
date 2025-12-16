import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vendorId = searchParams.get('vendorId')
    const type = searchParams.get('type') // 'available', 'registered', 'all'
    const campaignType = searchParams.get('campaignType') // 'regular', 'flash_sale', or null for all
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0

    if (!vendorId) {
      return NextResponse.json({ error: 'Vendor ID is required' }, { status: 400 })
    }

    const visibleStatuses = ['draft', 'upcoming', 'active', 'ended']
    const registerableStatuses = ['draft', 'upcoming']

    let campaignQuery = supabase
      .from('Campaign')
      .select('*', { count: 'exact' })
      .in('status', visibleStatuses)

    if (campaignType && ['regular', 'flash_sale'].includes(campaignType)) {
      campaignQuery = campaignQuery.eq('campaignType', campaignType)
    }

    campaignQuery = campaignQuery.order('startDate', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: campaigns, error: campaignError, count } = await campaignQuery

    if (campaignError) {
      return NextResponse.json({ error: campaignError.message }, { status: 400 })
    }

    const { data: registrations, error: registrationError } = await supabase
      .from('CampaignVendorRegistration')
      .select('*')
      .eq('vendorId', vendorId)

    if (registrationError) {
      return NextResponse.json({ error: registrationError.message }, { status: 400 })
    }

    const { data: approvedProducts, error: productsError } = await supabase
      .from('CampaignProduct')
      .select('campaignId')
      .eq('vendorId', vendorId)
      .eq('status', 'approved')

    if (productsError) {
      return NextResponse.json({ error: productsError.message }, { status: 400 })
    }

    const campaignsWithApprovedProducts = new Set(
      approvedProducts?.map((p) => p.campaignId) || []
    )

    const registeredCampaignIds = new Set(registrations?.map((r) => r.campaignId) || [])

    let filteredCampaigns: any[] = []

    if (type === 'available') {
      filteredCampaigns = campaigns?.filter(
        (c) => !registeredCampaignIds.has(c.id) && registerableStatuses.includes(c.status)
      ) || []
    } else if (type === 'registered') {
      filteredCampaigns = campaigns?.filter((c) => registeredCampaignIds.has(c.id)) || []
    } else {
      filteredCampaigns = campaigns || []
    }

    const campaignsWithStatus = filteredCampaigns.map((campaign) => {
      const vendorRegistration = registrations?.find((r) => r.campaignId === campaign.id)
      const hasApprovedProducts = campaignsWithApprovedProducts.has(campaign.id)
      
      let registrationStatus = vendorRegistration?.status || null
      if (hasApprovedProducts && registrationStatus !== 'rejected') {
        registrationStatus = 'approved'
      }

      return {
        ...campaign,
        registrationStatus,
        isRegistered: registeredCampaignIds.has(campaign.id),
        canRegister: registerableStatuses.includes(campaign.status),
      }
    })

    return NextResponse.json({
      campaigns: campaignsWithStatus,
      registrations,
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
