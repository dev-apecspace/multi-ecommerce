import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { generateSlug } from '@/lib/utils'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const subcategoryId = parseInt(params.id)

    const { data: originalSubcategory, error: fetchError } = await supabase
      .from('SubCategory')
      .select('*')
      .eq('id', subcategoryId)
      .maybeSingle()

    if (fetchError || !originalSubcategory) {
      return NextResponse.json({ error: 'Subcategory not found' }, { status: 404 })
    }

    const newName = `${originalSubcategory.name} (Copy)`
    const newSlug = generateSlug(newName)

    const { data: newSubcategory, error: createError } = await supabase
      .from('SubCategory')
      .insert([{
        name: newName,
        slug: newSlug,
        categoryId: originalSubcategory.categoryId,
      }])
      .select()

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 400 })
    }

    return NextResponse.json(newSubcategory[0], { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
