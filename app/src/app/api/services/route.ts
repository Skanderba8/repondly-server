import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'

export async function GET(request: Request) {
  try {
    const authResult = await requireAuth()
    if (authResult instanceof NextResponse) return authResult
    const { businessId } = authResult

    const services = await prisma.service.findMany({
      where: { businessId },
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
    const authResult = await requireAuth()
    if (authResult instanceof NextResponse) return authResult
    const { businessId } = authResult

    const body = await request.json()
    const { name, description, duration, price, isActive } = body

    if (!name || duration === undefined || price === undefined) {
      return NextResponse.json({ success: false, error: 'name, duration, and price are required' }, { status: 400 })
    }

    const service = await prisma.service.create({
      data: {
        businessId,
        name,
        description,
        duration,
        price,
        isActive: isActive !== undefined ? isActive : true,
      },
    })

    return NextResponse.json({ success: true, data: service })
  } catch (error) {
    console.error('[Services POST] Error:', error)
    return NextResponse.json({ success: false, error: 'Failed to create service' }, { status: 500 })
  }
}
