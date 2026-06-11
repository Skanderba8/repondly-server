import { NextRequest, NextResponse } from 'next/server'
import { getConversationNotes, createConversationNote } from '@/lib/chatwoot'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function getBusinessCredentials(email: string) {
  return prisma.business.findUnique({
    where: { email },
    select: {
      chatwootAccountId: true,
      chatwootApiToken: true,
    },
  })
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const business = await getBusinessCredentials(session.user.email)

    if (!business?.chatwootAccountId || !business?.chatwootApiToken) {
      return NextResponse.json({ error: 'Chatwoot not connected' }, { status: 403 })
    }

    const { conversationId } = await params
    const data = await getConversationNotes(
      business.chatwootAccountId,
      business.chatwootApiToken,
      parseInt(conversationId)
    )

    return NextResponse.json(data)
  } catch (err: any) {
    console.error('[chatwoot/notes GET]', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const business = await getBusinessCredentials(session.user.email)

    if (!business?.chatwootAccountId || !business?.chatwootApiToken) {
      return NextResponse.json({ error: 'Chatwoot not connected' }, { status: 403 })
    }

    const { conversationId } = await params
    const body = await request.json()
    const { content } = body

    if (!content?.trim()) {
      return NextResponse.json({ error: 'content is required' }, { status: 400 })
    }

    const data = await createConversationNote(
      business.chatwootAccountId,
      business.chatwootApiToken,
      parseInt(conversationId),
      content.trim()
    )

    return NextResponse.json(data)
  } catch (err: any) {
    console.error('[chatwoot/notes POST]', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
