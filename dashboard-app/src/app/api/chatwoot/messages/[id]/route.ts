import { NextRequest, NextResponse } from 'next/server'
import { getMessages, sendMessage } from '@/lib/chatwoot'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// ─── Shared: resolve authenticated business credentials ────────────────────────
async function getBusinessCredentials(email: string) {
  return prisma.business.findUnique({
    where: { email },
    select: {
      chatwootAccountId: true,
      chatwootApiToken: true,
    },
  })
}

// ─── GET /api/chatwoot/messages/[id] ──────────────────────────────────────────
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params
    const data = await getMessages(
      business.chatwootAccountId,
      business.chatwootApiToken,
      parseInt(id)
    )

    return NextResponse.json(data)
  } catch (err: any) {
    console.error('[chatwoot/messages GET]', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// ─── POST /api/chatwoot/messages/[id] ─────────────────────────────────────────
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params
    const body = await request.json()
    const { content } = body

    if (!content?.trim()) {
      return NextResponse.json({ error: 'content is required' }, { status: 400 })
    }

    const data = await sendMessage(
      business.chatwootAccountId,
      business.chatwootApiToken,
      parseInt(id),
      content.trim()
    )

    return NextResponse.json(data)
  } catch (err: any) {
    console.error('[chatwoot/messages POST]', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}