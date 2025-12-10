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

    if (!vendorId) {
      return NextResponse.json({ error: 'Vendor ID is required' }, { status: 400 })
    }

    const visibleStatuses = ['draft', 'upcoming', 'active', 'ended']
    const registerableStatuses = ['draft', 'upcoming']

    let campaignQuery = supabase
      .from('Campaign')
      .select('*')
      .in('status', visibleStatuses)
      .order('startDate', { ascending: false })

    const { data: campaigns, error: campaignError } = await campaignQuery

    if (campaignError) {
      return NextResponse.json({ error: campaignError.message }, { status: 400 })
    }

    // Get vendor registrations
    const { data: registrations, error: registrationError } = await supabase
      .from('CampaignVendorRegistration')
      .select('*')
      .eq('vendorId', vendorId)

    if (registrationError) {
      return NextResponse.json({ error: registrationError.message }, { status: 400 })
    }

    // Get approved products for this vendor to determine actual vendor registration status
    const { data: approvedProducts, error: productsError } = await supabase
      .from('CampaignProduct')
      .select('campaignId')
      .eq('vendorId', vendorId)
      .eq('status', 'approved')

    if (productsError) {
      return NextResponse.json({ error: productsError.message }, { status: 400 })
    }

    // Create a map of campaignId -> has approved products
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
      
      // If vendor has approved products, vendor registration is considered approved
      // Otherwise, use the status from vendor registration table
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
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
