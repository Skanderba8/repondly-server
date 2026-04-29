// app/api/chatwoot/conversations/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getConversations } from '@/lib/chatwoot'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = (searchParams.get('status') as any) || 'open'
    const page   = parseInt(searchParams.get('page') || '1')

    const data = await getConversations({ status, page })
    return NextResponse.json(data)
  } catch (err: any) {
    console.error('[chatwoot/conversations]', err.message)
    return NextResponse.json({ error: err.message }, { status: 502 })
  }
}