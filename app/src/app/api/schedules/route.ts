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

    const schedules = await prisma.schedule.findMany({
      where: { businessId: session.user.id },
      orderBy: {
        dayOfWeek: 'asc',
      },
    })

    return NextResponse.json({ success: true, data: schedules })
  } catch (error) {
    console.error('[Schedules GET] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch schedules' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { dayOfWeek, openTime, closeTime, isClosed } = body

    if (dayOfWeek === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const schedule = await prisma.schedule.create({
      data: {
        businessId: session.user.id,
        dayOfWeek: parseInt(dayOfWeek),
        openTime,
        closeTime,
        isClosed: isClosed !== undefined ? isClosed : false,
      },
    })

    return NextResponse.json({ success: true, data: schedule })
  } catch (error) {
    console.error('[Schedules POST] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create schedule' },
      { status: 500 }
    )
  }
}
