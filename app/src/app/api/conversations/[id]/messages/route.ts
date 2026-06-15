import { NextResponse } from 'next/server'
import { requireBusinessApiSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { unipile } from '@/lib/unipile/client'

type CreateMessageBody = {
  content?: string
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response, session } = await requireBusinessApiSession()

  if (response || !session) {
    return response
  }

  const { id } = await params
  const body = (await request.json()) as CreateMessageBody
  const content = body.content?.trim() ?? ''

  if (!content) {
    return NextResponse.json({ success: false, error: 'Message vide.' }, { status: 400 })
  }

  const conversation = await prisma.conversation.findFirst({
    where: {
      id,
      businessId: session.user.id,
    },
    select: {
      id: true,
      businessId: true,
      connectionId: true,
      channel: true,
      externalThreadId: true,
    },
  })

  if (!conversation) {
    return NextResponse.json({ success: false, error: 'Conversation introuvable.' }, { status: 404 })
  }

  const now = new Date()
  const message = await prisma.message.create({
    data: {
      businessId: conversation.businessId,
      connectionId: conversation.connectionId,
      channel: conversation.channel,
      conversationId: conversation.id,
      direction: 'OUTBOUND',
      senderType: 'AGENT',
      status: 'SENT',
      type: 'TEXT',
      content,
    },
  })

  await prisma.conversation.update({
    where: { id: conversation.id },
    data: {
      lastMessageAt: now,
      lastOutboundMessageAt: now,
    },
  })

  const connection = await prisma.businessChannelConnection.findUnique({
    where: { id: conversation.connectionId },
    select: {
      unipileAccountId: true,
    },
  })

  if (connection?.unipileAccountId && conversation.externalThreadId) {
    await unipile
      .sendMessage(connection.unipileAccountId, conversation.externalThreadId, content)
      .catch((error: unknown) => console.error('Unipile send failed:', error))
  }

  return NextResponse.json({ success: true, data: { message } })
}
