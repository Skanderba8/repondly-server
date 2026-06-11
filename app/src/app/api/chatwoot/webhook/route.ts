import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { prisma } from '@/lib/prisma'
import { sseBroadcaster } from '@/lib/sse-broadcaster'

function verifyWebhookSignature(body: string, signature: string | null): boolean {
  if (!signature) return false
  const secret = process.env.CHATWOOT_WEBHOOK_SECRET
  if (!secret) return false
  const expected = createHmac('sha256', secret).update(body).digest('hex')
  return `sha256=${expected}` === signature
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get('x-hub-signature-256') ?? req.headers.get('x-chatwoot-webhook-token')

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const event = JSON.parse(rawBody)
  const eventType = event.event
  const accountId = event.account?.id

  if (!accountId) {
    return new NextResponse('Missing account ID', { status: 400 })
  }

  // Resolve business by Chatwoot account ID
  const business = await prisma.business.findFirst({
    where: { chatwootAccountId: Number(accountId) },
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
      senderType: event.sender?.type,
      status: event.conversation?.status,
      unreadCount: event.conversation?.unread_count,
      inboxId: event.conversation?.inbox_id,
      timestamp: event.created_at || Date.now(),
    }

    // Broadcast to all connected clients for this business
    // Map conversation_status_changed -> conversation_updated for SSE naming consistency
    const sseEventName = eventType === 'conversation_status_changed' ? 'conversation_updated' : eventType
    sseBroadcaster.broadcastToBusiness(businessId, sseEventName, data)

    console.log(`[Webhook] Broadcasted ${sseEventName} for business ${businessId}`)
  }

  // Forward to bot service (fire and forget - don't await, don't fail if bot is down)
  fetch(`http://localhost:3001/chatwoot-webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-hub-signature-256': signature ?? '',
    },
    body: rawBody,
  }).catch(() => {}) // intentional: dashboard doesn't depend on bot being up

  return new NextResponse('OK')
}
