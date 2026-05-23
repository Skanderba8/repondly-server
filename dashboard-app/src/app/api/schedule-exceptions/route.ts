import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const businessId = searchParams.get('businessId')

    if (!businessId) {
      return NextResponse.json({ success: false, error: 'businessId is required' }, { status: 400 })
    }

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
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { businessId, label, startDate, endDate, closedAllDay, openTime, closeTime, customMessage } = body

    if (!businessId || !label || !startDate || !endDate) {
      return NextResponse.json({ success: false, error: 'businessId, label, startDate, and endDate are required' }, { status: 400 })
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
