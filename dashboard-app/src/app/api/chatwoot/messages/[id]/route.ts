// app/api/chatwoot/messages/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getMessages, sendMessage } from '@/lib/chatwoot'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await getMessages(parseInt(id))
    return NextResponse.json(data)
  } catch (err: any) {
    console.error('[chatwoot/messages GET]', err.message)
    return NextResponse.json({ error: err.message }, { status: 502 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { content } = await req.json()
    if (!content?.trim()) {
      return NextResponse.json({ error: 'content required' }, { status: 400 })
    }
    const msg = await sendMessage(parseInt(id), content)
    return NextResponse.json(msg)
  } catch (err: any) {
    console.error('[chatwoot/messages POST]', err.message)
    return NextResponse.json({ error: err.message }, { status: 502 })
  }
}