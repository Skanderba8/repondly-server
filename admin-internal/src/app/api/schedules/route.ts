import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const businessId = searchParams.get('businessId')

    const where = businessId ? { businessId } : {}

    const schedules = await prisma.schedule.findMany({
      where,
      include: {
        business: {
          select: {
            name: true,
          },
        },
      },
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
    const body = await request.json()
    const { businessId, dayOfWeek, openTime, closeTime, closed } = body

    if (!businessId || dayOfWeek === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const schedule = await prisma.schedule.create({
      data: {
        businessId,
        dayOfWeek: parseInt(dayOfWeek),
        openTime,
        closeTime,
        closed: closed !== undefined ? closed : false,
      },
    })

    // Trigger prompt regeneration
    await prisma.botConfig.update({
      where: { businessId },
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
