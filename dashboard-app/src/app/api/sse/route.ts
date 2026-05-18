import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sseBroadcaster } from '@/lib/sse-broadcaster'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Try AdminUser first, then fallback to Business
  let user = await prisma.adminUser.findUnique({
    where: { id: session.user.id },
  })

  let business
  if (user) {
    // AdminUser - need to get business relation if exists
    // For now, we'll assume admin users don't have business associations in this context
    return new Response('No business found', { status: 404 })
  } else {
    // Try Business model
    business = await prisma.business.findUnique({
      where: { id: session.user.id },
    })
  }

  if (!business?.id || !business.chatwootAccountId) {
    return new Response('No business found', { status: 404 })
  }

  const businessId = String(business.id)
  const stream = new ReadableStream({
    start(controller) {
      // Register this controller
      sseBroadcaster.subscribe(businessId, controller)

      // Send connected ping immediately
      const connectedEvent = `data: ${JSON.stringify({ type: 'connected' })}\n\n`
      controller.enqueue(connectedEvent)

      // Cleanup on disconnect
      req.signal.addEventListener('abort', () => {
        sseBroadcaster.unsubscribe(businessId, controller)
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
