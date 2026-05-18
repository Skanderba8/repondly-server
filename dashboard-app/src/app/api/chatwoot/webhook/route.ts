import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sseBroadcaster } from '@/lib/sse-broadcaster'

export async function POST(req: NextRequest) {
  const token = req.headers.get('x-chatwoot-webhook-token')
  const secret = process.env.CHATWOOT_WEBHOOK_SECRET

  if (!token || token !== secret) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const event = await req.json()
  const eventType = event.event
  const accountId = event.account?.id

  if (!accountId) {
    return new NextResponse('Missing account ID', { status: 400 })
  }

  // Resolve business by Chatwoot account ID
  const business = await prisma.business.findFirst({
    where: { chatwootAccountId: Number(accountId), active: true },
  })

  if (!business) {
    console.log(`[Webhook] No active business found for account ${accountId}`)
    return new NextResponse('OK')
  }

  const businessId = String(business.id)

  // Handle relevant event types
  if (
    eventType === 'message_created' ||
    eventType === 'conversation_created' ||
    eventType === 'conversation_status_changed'
  ) {
    // Normalize payload
    const data = {
      conversationId: event.conversation?.id,
      messageId: event.id,
      sender: event.sender,
      content: event.content,
      messageType: event.message_type,
      status: event.conversation?.status,
      inboxId: event.conversation?.inbox_id,
      timestamp: event.created_at || Date.now(),
    }

    // Broadcast to all connected clients for this business
    sseBroadcaster.broadcast(businessId, { type: eventType, data })

    console.log(`[Webhook] Broadcasted ${eventType} for business ${businessId}`)
  }

  return new NextResponse('OK')
}
