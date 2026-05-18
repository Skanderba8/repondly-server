import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { dayOfWeek, openTime, closeTime, closed } = body

    const existing = await prisma.schedule.findUnique({
      where: { id },
    })

    if (!existing || existing.businessId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Schedule not found or unauthorized' },
        { status: 404 }
      )
    }

    const schedule = await prisma.schedule.update({
      where: { id },
      data: {
        ...(dayOfWeek !== undefined && { dayOfWeek: parseInt(dayOfWeek) }),
        ...(openTime !== undefined && { openTime }),
        ...(closeTime !== undefined && { closeTime }),
        ...(closed !== undefined && { closed }),
      },
    })

    await prisma.botConfig.update({
      where: { businessId: session.user.id },
      data: { needsRegen: true },
    }).catch(() => {})

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
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const existing = await prisma.schedule.findUnique({
      where: { id },
    })

    if (!existing || existing.businessId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Schedule not found or unauthorized' },
        { status: 404 }
      )
    }

    await prisma.schedule.delete({
      where: { id },
    })

    await prisma.botConfig.update({
      where: { businessId: session.user.id },
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
