import { prisma } from '@/lib/prisma'
import { mapConversation } from '@/lib/inbox'
import { buildInitials } from '@/lib/utils/initials'
import type { Contact, Conversation } from '@/types'

function formatContactTime(date?: Date | null) {
  if (!date) return ''

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function mapContact(contact: {
  id: string
  name: string | null
  username: string | null
  phone: string | null
  totalConversations: number
  tags: string[]
  notes: string | null
  lastSeen: Date | null
  conversations?: Array<{ id: string }>
}): Contact {
  return {
    id: contact.id,
    name: contact.name ?? contact.username ?? undefined,
    phone: contact.phone ?? undefined,
    initials: buildInitials(contact.name ?? contact.username ?? undefined, contact.phone ?? undefined),
    totalConversations: Math.max(contact.totalConversations, contact.conversations?.length ?? 0),
    tags: contact.tags,
    notes: contact.notes ?? undefined,
    lastSeen: formatContactTime(contact.lastSeen),
  }
}

export async function getContacts(businessId: string): Promise<Contact[]> {
  const contacts = await prisma.contact.findMany({
    where: { businessId },
    include: {
      conversations: {
        select: { id: true },
      },
    },
    orderBy: [
      { lastSeen: 'desc' },
      { updatedAt: 'desc' },
    ],
  })

  return contacts.map(mapContact)
}

export async function getContactById(
  businessId: string,
  id: string,
): Promise<(Contact & { recentConversations: Conversation[] }) | null> {
  const contact = await prisma.contact.findFirst({
    where: { businessId, id },
    include: {
      conversations: {
        include: {
          contact: true,
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: [
          { updatedAt: 'desc' },
          { lastMessageAt: 'desc' },
        ],
        take: 5,
      },
    },
  })

  if (!contact) {
    return null
  }

  return {
    ...mapContact(contact),
    recentConversations: contact.conversations.map(mapConversation),
  }
}
