import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const schedule = await prisma.schedule.findUnique({
      where: { id },
      include: {
        business: {
          select: {
            name: true,
          },
        },
      },
    })

    if (!schedule) {
      return NextResponse.json(
        { success: false, error: 'Schedule not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: schedule })
  } catch (error) {
    console.error('[Schedule GET] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch schedule' },
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
    const { dayOfWeek, openTime, closeTime, closed } = body

    const schedule = await prisma.schedule.update({
      where: { id },
      data: {
        ...(dayOfWeek !== undefined && { dayOfWeek: parseInt(dayOfWeek) }),
        ...(openTime !== undefined && { openTime }),
        ...(closeTime !== undefined && { closeTime }),
        ...(closed !== undefined && { closed }),
      },
    })

    return NextResponse.json({ success: true, data: schedule })
  } catch (error) {
    console.error('[Schedule PATCH] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update schedule' },
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
    const schedule = await prisma.schedule.delete({
      where: { id },
    })

    // Trigger prompt regeneration
    await prisma.botConfig.update({
      where: { businessId: schedule.businessId },
      data: { needsRegen: true },
    }).catch(() => {})

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Schedule DELETE] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete schedule' },
      { status: 500 }
    )
  }
}
