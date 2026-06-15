import { createHmac, timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { syncAccountChats } from '@/lib/unipile/sync'
import { unipile, type UnipileAttendee, type UnipileChat, type UnipileMessage } from '@/lib/unipile/client'

type ChannelKey = 'WHATSAPP' | 'INSTAGRAM'
type ConnectionStatus = 'ACTIVE' | 'DISCONNECTED' | 'ERROR'
type MessageStatus = 'SENT' | 'DELIVERED' | 'READ' | 'FAILED'
type WebhookPayload = {
  type?: string
  account_id?: string
  data?: unknown
  timestamp?: string
}

function normalizeSignature(value: string | null) {
  if (!value) {
    return ''
  }

  return value.replace(/^sha256=/i, '').trim().toLowerCase()
}

function verifySignature(body: string, signature: string | null, secret: string) {
  const expected = normalizeSignature(createHmac('sha256', secret).update(body).digest('hex'))
  const received = normalizeSignature(signature)

  if (!expected || !received || expected.length !== received.length) {
    return false
  }

  return timingSafeEqual(Buffer.from(expected), Buffer.from(received))
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function asString(value: unknown) {
  return typeof value === 'string' ? value : undefined
}

function deriveChannel(value?: string | null): ChannelKey | null {
  if (value === 'WHATSAPP') return 'WHATSAPP'
  if (value === 'INSTAGRAM') return 'INSTAGRAM'
  return null
}

function parseBusinessHint(value?: string) {
  if (!value) {
    return null
  }

  const [businessId, channel] = value.split('__')
  const derivedChannel = deriveChannel(channel)

  if (!businessId || !derivedChannel) {
    return null
  }

  return {
    businessId,
    channel: derivedChannel,
  }
}

function deriveConnectionStatus(type?: string): ConnectionStatus {
  if (type === 'account.error') return 'ERROR'
  if (type === 'account.disconnected') return 'DISCONNECTED'
  return 'ACTIVE'
}

function deriveMessageStatus(value?: string): MessageStatus {
  if (value === 'read') return 'READ'
  if (value === 'delivered') return 'DELIVERED'
  if (value === 'failed' || value === 'error') return 'FAILED'
  return 'SENT'
}

function deriveMessageType(message: UnipileMessage) {
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

async function ensureConnection(accountId: string, businessHint?: { businessId: string; channel: ChannelKey } | null) {
  const account = await unipile.getAccount(accountId)
  const channel = deriveChannel(account.type)

  if (!channel) {
    return null
  }

  const existingByAccount = await prisma.businessChannelConnection.findFirst({
    where: { unipileAccountId: account.id },
    select: {
      id: true,
      businessId: true,
      lastSyncedAt: true,
    },
  })

  if (existingByAccount) {
    const updated = await prisma.businessChannelConnection.update({
      where: { id: existingByAccount.id },
      data: {
        status: 'ACTIVE',
        channel,
        unipileAccountType: account.type,
        displayName: account.name,
        metadata: account,
      },
      select: {
        id: true,
        businessId: true,
        lastSyncedAt: true,
      },
    })

    return { connection: updated, accountType: account.type, accountId: account.id }
  }

  if (!businessHint) {
    return null
  }

  const pendingConnection = await prisma.businessChannelConnection.findFirst({
    where: {
      businessId: businessHint.businessId,
      channel,
    },
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      id: true,
      businessId: true,
      lastSyncedAt: true,
    },
  })

  const connection = pendingConnection
    ? await prisma.businessChannelConnection.update({
        where: { id: pendingConnection.id },
        data: {
          status: 'ACTIVE',
          unipileAccountId: account.id,
          unipileAccountType: account.type,
          displayName: account.name,
          metadata: account,
        },
        select: {
          id: true,
          businessId: true,
          lastSyncedAt: true,
        },
      })
    : await prisma.businessChannelConnection.create({
        data: {
          businessId: businessHint.businessId,
          channel,
          status: 'ACTIVE',
          unipileAccountId: account.id,
          unipileAccountType: account.type,
          displayName: account.name,
          metadata: account,
        },
        select: {
          id: true,
          businessId: true,
          lastSyncedAt: true,
        },
      })

  return { connection, accountType: account.type, accountId: account.id }
}

async function handleAccountEvent(payload: WebhookPayload) {
  const accountId = payload.account_id

  if (!accountId || !payload.type) {
    return { processed: false, error: 'Missing account event identifiers.' }
  }

  const data = isRecord(payload.data) ? payload.data : null
  const nestedAccount = isRecord(data?.account) ? data.account : null
  const businessHint = parseBusinessHint(asString(data?.name) ?? asString(nestedAccount?.name))

  if (payload.type === 'account.connected' || payload.type === 'account.reconnected') {
    const resolved = await ensureConnection(accountId, businessHint)

    if (!resolved) {
      return { processed: false, error: 'Unable to resolve connection for account event.' }
    }

    if (!resolved.connection.lastSyncedAt) {
      await syncAccountChats(resolved.connection.businessId, resolved.connection.id, resolved.accountId)
    }

    return {
      processed: true,
      businessId: resolved.connection.businessId,
      connectionId: resolved.connection.id,
      channel: deriveChannel(resolved.accountType),
    }
  }

  const connection = await prisma.businessChannelConnection.findFirst({
    where: { unipileAccountId: accountId },
    select: {
      id: true,
      businessId: true,
      channel: true,
    },
  })

  if (!connection) {
    return { processed: false, error: 'Connection not found for account update.' }
  }

  await prisma.businessChannelConnection.update({
    where: { id: connection.id },
    data: {
      status: deriveConnectionStatus(payload.type),
      metadata: payload.data ?? null,
    },
  })

  return {
    processed: true,
    businessId: connection.businessId,
    connectionId: connection.id,
    channel: connection.channel === 'WHATSAPP' || connection.channel === 'INSTAGRAM' ? connection.channel : null,
  }
}

async function upsertInboundMessage(
  connection: { id: string; businessId: string; channel: ChannelKey },
  chat: UnipileChat,
  attendee: UnipileAttendee,
  message: UnipileMessage,
) {
  const externalId = deriveExternalId(attendee)
  const existingContact = await prisma.contact.findUnique({
    where: {
      businessId_channel_externalId: {
        businessId: connection.businessId,
        channel: connection.channel,
        externalId,
      },
    },
    select: { id: true },
  })

  const contact = existingContact
    ? await prisma.contact.update({
        where: { id: existingContact.id },
        data: {
          connectionId: connection.id,
          lastSeen: new Date(message.created_at),
          ...deriveContactFields(connection.channel, attendee),
        },
      })
    : await prisma.contact.create({
        data: {
          businessId: connection.businessId,
          connectionId: connection.id,
          channel: connection.channel,
          externalId,
          lastSeen: new Date(message.created_at),
          ...deriveContactFields(connection.channel, attendee),
        },
      })

  const existingConversation = await prisma.conversation.findFirst({
    where: {
      businessId: connection.businessId,
      connectionId: connection.id,
      contactId: contact.id,
      externalThreadId: chat.id,
    },
    select: {
      id: true,
      status: true,
    },
  })

  if (!existingConversation) {
    await prisma.contact.update({
      where: { id: contact.id },
      data: {
        totalConversations: {
          increment: 1,
        },
      },
    })
  }

  const conversation = existingConversation
    ? await prisma.conversation.update({
        where: { id: existingConversation.id },
        data: {
          lastMessageAt: new Date(message.created_at),
          lastInboundMessageAt: new Date(message.created_at),
          unreadCount: {
            increment: 1,
          },
          status: existingConversation.status === 'RESOLVED' ? 'NEW' : existingConversation.status,
        },
      })
    : await prisma.conversation.create({
        data: {
          businessId: connection.businessId,
          connectionId: connection.id,
          channel: connection.channel,
          contactId: contact.id,
          status: 'NEW',
          externalThreadId: chat.id,
          unreadCount: 1,
          lastMessageAt: new Date(message.created_at),
          lastInboundMessageAt: new Date(message.created_at),
        },
      })

  if (!message.id) {
    return
  }

  await prisma.message.upsert({
    where: {
      channel_externalMessageId: {
        channel: connection.channel,
        externalMessageId: message.id,
      },
    },
    update: {
      direction: 'INBOUND',
      senderType: 'CUSTOMER',
      type: deriveMessageType(message),
      content: deriveMessageContent(message),
      mediaUrl: message.attachments[0]?.url ?? null,
      mediaType: message.attachments[0]?.type ?? null,
      rawPayload: message,
    },
    create: {
      businessId: connection.businessId,
      connectionId: connection.id,
      channel: connection.channel,
      conversationId: conversation.id,
      direction: 'INBOUND',
      senderType: 'CUSTOMER',
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

async function handleMessageCreated(payload: WebhookPayload) {
  const accountId = payload.account_id
  const data = isRecord(payload.data) ? payload.data : null
  const message = isRecord(data?.message) ? data.message as UnipileMessage : null
  const chat = isRecord(data?.chat) ? data.chat as UnipileChat : null

  if (!accountId || !message || !chat) {
    return { processed: false, error: 'Missing message.created payload data.' }
  }

  if (message.is_sender) {
    return { processed: true }
  }

  const connection = await prisma.businessChannelConnection.findFirst({
    where: { unipileAccountId: accountId },
    select: {
      id: true,
      businessId: true,
      channel: true,
    },
  })

  if (!connection || (connection.channel !== 'WHATSAPP' && connection.channel !== 'INSTAGRAM')) {
    return { processed: false, error: 'No matching connection for inbound message.' }
  }

  const attendeeId = message.sender_id || chat.attendees.find((attendee) => attendee.id)?.id

  if (!attendeeId) {
    return { processed: false, error: 'Missing attendee for inbound message.' }
  }

  const attendee = await unipile.getAttendee(accountId, attendeeId)
  await upsertInboundMessage(
    {
      id: connection.id,
      businessId: connection.businessId,
      channel: connection.channel,
    },
    chat,
    attendee,
    message,
  )

  return {
    processed: true,
    businessId: connection.businessId,
    connectionId: connection.id,
    channel: connection.channel,
  }
}

async function handleMessageUpdated(payload: WebhookPayload) {
  const data = isRecord(payload.data) ? payload.data : null
  const messageData = isRecord(data?.message) ? data.message : data
  const messageId = asString(messageData?.id) ?? asString(messageData?.message_id)
  const statusValue = asString(messageData?.status)

  if (!messageId) {
    return { processed: false, error: 'Missing message.updated identifier.' }
  }

  const existingMessage = await prisma.message.findFirst({
    where: {
      externalMessageId: messageId,
    },
    select: {
      id: true,
      businessId: true,
      connectionId: true,
      channel: true,
    },
  })

  if (!existingMessage || (existingMessage.channel !== 'WHATSAPP' && existingMessage.channel !== 'INSTAGRAM')) {
    return { processed: false, error: 'Message not found for update.' }
  }

  const status = deriveMessageStatus(statusValue)
  const eventTime = payload.timestamp ? new Date(payload.timestamp) : new Date()

  await prisma.message.update({
    where: { id: existingMessage.id },
    data: {
      status,
      externalStatus: statusValue ?? null,
      rawPayload: payload.data ?? null,
      deliveredAt: status === 'DELIVERED' ? eventTime : undefined,
      readAt: status === 'READ' ? eventTime : undefined,
      failedAt: status === 'FAILED' ? eventTime : undefined,
    },
  })

  return {
    processed: true,
    businessId: existingMessage.businessId,
    connectionId: existingMessage.connectionId,
    channel: existingMessage.channel,
  }
}

async function processEvent(payload: WebhookPayload) {
  if (payload.type?.startsWith('account.')) {
    return handleAccountEvent(payload)
  }

  if (payload.type === 'message.created') {
    return handleMessageCreated(payload)
  }

  if (payload.type === 'message.updated') {
    return handleMessageUpdated(payload)
  }

  return { processed: true }
}

export async function POST(request: Request) {
  const secret = process.env.UNIPILE_WEBHOOK_SECRET

  if (!secret) {
    return NextResponse.json({ success: false, error: 'Webhook secret not configured.' }, { status: 500 })
  }

  const rawBody = await request.text()
  const signature = request.headers.get('x-unipile-signature')

  if (!verifySignature(rawBody, signature, secret)) {
    return NextResponse.json({ success: false, error: 'Invalid signature.' }, { status: 403 })
  }

  let payload: WebhookPayload

  try {
    payload = JSON.parse(rawBody) as WebhookPayload
  } catch {
    return NextResponse.json({ success: true })
  }
  const headers = Object.fromEntries(request.headers.entries())

  let webhookEventId: string | null = null

  try {
    const created = await prisma.webhookEvent.create({
      data: {
        source: 'UNIPILE',
        eventType: payload.type ?? 'unknown',
        headers,
        payload,
      },
      select: { id: true },
    })

    webhookEventId = created.id
  } catch {}

  try {
    const result = await processEvent(payload)

    if (webhookEventId) {
      try {
        await prisma.webhookEvent.update({
          where: { id: webhookEventId },
          data: {
            businessId: result.businessId,
            connectionId: result.connectionId,
            channel: result.channel,
            processed: result.processed,
            error: 'error' in result ? result.error ?? null : null,
            processedAt: new Date(),
          },
        })
      } catch {}
    }
  } catch (error) {
    if (webhookEventId) {
      try {
        await prisma.webhookEvent.update({
          where: { id: webhookEventId },
          data: {
            processed: false,
            error: error instanceof Error ? error.message : 'Unexpected webhook error.',
            processedAt: new Date(),
          },
        })
      } catch {}
    }
  }

  return NextResponse.json({ success: true })
}
