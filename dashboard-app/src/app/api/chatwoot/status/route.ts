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

    // 1. Fetch BOTH the ID and the Token
    const business = await prisma.business.findUnique({
      where: { email: session.user.email },
      select: { 
        chatwootAccountId: true,
        chatwootApiToken: true // <-- ADDED THIS
      }
    })

    if (!business?.chatwootAccountId || !business?.chatwootApiToken) {
      return NextResponse.json({ error: 'Chatwoot not connected' }, { status: 403 })
    }

    const { conversationId, status } = await req.json()
    if (!conversationId || !status) {
      return NextResponse.json({ error: 'conversationId and status required' }, { status: 400 })
    }

    // 2. Pass BOTH the Account ID and the Token to updateConversationStatus
    const data = await updateConversationStatus(
      business.chatwootAccountId, 
      business.chatwootApiToken, // <-- ADDED THIS
      conversationId, 
      status
    )
    
    return NextResponse.json(data)
  } catch (err: any) {
    console.error('[chatwoot/status]', err.message)
    return NextResponse.json({ error: err.message }, { status: 502 })
  }
}