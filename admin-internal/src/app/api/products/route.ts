import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET all products (optionally filtered by businessId)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const businessId = searchParams.get('businessId')

    const where = businessId ? { businessId } : {}

    const products = await prisma.product.findMany({
      where,
      include: {
        business: {
          select: {
            name: true,
          },
        },
      },
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

// POST create a new product
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { businessId, name, description, price, available } = body

    if (!businessId || !name || price === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const product = await prisma.product.create({
      data: {
        businessId,
        name,
        description,
        price: parseFloat(price),
        available: available !== undefined ? available : true,
      },
    })

    // Trigger prompt regeneration
    await prisma.botConfig.update({
      where: { businessId },
      data: { needsRegen: true },
    }).catch(() => {
      // Bot config might not exist yet, ignore error
    })

    return NextResponse.json({ success: true, data: product })
  } catch (error) {
    console.error('[Products POST] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create product' },
      { status: 500 }
    )
  }
}
