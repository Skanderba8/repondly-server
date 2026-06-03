import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { getConversations } from '@/lib/chatwoot'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const businessId = session.user.id

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { chatwootAccountId: true, chatwootApiToken: true },
    })

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const tomorrowStart = new Date(todayStart)
    tomorrowStart.setDate(tomorrowStart.getDate() + 1)
    const yesterdayStart = new Date(todayStart)
    yesterdayStart.setDate(yesterdayStart.getDate() - 1)

    // Messages received today (true message count via MessageLog)
    const messagesReceived = await prisma.messageLog.count({
      where: {
        businessId,
        senderType: 'contact',
        createdAt: { gte: todayStart, lt: tomorrowStart },
      },
    })

    // Messages received yesterday (for trend)
    const messagesReceivedYesterday = await prisma.messageLog.count({
      where: {
        businessId,
        senderType: 'contact',
        createdAt: { gte: yesterdayStart, lt: todayStart },
      },
    })
    const messagesTrend = messagesReceivedYesterday > 0
      ? Math.round(((messagesReceived - messagesReceivedYesterday) / messagesReceivedYesterday) * 100)
      : 0

    // Bot replies today
    const botHandled = await prisma.messageLog.count({
      where: {
        businessId,
        senderType: 'bot',
        createdAt: { gte: todayStart, lt: tomorrowStart },
      },
    })

    const botRate = messagesReceived > 0 ? Math.round((botHandled / messagesReceived) * 100) : 0

    // Pending human: handed over OR bot disabled (all current open)
    const pendingHuman = await prisma.conversationLog.count({
      where: {
        businessId,
        status: { in: ['ACTIVE', 'HANDED_OVER'] },
        OR: [
          { status: 'HANDED_OVER' },
          { botEnabled: false },
        ],
      },
    })

    // Appointments today
    const appointmentsToday = await prisma.booking.count({
      where: {
        businessId,
        datetime: { gte: todayStart, lt: tomorrowStart },
        status: { not: 'CANCELLED' },
      },
    })

    // Appointments yesterday (for trend)
    const appointmentsYesterday = await prisma.booking.count({
      where: {
        businessId,
        datetime: { gte: yesterdayStart, lt: todayStart },
        status: { not: 'CANCELLED' },
      },
    })
    const appointmentsTrend = appointmentsYesterday > 0
      ? Math.round(((appointmentsToday - appointmentsYesterday) / appointmentsYesterday) * 100)
      : 0

    // Unread count from Chatwoot
    let unreadCount = 0
    if (business?.chatwootAccountId && business?.chatwootApiToken) {
      try {
        const data = await getConversations(business.chatwootAccountId, business.chatwootApiToken, { status: 'open' })
        const convs = data.data?.payload || []
        unreadCount = convs.reduce((sum: number, c: { unread_count?: number }) => sum + (c.unread_count || 0), 0)
      } catch (err) {
        console.error('[Stats Today] Chatwoot unread fetch failed:', (err as Error).message)
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        messagesReceived,
        messagesTrend,
        botHandled,
        botRate,
        pendingHuman,
        appointmentsToday,
        appointmentsTrend,
        unreadCount,
      },
    })
  } catch (error) {
    console.error('[Stats Today] Error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch today stats' }, { status: 500 })
  }
}
