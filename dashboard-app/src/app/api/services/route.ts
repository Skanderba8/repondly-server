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

    const services = await prisma.service.findMany({
      where: { businessId: session.user.id },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ success: true, data: services })
  } catch (error) {
    console.error('[Services GET] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch services' },
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
    const { businessId, name, description, durationMinutes, price, available, outOfStock, deliveryFee, visible } = body

    if (!businessId || !name || durationMinutes === undefined || price === undefined) {
      return NextResponse.json({ success: false, error: 'businessId, name, durationMinutes, and price are required' }, { status: 400 })
    }

    const service = await prisma.service.create({
      data: {
        businessId,
        name,
        description,
        durationMinutes,
        price,
        available: available !== undefined ? available : true,
        outOfStock: outOfStock || false,
        deliveryFee,
        visible: visible !== undefined ? visible : true,
      },
    })

    return NextResponse.json({ success: true, data: service })
  } catch (error) {
    console.error('[Services POST] Error:', error)
    return NextResponse.json({ success: false, error: 'Failed to create service' }, { status: 500 })
  }
}
