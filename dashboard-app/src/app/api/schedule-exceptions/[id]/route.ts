import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { label, startDate, endDate, closedAllDay, openTime, closeTime, customMessage } = body

    const exception = await prisma.scheduleException.update({
      where: { id },
      data: {
        ...(label !== undefined && { label }),
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
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const exception = await prisma.scheduleException.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[ScheduleExceptions DELETE] Error:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete schedule exception' }, { status: 500 })
  }
}
