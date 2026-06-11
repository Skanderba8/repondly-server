import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth()
    if (authResult instanceof NextResponse) return authResult
    const { businessId } = authResult

    const { id } = await params
    const body = await request.json()
    const { label, type, startDate, endDate, closedAllDay, openTime, closeTime, customMessage } = body

    const existing = await prisma.scheduleException.findUnique({
      where: { id },
    })

    if (!existing || existing.businessId !== businessId) {
      return NextResponse.json(
        { success: false, error: 'Schedule exception not found or unauthorized' },
        { status: 404 }
      )
    }

    const exception = await prisma.scheduleException.update({
      where: { id },
      data: {
        ...(label !== undefined && { label }),
        ...(type !== undefined && { type }),
        ...(startDate !== undefined && { startDate: new Date(startDate) }),
        ...(endDate !== undefined && { endDate: new Date(endDate) }),
        ...(closedAllDay !== undefined && { closedAllDay }),
        ...(openTime !== undefined && { openTime }),
        ...(closeTime !== undefined && { closeTime }),
        ...(customMessage !== undefined && { customMessage }),
      },
    })

    return NextResponse.json({ success: true, data: exception })
  } catch (error) {
    console.error('[ScheduleExceptions PATCH] Error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update schedule exception' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth()
    if (authResult instanceof NextResponse) return authResult
    const { businessId } = authResult

    const { id } = await params

    const existing = await prisma.scheduleException.findUnique({
      where: { id },
    })

    if (!existing || existing.businessId !== businessId) {
      return NextResponse.json(
        { success: false, error: 'Schedule exception not found or unauthorized' },
        { status: 404 }
      )
    }

    await prisma.scheduleException.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[ScheduleExceptions DELETE] Error:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete schedule exception' }, { status: 500 })
  }
}
