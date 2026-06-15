import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

type JsonValue = Prisma.InputJsonValue
type ChannelType = 'WHATSAPP' | 'MESSENGER' | 'INSTAGRAM'
type ConversationStatus = 'NEW'
type Direction = 'INBOUND'
type MessageStatus = 'SENT' | 'DELIVERED' | 'READ' | 'FAILED'
type MessageType = 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT' | 'STICKER' | 'REACTION' | 'SYSTEM' | 'UNSUPPORTED'
type SenderType = 'CUSTOMER'

type MessageUpdateData = {
  status: MessageStatus
  externalStatus: string
  rawPayload: JsonValue
  deliveredAt?: Date
  readAt?: Date
  failedAt?: Date
}

const ChannelType = {
  WHATSAPP: 'WHATSAPP',
  MESSENGER: 'MESSENGER',
  INSTAGRAM: 'INSTAGRAM',
} as const satisfies Record<ChannelType, ChannelType>

const ConversationStatus = {
  NEW: 'NEW',
} as const satisfies Record<ConversationStatus, ConversationStatus>

const Direction = {
  INBOUND: 'INBOUND',
} as const satisfies Record<Direction, Direction>

const MessageStatus = {
  SENT: 'SENT',
  DELIVERED: 'DELIVERED',
  READ: 'READ',
  FAILED: 'FAILED',
} as const satisfies Record<MessageStatus, MessageStatus>

const MessageType = {
  TEXT: 'TEXT',
  IMAGE: 'IMAGE',
  VIDEO: 'VIDEO',
  AUDIO: 'AUDIO',
  DOCUMENT: 'DOCUMENT',
  STICKER: 'STICKER',
  REACTION: 'REACTION',
  SYSTEM: 'SYSTEM',
  UNSUPPORTED: 'UNSUPPORTED',
} as const satisfies Record<MessageType, MessageType>

const SenderType = {
  CUSTOMER: 'CUSTOMER',
} as const satisfies Record<SenderType, SenderType>

type MetaObject = 'whatsapp_business_account' | 'page' | 'instagram'

type MetaWebhookPayload = {
  object: MetaObject
  entry?: unknown[]
}

type ProcessResult = {
  businessId?: string
  connectionId?: string
  eventType: string
  processedItems: number
}

type ChannelConnection = {
  id: string
  businessId: string
}

type NormalizedInboundMessage = {
  channel: ChannelType
  eventType: 'message'
  connectionLookupValue: string
  externalContactId: string
  externalMessageId?: string
  externalThreadId?: string
  content: string
  messageType: MessageType
  contactName?: string
  phone?: string
  sentAt: Date
  rawPayload: JsonValue
}

type NormalizedStatusEvent = {
  channel: ChannelType
  eventType: 'status'
  connectionLookupValue: string
  externalMessageId?: string
  status: MessageStatus
  statusAt: Date
  rawPayload: JsonValue
}

type NormalizedEvent = NormalizedInboundMessage | NormalizedStatusEvent

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function asString(value: unknown) {
  return typeof value === 'string' ? value : undefined
}

function asNumberString(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value)
  }

  return asString(value)
}

function toDateFromUnixSeconds(value: unknown) {
  const raw = asNumberString(value)

  if (!raw) {
    return new Date()
  }

  const parsed = Number(raw)

  if (!Number.isFinite(parsed)) {
    return new Date()
  }

  return new Date(parsed * 1000)
}

function toDateFromUnixMilliseconds(value: unknown) {
  const raw = asNumberString(value)

  if (!raw) {
    return new Date()
  }

  const parsed = Number(raw)

  if (!Number.isFinite(parsed)) {
    return new Date()
  }

  return new Date(parsed)
}

function mapMetaObjectToChannel(object: MetaObject) {
  if (object === 'whatsapp_business_account') {
    return ChannelType.WHATSAPP
  }

  if (object === 'page') {
    return ChannelType.MESSENGER
  }

  return ChannelType.INSTAGRAM
}

function getEventSource(object: MetaObject) {
  if (object === 'whatsapp_business_account') {
    return 'WHATSAPP'
  }

  if (object === 'page') {
    return 'MESSENGER'
  }

  return 'INSTAGRAM'
}

function deriveMessageContent(type: MessageType, text?: string) {
  if (text && text.trim()) {
    return text.trim()
  }

  if (type === MessageType.IMAGE) return 'Image reçue'
  if (type === MessageType.VIDEO) return 'Vidéo reçue'
  if (type === MessageType.AUDIO) return 'Audio reçu'
  if (type === MessageType.DOCUMENT) return 'Document reçu'
  if (type === MessageType.STICKER) return 'Sticker reçu'
  if (type === MessageType.REACTION) return 'Réaction reçue'

  return 'Message non pris en charge'
}

