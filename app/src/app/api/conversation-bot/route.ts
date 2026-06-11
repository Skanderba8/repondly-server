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

    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversationId')

    if (!conversationId) {
      return NextResponse.json(
        { success: false, error: 'Missing conversationId' },
        { status: 400 }
      )
    }

    // Find the conversation log for this business and conversation
    const conversationLog = await prisma.conversationLog.findFirst({
      where: {
        businessId: session.user.id,
        chatwootConversationId: parseInt(conversationId),
      },
    })

    if (!conversationLog) {
      return NextResponse.json(
        { success: true, data: { botEnabled: true } },
        { status: 200 }
      )
    }

    return NextResponse.json({ success: true, data: { botEnabled: conversationLog.botEnabled } })
  } catch (error) {
    console.error('[Conversation Bot GET] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch bot status' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { conversationId, botEnabled } = body

    if (!conversationId || typeof botEnabled !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Find the conversation log for this business and conversation
    const conversationLog = await prisma.conversationLog.findFirst({
      where: {
        businessId: session.user.id,
        chatwootConversationId: conversationId,
      },
    })

    if (!conversationLog) {
      return NextResponse.json(
        { success: false, error: 'Conversation log not found' },
        { status: 404 }
      )
    }

    // Update bot enabled status
    const updated = await prisma.conversationLog.update({
      where: { id: conversationLog.id },
      data: { botEnabled },
    })

    return NextResponse.json({ success: true, data: { botEnabled: updated.botEnabled } })
  } catch (error) {
    console.error('[Conversation Bot PATCH] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update bot status' },
      { status: 500 }
    )
  }
}
