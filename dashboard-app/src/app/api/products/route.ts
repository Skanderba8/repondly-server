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
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, description, price, available } = body

    if (!name || price === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const product = await prisma.product.create({
      data: {
        businessId: session.user.id,
        name,
        description,
        price: parseFloat(price),
        available: available !== undefined ? available : true,
      },
    })

    // Trigger prompt regeneration
    await prisma.botConfig.update({
      where: { businessId: session.user.id },
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
