// app/api/chatwoot/status/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { updateConversationStatus } from '@/lib/chatwoot'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const business = await prisma.business.findUnique({
      where: { email: session.user.email },
      select: { chatwootAccountId: true }
    })

    if (!business?.chatwootAccountId) {
      return NextResponse.json({ error: 'No Chatwoot account linked' }, { status: 400 })
    }

    const { conversationId, status } = await req.json()
    if (!conversationId || !status) {
      return NextResponse.json({ error: 'conversationId and status required' }, { status: 400 })
    }

    // Pass the dynamic accountId as the first argument!
    const data = await updateConversationStatus(business.chatwootAccountId, conversationId, status)
    return NextResponse.json(data)
  } catch (err: any) {
    console.error('[chatwoot/status]', err.message)
    return NextResponse.json({ error: err.message }, { status: 502 })
  }
}