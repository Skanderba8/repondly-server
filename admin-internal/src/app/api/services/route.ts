import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const businessId = searchParams.get('businessId')

    const where = businessId ? { businessId } : {}

    const services = await prisma.service.findMany({
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
    const body = await request.json()
    const { businessId, name, description, durationMinutes, price, available } = body

    if (!businessId || !name || durationMinutes === undefined || price === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const service = await prisma.service.create({
      data: {
        businessId,
        name,
        description,
        durationMinutes: parseInt(durationMinutes),
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

    return NextResponse.json({ success: true, data: service })
  } catch (error) {
    console.error('[Services POST] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create service' },
      { status: 500 }
    )
  }
}
