import { prisma } from '@/lib/prisma'
import { buildInitials } from '@/lib/utils/initials'
import type { Contact, Conversation, Message } from '@/types'

type ContactRecord = {
  id: string
  name: string | null
  username: string | null
  phone: string | null
  totalConversations: number
  tags: string[]
  notes: string | null
  lastSeen: Date | null
}

type MessageRecord = {
  id: string
  content: string
  direction: Message['direction']
  createdAt: Date
}

type ConversationRecord = {
  id: string
  status: Conversation['status']
  intent: string | null
  lastMessageAt: Date | null
  unreadCount: number
  needsFollowUp: boolean
  followUpAt: Date | null
  summary: string | null
  contact: ContactRecord
  messages: MessageRecord[]
}

const VALID_INTENTS = new Set(['RDV', 'PRIX', 'COMMANDE', 'RÃ‰CLAMATION', 'AUTRE'])

function formatListTime(date?: Date | null) {
  if (!date) return ''

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function normalizeIntent(intent?: string | null): Conversation['intent'] {
  if (intent && VALID_INTENTS.has(intent)) {
    return intent as Conversation['intent']
  }

  return 'AUTRE'
}

function mapContact(contact: ContactRecord): Contact {
  return {
    id: contact.id,
    name: contact.name ?? contact.username ?? undefined,
    phone: contact.phone ?? undefined,
    initials: buildInitials(contact.name ?? contact.username ?? undefined, contact.phone ?? undefined),
    totalConversations: contact.totalConversations,
    tags: contact.tags,
    notes: contact.notes ?? undefined,
    lastSeen: formatListTime(contact.lastSeen),
  }
}

function mapMessages(messages: MessageRecord[]): Message[] {
  return messages.map((message) => ({
    id: message.id,
    content: message.content,
    direction: message.direction,
    timestamp: message.createdAt.toISOString(),
  }))
}

export function mapConversation(conversation: ConversationRecord): Conversation {
  const lastMessage = conversation.messages[conversation.messages.length - 1]

  return {
    id: conversation.id,
    contact: mapContact(conversation.contact),
    status: conversation.status,
    intent: normalizeIntent(conversation.intent),
    lastMessage: lastMessage?.content ?? '',
    time: formatListTime(conversation.lastMessageAt ?? lastMessage?.createdAt),
    unread: conversation.unreadCount > 0,
    messages: mapMessages(conversation.messages),
    needsFollowUp: conversation.needsFollowUp,
    followUpAt: conversation.followUpAt?.toISOString(),
    summary: conversation.summary ?? undefined,
  }
}

export async function getInboxConversations(businessId: string) {
  const conversations = await prisma.conversation.findMany({
    where: { businessId },
    include: {
      contact: true,
      messages: {
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: [
      { lastMessageAt: 'desc' },
      { updatedAt: 'desc' },
    ],
  })

  return conversations.map(mapConversation)
}

export async function getInboxConversationById(businessId: string, id: string) {
  const conversation = await prisma.conversation.findFirst({
    where: { businessId, id },
    include: {
      contact: true,
      messages: {
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  return conversation ? mapConversation(conversation) : null
}
