import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const service = await prisma.service.findUnique({
      where: { id },
      include: {
        business: {
          select: {
            name: true,
          },
        },
      },
    })

    if (!service) {
      return NextResponse.json(
        { success: false, error: 'Service not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: service })
  } catch (error) {
    console.error('[Service GET] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch service' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, description, durationMinutes, price, available } = body

    const service = await prisma.service.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(durationMinutes !== undefined && { durationMinutes: parseInt(durationMinutes) }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(available !== undefined && { available }),
      },
    })

    return NextResponse.json({ success: true, data: service })
  } catch (error) {
    console.error('[Service PATCH] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update service' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const service = await prisma.service.delete({
      where: { id },
    })

    // Trigger prompt regeneration
    await prisma.botConfig.update({
      where: { businessId: service.businessId },
      data: { needsRegen: true },
    }).catch(() => {})

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Service DELETE] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete service' },
      { status: 500 }
    )
  }
}
