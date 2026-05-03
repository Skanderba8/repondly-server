// app/api/chatwoot/messages/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getMessages, sendMessage } from '@/lib/chatwoot'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params
    // Pass the dynamic accountId as the first argument!
    const data = await getMessages(business.chatwootAccountId, parseInt(id))
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

    const { id } = await params
    const { content } = await req.json()
    
    if (!content?.trim()) {
      return NextResponse.json({ error: 'content required' }, { status: 400 })
    }

    // Pass the dynamic accountId as the first argument!
    const msg = await sendMessage(business.chatwootAccountId, parseInt(id), content)
    return NextResponse.json(msg)
  } catch (err: any) {
    console.error('[chatwoot/messages POST]', err.message)
    return NextResponse.json({ error: err.message }, { status: 502 })
  }
}