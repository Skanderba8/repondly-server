import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'

export async function GET(request: Request) {
  try {
    const authResult = await requireAuth()
    if (authResult instanceof NextResponse) return authResult
    const { businessId } = authResult

    const exceptions = await prisma.scheduleException.findMany({
      where: { businessId },
      orderBy: { startDate: 'asc' },
    })

    return NextResponse.json({ success: true, data: exceptions })
  } catch (error) {
    console.error('[ScheduleExceptions GET] Error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch schedule exceptions' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await requireAuth()
    if (authResult instanceof NextResponse) return authResult
    const { businessId } = authResult

    const body = await request.json()
    const { label, startDate, endDate, closedAllDay, openTime, closeTime, customMessage } = body

    if (!label || !startDate || !endDate) {
      return NextResponse.json({ success: false, error: 'label, startDate, and endDate are required' }, { status: 400 })
    }

    const exception = await prisma.scheduleException.create({
      data: {
        businessId,
        label,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        closedAllDay: closedAllDay || false,
        openTime,
        closeTime,
        customMessage,
      },
    })

    return NextResponse.json({ success: true, data: exception })
  } catch (error) {
    console.error('[ScheduleExceptions POST] Error:', error)
    return NextResponse.json({ success: false, error: 'Failed to create schedule exception' }, { status: 500 })
  }
}
