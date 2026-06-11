import { NextRequest, NextResponse } from 'next/server'
import { getMessage } from '@/lib/chatwoot'
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
    const { messageId } = body

    if (!messageId) {
      return NextResponse.json({ error: 'messageId is required' }, { status: 400 })
    }

    const message = await getMessage(
      business.chatwootAccountId,
      business.chatwootApiToken,
      parseInt(conversationId),
      messageId
    )

    return NextResponse.json({ status: message.status, error_message: message.error_message })
  } catch (err: any) {
    console.error('[chatwoot/messages/status-check]', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
