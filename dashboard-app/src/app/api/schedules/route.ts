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
    const { dayOfWeek, openTime, closeTime, closed } = body

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
        closed: closed !== undefined ? closed : false,
      },
    })

    // Trigger prompt regeneration
    await prisma.botConfig.update({
      where: { businessId: session.user.id },
      data: { needsRegen: true },
    }).catch(() => {
      // Bot config might not exist yet, ignore error
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
