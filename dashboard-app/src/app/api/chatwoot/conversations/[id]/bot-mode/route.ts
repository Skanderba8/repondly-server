import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const conversationId = parseInt(id, 10)
    if (isNaN(conversationId)) {
      return NextResponse.json({ success: false, error: 'Invalid conversation ID' }, { status: 400 })
    }

    const body = await request.json()
    const { botEnabled } = body
    if (typeof botEnabled !== 'boolean') {
      return NextResponse.json({ success: false, error: 'botEnabled boolean required' }, { status: 400 })
    }

    // Verify conversation belongs to authenticated business
    const log = await prisma.conversationLog.findFirst({
      where: {
        businessId: session.user.id,
        chatwootConversationId: conversationId,
      },
    })

    if (!log) {
      return NextResponse.json({ success: false, error: 'Conversation not found' }, { status: 404 })
    }

    const updated = await prisma.conversationLog.update({
      where: { id: log.id },
      data: { botEnabled },
    })

    return NextResponse.json({
      success: true,
      data: { botEnabled: updated.botEnabled },
    })
  } catch (error: any) {
    console.error('[bot-mode PATCH] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update bot mode' },
      { status: 500 }
    )
  }
}
