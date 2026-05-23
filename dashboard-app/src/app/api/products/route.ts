import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const products = await prisma.product.findMany({
      where: { businessId: session.user.id },
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
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { businessId, name, description, price, available, outOfStock, deliveryFee, visible } = body

    if (!businessId || !name || price === undefined) {
      return NextResponse.json({ success: false, error: 'businessId, name, and price are required' }, { status: 400 })
    }

    const product = await prisma.product.create({
      data: {
        businessId,
        name,
        description,
        price,
        available: available !== undefined ? available : true,
        outOfStock: outOfStock || false,
        deliveryFee,
        visible: visible !== undefined ? visible : true,
      },
    })

    return NextResponse.json({ success: true, data: product })
  } catch (error) {
    console.error('[Products POST] Error:', error)
    return NextResponse.json({ success: false, error: 'Failed to create product' }, { status: 500 })
  }
}