function mapAttachmentType(value: unknown) {
  const type = asString(value)

  if (type === 'image') return MessageType.IMAGE
  if (type === 'video') return MessageType.VIDEO
  if (type === 'audio') return MessageType.AUDIO
  if (type === 'file') return MessageType.DOCUMENT
  if (type === 'sticker') return MessageType.STICKER

  return MessageType.UNSUPPORTED
}

function mapWhatsAppMessageType(value: unknown) {
  const type = asString(value)

  if (type === 'text') return MessageType.TEXT
  if (type === 'image') return MessageType.IMAGE
  if (type === 'video') return MessageType.VIDEO
  if (type === 'audio') return MessageType.AUDIO
  if (type === 'document') return MessageType.DOCUMENT
  if (type === 'sticker') return MessageType.STICKER
  if (type === 'reaction') return MessageType.REACTION

  return MessageType.UNSUPPORTED
}

function mapWhatsAppStatus(value: unknown) {
  const status = asString(value)

  if (status === 'read') return MessageStatus.READ
  if (status === 'delivered') return MessageStatus.DELIVERED
  if (status === 'failed') return MessageStatus.FAILED

  return MessageStatus.SENT
}

function normalizeWhatsAppEvents(payload: MetaWebhookPayload): NormalizedEvent[] {
  const events: NormalizedEvent[] = []

  for (const entry of asArray(payload.entry)) {
    if (!isRecord(entry)) continue

    for (const change of asArray(entry.changes)) {
      if (!isRecord(change)) continue
      const value = isRecord(change.value) ? change.value : null
      if (!value) continue

      const metadata = isRecord(value.metadata) ? value.metadata : null
      const phoneNumberId = asString(metadata?.phone_number_id)
      if (!phoneNumberId) continue

      const contacts = asArray(value.contacts)
      const firstContact = isRecord(contacts[0]) ? contacts[0] : null
      const profile = isRecord(firstContact?.profile) ? firstContact.profile : null
      const contactName = asString(profile?.name)
      const waContactPhone = asString(firstContact?.wa_id)

      for (const message of asArray(value.messages)) {
        if (!isRecord(message)) continue
        const messageType = mapWhatsAppMessageType(message.type)
        const textPayload = isRecord(message.text) ? message.text : null
        const reactionPayload = isRecord(message.reaction) ? message.reaction : null
        const content = deriveMessageContent(
          messageType,
          asString(textPayload?.body) ?? asString(reactionPayload?.emoji),
        )

        events.push({
          channel: ChannelType.WHATSAPP,
          eventType: 'message',
          connectionLookupValue: phoneNumberId,
          externalContactId: asString(message.from) ?? 'unknown',
          externalMessageId: asString(message.id),
          content,
          messageType,
          contactName,
          phone: waContactPhone,
          sentAt: toDateFromUnixSeconds(message.timestamp),
          rawPayload: message as JsonValue,
        })
      }

      for (const status of asArray(value.statuses)) {
        if (!isRecord(status)) continue

        events.push({
          channel: ChannelType.WHATSAPP,
          eventType: 'status',
          connectionLookupValue: phoneNumberId,
          externalMessageId: asString(status.id),
          status: mapWhatsAppStatus(status.status),
          statusAt: toDateFromUnixSeconds(status.timestamp),
          rawPayload: status as JsonValue,
        })
      }
    }
  }

  return events
}

function normalizePageLikeEvents(payload: MetaWebhookPayload): NormalizedEvent[] {
  const events: NormalizedEvent[] = []
  const channel = mapMetaObjectToChannel(payload.object)

  for (const entry of asArray(payload.entry)) {
    if (!isRecord(entry)) continue
    const entryId = asString(entry.id)
    if (!entryId) continue

    for (const messagingEvent of asArray(entry.messaging)) {
      if (!isRecord(messagingEvent)) continue

      const sender = isRecord(messagingEvent.sender) ? messagingEvent.sender : null
      const recipient = isRecord(messagingEvent.recipient) ? messagingEvent.recipient : null
      const senderId = asString(sender?.id)
      const recipientId = asString(recipient?.id)
      const message = isRecord(messagingEvent.message) ? messagingEvent.message : null

      if (!senderId || !message || senderId == entryId || recipientId != entryId) {
        continue
      }

      const attachments = asArray(message.attachments)
      const firstAttachment = isRecord(attachments[0]) ? attachments[0] : null
      const attachmentType = mapAttachmentType(firstAttachment?.type)
      const messageType = asString(message.text) ? MessageType.TEXT : attachmentType
      const content = deriveMessageContent(messageType, asString(message.text))

      events.push({
        channel,
        eventType: 'message',
        connectionLookupValue: entryId,
        externalContactId: senderId,
        externalMessageId: asString(message.mid),
        externalThreadId: entryId,
        content,
        messageType,
        sentAt: toDateFromUnixMilliseconds(messagingEvent.timestamp),
        rawPayload: messagingEvent as JsonValue,
      })
    }
  }

  return events
}

