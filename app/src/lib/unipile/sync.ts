import { prisma } from '@/lib/prisma'
import { incrementMonthlyUsage } from '@/lib/subscription'
import { unipile, type UnipileAttendee, type UnipileChat, type UnipileMessage } from '@/lib/unipile/client'

type ChannelKey = 'WHATSAPP' | 'INSTAGRAM'
type MessageType = 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT'

function deriveChannel(accountType?: string | null): ChannelKey {
  return accountType === 'INSTAGRAM' ? 'INSTAGRAM' : 'WHATSAPP'
}

function deriveExternalId(attendee: UnipileAttendee) {
  return attendee.provider_id || attendee.id
}

function deriveContactFields(channel: ChannelKey, attendee: UnipileAttendee) {
  const providerId = attendee.provider_id ?? ''

  return {
    name: attendee.name,
    username: channel === 'INSTAGRAM' ? providerId.replace(/^@/, '') || null : null,
    phone: channel === 'WHATSAPP' ? providerId || null : null,
    avatarUrl: attendee.avatar_url,
  }
}

function deriveMessageType(message: UnipileMessage): MessageType {
  const type = message.attachments[0]?.type?.toLowerCase()

  if (!type) return 'TEXT'
  if (type.includes('video')) return 'VIDEO'
  if (type.includes('audio')) return 'AUDIO'
  if (type.includes('document') || type.includes('file')) return 'DOCUMENT'
  return 'IMAGE'
}

function deriveMessageContent(message: UnipileMessage) {
  if (message.text?.trim()) {
    return message.text.trim()
  }

  return message.attachments.length > 0 ? '[media]' : ''
}

async function upsertConversation(
  businessId: string,
  connectionId: string,
  channel: ChannelKey,
  chat: UnipileChat,
  attendee: UnipileAttendee,
) {
  const externalId = deriveExternalId(attendee)
  const existingContact = await prisma.contact.findUnique({
    where: {
      businessId_channel_externalId: {
        businessId,
        channel,
        externalId,
      },
    },
    select: { id: true },
  })

  const contact = existingContact
    ? await prisma.contact.update({
        where: { id: existingContact.id },
        data: {
          connectionId,
          ...deriveContactFields(channel, attendee),
        },
      })
    : await prisma.contact.create({
        data: {
          businessId,
          connectionId,
          channel,
          externalId,
          ...deriveContactFields(channel, attendee),
        },
      })

  const existingConversation = await prisma.conversation.findFirst({
    where: {
      businessId,
      connectionId,
      contactId: contact.id,
      externalThreadId: chat.id,
    },
    select: { id: true },
  })

  if (existingConversation) {
    return prisma.conversation.update({
      where: { id: existingConversation.id },
      data: {
        unreadCount: chat.unread_count,
        lastMessageAt: chat.last_message_at ? new Date(chat.last_message_at) : undefined,
      },
    })
  }

  await prisma.contact.update({
    where: { id: contact.id },
    data: {
      totalConversations: {
        increment: 1,
      },
    },
  })

  const conversation = await prisma.conversation.create({
    data: {
      businessId,
      connectionId,
      channel,
      contactId: contact.id,
      externalThreadId: chat.id,
      unreadCount: chat.unread_count,
      lastMessageAt: chat.last_message_at ? new Date(chat.last_message_at) : null,
    },
  })

  await incrementMonthlyUsage(businessId, 'conversations')

  return conversation
}

export async function syncAccountChats(businessId: string, connectionId: string, unipileAccountId: string) {
  const connection = await prisma.businessChannelConnection.findUnique({
    where: { id: connectionId },
    select: {
      unipileAccountType: true,
    },
  })

  const channel = deriveChannel(connection?.unipileAccountType)
  const chats: UnipileChat[] = []
  let cursor: string | undefined

  while (chats.length < 200) {
    const page = await unipile.listChats(unipileAccountId, { limit: 100, cursor })

    if (page.length === 0) {
      break
    }

    chats.push(...page)

    if (page.length < 100) {
      break
    }

    cursor = page[page.length - 1]?.id
  }

  let contactsCreated = 0

  for (const chat of chats) {
    const primaryAttendee = chat.attendees[0]

    if (!primaryAttendee?.id) {
      continue
    }

    const attendee = await unipile.getAttendee(unipileAccountId, primaryAttendee.id)
    const existingContact = await prisma.contact.findUnique({
      where: {
        businessId_channel_externalId: {
          businessId,
          channel,
          externalId: deriveExternalId(attendee),
        },
      },
      select: { id: true },
    })

    await upsertConversation(businessId, connectionId, channel, chat, attendee)

    if (!existingContact) {
      contactsCreated += 1
    }
  }

  const recentChats = [...chats]
    .sort((left, right) => {
      const leftValue = left.last_message_at ? new Date(left.last_message_at).getTime() : 0
      const rightValue = right.last_message_at ? new Date(right.last_message_at).getTime() : 0
      return rightValue - leftValue
    })
    .slice(0, 20)

  for (const chat of recentChats) {
    const conversation = await prisma.conversation.findFirst({
      where: {
        businessId,
        connectionId,
        externalThreadId: chat.id,
      },
      select: { id: true },
    })

    if (!conversation) {
      continue
    }

    const messages = await unipile.listMessages(unipileAccountId, chat.id, { limit: 10 })

    for (const message of messages) {
      if (!message.id) {
        continue
      }

      await prisma.message.upsert({
        where: {
          channel_externalMessageId: {
            channel,
            externalMessageId: message.id,
          },
        },
        update: {
          direction: message.is_sender ? 'OUTBOUND' : 'INBOUND',
          senderType: message.is_sender ? 'AGENT' : 'CUSTOMER',
          type: deriveMessageType(message),
          content: deriveMessageContent(message),
          mediaUrl: message.attachments[0]?.url ?? null,
          mediaType: message.attachments[0]?.type ?? null,
          rawPayload: message,
          status: 'SENT',
        },
        create: {
          businessId,
          connectionId,
          channel,
          conversationId: conversation.id,
          direction: message.is_sender ? 'OUTBOUND' : 'INBOUND',
          senderType: message.is_sender ? 'AGENT' : 'CUSTOMER',
          type: deriveMessageType(message),
          content: deriveMessageContent(message),
          mediaUrl: message.attachments[0]?.url ?? null,
          mediaType: message.attachments[0]?.type ?? null,
          externalMessageId: message.id,
          rawPayload: message,
          status: 'SENT',
          createdAt: new Date(message.created_at),
        },
      })
    }
  }

  await prisma.businessChannelConnection.update({
    where: { id: connectionId },
    data: {
      lastSyncedAt: new Date(),
    },
  })

  return {
    chatsProcessed: chats.length,
    contactsCreated,
  }
}
