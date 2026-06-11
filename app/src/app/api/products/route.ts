import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'

export async function GET(request: Request) {
  try {
    const authResult = await requireAuth()
    if (authResult instanceof NextResponse) return authResult
    const { businessId } = authResult

    const products = await prisma.product.findMany({
      where: { businessId },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ success: true, data: products })
  } catch (error) {
    console.error('[Products GET] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await requireAuth()
    if (authResult instanceof NextResponse) return authResult
    const { businessId } = authResult

    const body = await request.json()
    const { name, description, price, isActive } = body

    if (!name || price === undefined) {
      return NextResponse.json({ success: false, error: 'name and price are required' }, { status: 400 })
    }

    const product = await prisma.product.create({
      data: {
        businessId,
        name,
        description,
        price,
        isActive: isActive !== undefined ? isActive : true,
      },
    })

    return NextResponse.json({ success: true, data: product })
  } catch (error) {
    console.error('[Products POST] Error:', error)
    return NextResponse.json({ success: false, error: 'Failed to create product' }, { status: 500 })
  }
}