function normalizeEvents(payload: MetaWebhookPayload) {
  if (payload.object === 'whatsapp_business_account') {
    return normalizeWhatsAppEvents(payload)
  }

  return normalizePageLikeEvents(payload)
}

async function findOrCreateWhatsAppConnection(phoneNumberId: string) {
  const existingConnection = await prisma.businessChannelConnection.findFirst({
    where: { channel: ChannelType.WHATSAPP, metaPhoneNumberId: phoneNumberId },
    select: { id: true, businessId: true },
  })

  if (existingConnection) {
    return existingConnection
  }

  const legacyBusiness = await prisma.business.findFirst({
    where: { waPhoneNumberId: phoneNumberId },
    select: { id: true, phone: true },
  })

  if (!legacyBusiness) {
    return null
  }

  return prisma.businessChannelConnection.create({
    data: {
      businessId: legacyBusiness.id,
      channel: ChannelType.WHATSAPP,
      status: 'ACTIVE',
      label: legacyBusiness.phone,
      metaPhoneNumberId: phoneNumberId,
      metaPhoneNumber: legacyBusiness.phone,
    },
    select: { id: true, businessId: true },
  })
}

async function findConnection(event: NormalizedEvent) {
  if (event.channel === ChannelType.WHATSAPP) {
    return findOrCreateWhatsAppConnection(event.connectionLookupValue)
  }

  if (event.channel === ChannelType.MESSENGER) {
    return prisma.businessChannelConnection.findFirst({
      where: { channel: ChannelType.MESSENGER, metaPageId: event.connectionLookupValue },
      select: { id: true, businessId: true },
    })
  }

  return prisma.businessChannelConnection.findFirst({
    where: { channel: ChannelType.INSTAGRAM, metaInstagramAccountId: event.connectionLookupValue },
    select: { id: true, businessId: true },
  })
}

async function upsertInboundMessage(connection: ChannelConnection, event: NormalizedInboundMessage) {
  const existingContact = await prisma.contact.findUnique({
    where: {
      businessId_channel_externalId: {
        businessId: connection.businessId,
        channel: event.channel,
        externalId: event.externalContactId,
      },
    },
    select: { id: true },
  })

  const contact = existingContact
    ? await prisma.contact.update({
        where: { id: existingContact.id },
        data: {
          name: event.contactName,
          phone: event.phone,
          lastSeen: event.sentAt,
        },
        select: { id: true },
      })
    : await prisma.contact.create({
        data: {
          businessId: connection.businessId,
          connectionId: connection.id,
          channel: event.channel,
          externalId: event.externalContactId,
          name: event.contactName,
          phone: event.phone,
          lastSeen: event.sentAt,
          totalConversations: 1,
        },
        select: { id: true },
      }).catch(async () => prisma.contact.findUniqueOrThrow({
        where: {
          businessId_channel_externalId: {
            businessId: connection.businessId,
            channel: event.channel,
            externalId: event.externalContactId,
          },
        },
        select: { id: true },
      }))

  const conversation = await prisma.conversation.findFirst({
    where: {
      businessId: connection.businessId,
      connectionId: connection.id,
      contactId: contact.id,
    },
    orderBy: { updatedAt: 'desc' },
    select: { id: true },
  })

  const activeConversation = conversation
    ? await prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          lastMessageAt: event.sentAt,
          lastInboundMessageAt: event.sentAt,
          unreadCount: { increment: 1 },
          status: ConversationStatus.NEW,
          externalThreadId: event.externalThreadId,
        },
        select: { id: true },
      })
    : await prisma.conversation.create({
        data: {
          businessId: connection.businessId,
          connectionId: connection.id,
          channel: event.channel,
          contactId: contact.id,
          status: ConversationStatus.NEW,
          unreadCount: 1,
          lastMessageAt: event.sentAt,
          lastInboundMessageAt: event.sentAt,
          externalThreadId: event.externalThreadId,
        },
        select: { id: true },
      })

  if (!conversation && existingContact) {
    await prisma.contact.update({
      where: { id: contact.id },
      data: { totalConversations: { increment: 1 } },
    })
  }

  if (!event.externalMessageId) {
    await prisma.message.create({
      data: {
        businessId: connection.businessId,
        connectionId: connection.id,
        channel: event.channel,
        conversationId: activeConversation.id,
        direction: Direction.INBOUND,
        senderType: SenderType.CUSTOMER,
        type: event.messageType,
        content: event.content,
        rawPayload: event.rawPayload,
        status: MessageStatus.DELIVERED,
        createdAt: event.sentAt,
      },
    })

    return
  }

  await prisma.message.upsert({
    where: {
      channel_externalMessageId: {
        channel: event.channel,
        externalMessageId: event.externalMessageId,
      },
    },
    update: {
      content: event.content,
      type: event.messageType,
      rawPayload: event.rawPayload,
      status: MessageStatus.DELIVERED,
    },
    create: {
      businessId: connection.businessId,
      connectionId: connection.id,
      channel: event.channel,
      conversationId: activeConversation.id,
      direction: Direction.INBOUND,
      senderType: SenderType.CUSTOMER,
      type: event.messageType,
      content: event.content,
      externalMessageId: event.externalMessageId,
      rawPayload: event.rawPayload,
      status: MessageStatus.DELIVERED,
      createdAt: event.sentAt,
    },
  })
}

