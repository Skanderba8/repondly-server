// app/api/chatwoot/status/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { updateConversationStatus } from '@/lib/chatwoot'

export async function POST(req: NextRequest) {
  try {
    const { conversationId, status } = await req.json()
    if (!conversationId || !status) {
      return NextResponse.json({ error: 'conversationId and status required' }, { status: 400 })
    }
    const data = await updateConversationStatus(conversationId, status)
    return NextResponse.json(data)
  } catch (err: any) {
    console.error('[chatwoot/status]', err.message)
    return NextResponse.json({ error: err.message }, { status: 502 })
  }
}