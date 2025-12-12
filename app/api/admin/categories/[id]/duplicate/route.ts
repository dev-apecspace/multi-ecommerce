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
    const categoryId = parseInt(params.id)

    const { data: originalCategory, error: fetchError } = await supabase
      .from('Category')
      .select('*')
      .eq('id', categoryId)
      .maybeSingle()

    if (fetchError || !originalCategory) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    const newName = `${originalCategory.name} (Copy)`
    const newSlug = generateSlug(newName)

    const { data: newCategory, error: createError } = await supabase
      .from('Category')
      .insert([{
        name: newName,
        slug: newSlug,
        icon: originalCategory.icon,
      }])
      .select()

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 400 })
    }

    const { data: subcategories } = await supabase
      .from('SubCategory')
      .select('*')
      .eq('categoryId', categoryId)

    if (subcategories && subcategories.length > 0) {
      const newSubcategories = subcategories.map((sub: any) => ({
        categoryId: newCategory[0].id,
        name: sub.name,
        slug: sub.slug,
      }))

      await supabase
        .from('SubCategory')
        .insert(newSubcategories)
    }

    return NextResponse.json(newCategory[0], { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