async function applyStatusEvent(connection: ChannelConnection, event: NormalizedStatusEvent) {
  if (!event.externalMessageId) {
    return
  }

  const data: MessageUpdateData = {
    status: event.status,
    externalStatus: event.status,
    rawPayload: event.rawPayload,
  }

  if (event.status === MessageStatus.DELIVERED) {
    data.deliveredAt = event.statusAt
  }

  if (event.status === MessageStatus.READ) {
    data.readAt = event.statusAt
  }

  if (event.status === MessageStatus.FAILED) {
    data.failedAt = event.statusAt
  }

  await prisma.message.updateMany({
    where: {
      businessId: connection.businessId,
      connectionId: connection.id,
      channel: event.channel,
      externalMessageId: event.externalMessageId,
    },
    data,
  })
}

export async function createWebhookEventRecord(payload: MetaWebhookPayload, headers: Headers) {
  const serializedHeaders: Record<string, string> = {}

  headers.forEach((value, key) => {
    serializedHeaders[key] = value
  })

  return prisma.webhookEvent.create({
    data: {
      source: getEventSource(payload.object),
      channel: mapMetaObjectToChannel(payload.object),
      headers: serializedHeaders as JsonValue,
      payload: payload as JsonValue,
    },
    select: { id: true },
  })
}

export async function processWebhookEventRecord(eventId: string, payload: MetaWebhookPayload): Promise<ProcessResult> {
  const normalizedEvents = normalizeEvents(payload)

  let processedItems = 0
  let resolvedBusinessId: string | undefined
  let resolvedConnectionId: string | undefined

  for (const event of normalizedEvents) {
    const connection = await findConnection(event)

    if (!connection) {
      continue
    }

    resolvedBusinessId = resolvedBusinessId ?? connection.businessId
    resolvedConnectionId = resolvedConnectionId ?? connection.id

    if (event.eventType === 'message') {
      await upsertInboundMessage(connection, event)
      processedItems += 1
      continue
    }

    await applyStatusEvent(connection, event)
    processedItems += 1
  }

  await prisma.webhookEvent.update({
    where: { id: eventId },
    data: {
      businessId: resolvedBusinessId,
      connectionId: resolvedConnectionId,
      eventType: normalizedEvents.length > 0 ? normalizedEvents[0].eventType : 'noop',
      processed: true,
      processedAt: new Date(),
      error: processedItems > 0 ? null : 'No matching connection or supported message found.',
    },
  })

  return {
    businessId: resolvedBusinessId,
    connectionId: resolvedConnectionId,
    eventType: normalizedEvents.length > 0 ? normalizedEvents[0].eventType : 'noop',
    processedItems,
  }
}

export async function markWebhookEventFailed(eventId: string, error: string) {
  await prisma.webhookEvent.update({
    where: { id: eventId },
    data: {
      error,
      processed: false,
    },
  })
}
