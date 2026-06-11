import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const logs = await prisma.conversationLog.findMany({
      where: {
        businessId: session.user.id,
        OR: [
          { status: 'HANDED_OVER' },
          { botEnabled: false },
        ],
      },
      select: {
        chatwootConversationId: true,
        status: true,
        botEnabled: true,
      },
    })

    return NextResponse.json({ success: true, data: logs })
  } catch (error) {
    console.error('[ConversationLogs] Error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch conversation logs' }, { status: 500 })
  }
}
