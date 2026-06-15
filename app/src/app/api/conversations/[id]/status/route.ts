import { NextResponse } from 'next/server'
import type { ConversationStatus } from '@/types'
import { requireBusinessApiSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type UpdateStatusBody = {
  status?: ConversationStatus
}

const validStatuses = new Set<ConversationStatus>([
  'NEW',
  'IN_PROGRESS',
  'CONFIRMED',
  'FOLLOW_UP',
  'RESOLVED',
])

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response, session } = await requireBusinessApiSession()

  if (response || !session) {
    return response
  }

  const { id } = await params
  const body = (await request.json()) as UpdateStatusBody

  if (!body.status || !validStatuses.has(body.status)) {
    return NextResponse.json({ success: false, error: 'Statut invalide.' }, { status: 400 })
  }

  const conversation = await prisma.conversation.findFirst({
    where: {
      id,
      businessId: session.user.id,
    },
    select: { id: true },
  })

  if (!conversation) {
    return NextResponse.json({ success: false, error: 'Conversation introuvable.' }, { status: 404 })
  }

  const updatedConversation = await prisma.conversation.update({
    where: { id: conversation.id },
    data: {
      status: body.status,
      resolvedAt: body.status === 'RESOLVED' ? new Date() : null,
    },
  })

  return NextResponse.json({ success: true, data: { conversation: updatedConversation } })
}
