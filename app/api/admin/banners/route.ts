import { NextRequest, NextResponse } from 'next/server'

const mockBanners = [
  { id: 1, name: "Banner Tết Nguyên Đán", image: "/placeholder.svg", position: "Homepage", status: "Active", createdAt: "2025-01-01" },
  { id: 2, name: "Banner Flash Sale", image: "/placeholder.svg", position: "Homepage", status: "Active", createdAt: "2025-01-02" },
  { id: 3, name: "Banner Khuyến mãi", image: "/placeholder.svg", position: "Category", status: "Inactive", createdAt: "2025-01-03" },
  { id: 4, name: "Banner Mùa Hè", image: "/placeholder.svg", position: "Homepage", status: "Active", createdAt: "2025-01-04" },
  { id: 5, name: "Banner Black Friday", image: "/placeholder.svg", position: "Homepage", status: "Inactive", createdAt: "2025-01-05" },
  { id: 6, name: "Banner Giáng Sinh", image: "/placeholder.svg", position: "Sidebar", status: "Active", createdAt: "2025-01-06" },
  { id: 7, name: "Banner Sale 50%", image: "/placeholder.svg", position: "Category", status: "Active", createdAt: "2025-01-07" },
  { id: 8, name: "Banner Tay Nguyên", image: "/placeholder.svg", position: "Homepage", status: "Inactive", createdAt: "2025-01-08" },
  { id: 9, name: "Banner Back to School", image: "/placeholder.svg", position: "Category", status: "Active", createdAt: "2025-01-09" },
  { id: 10, name: "Banner Year End Sale", image: "/placeholder.svg", position: "Homepage", status: "Active", createdAt: "2025-01-10" },
  { id: 11, name: "Banner Spring Collection", image: "/placeholder.svg", position: "Sidebar", status: "Inactive", createdAt: "2025-01-11" },
  { id: 12, name: "Banner Winter Deals", image: "/placeholder.svg", position: "Homepage", status: "Active", createdAt: "2025-01-12" },
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    const totalBanners = mockBanners.length
    const paginatedBanners = mockBanners.slice(offset, offset + limit)
    const totalPages = Math.ceil(totalBanners / limit)

    return NextResponse.json({
      data: paginatedBanners,
      pagination: {
        page,
        limit,
        total: totalBanners,
        totalPages
      }
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
