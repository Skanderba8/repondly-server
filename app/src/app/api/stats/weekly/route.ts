import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const businessId = session.user.id

    // Build 7-day range
    const days: { date: string; count: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      d.setHours(0, 0, 0, 0)
      const next = new Date(d)
      next.setDate(next.getDate() + 1)

      const count = await prisma.messageLog.count({
        where: {
          businessId,
          senderType: 'contact',
          createdAt: { gte: d, lt: next },
        },
      })

      days.push({
        date: d.toISOString().split('T')[0],
        count,
      })
    }

    return NextResponse.json({ success: true, data: days })
  } catch (error) {
    console.error('[Stats Weekly] Error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch weekly stats' }, { status: 500 })
  }
}
