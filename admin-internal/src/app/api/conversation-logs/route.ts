import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const businessId = searchParams.get('businessId')

    const where = businessId ? { businessId } : {}

    const logs = await prisma.conversationLog.findMany({
      where,
      include: {
        business: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
    })

    return NextResponse.json({ success: true, data: logs })
  } catch (error) {
    console.error('[ConversationLogs GET] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch conversation logs' },
      { status: 500 }
    )
  }
}
