import { prisma } from '@/lib/prisma'
import { buildInitials } from '@/lib/utils/initials'
import type { FollowUp } from '@/types'

const VALID_INTENTS = new Set(['RDV', 'PRIX', 'COMMANDE', 'RÉCLAMATION', 'AUTRE'])

function normalizeIntent(intent?: string | null): FollowUp['intent'] {
  if (intent && VALID_INTENTS.has(intent)) {
    return intent as FollowUp['intent']
  }

  return 'AUTRE'
}

export async function getFollowUps(businessId: string): Promise<FollowUp[]> {
  const conversations = await prisma.conversation.findMany({
    where: {
      businessId,
      needsFollowUp: true,
    },
    include: {
      contact: true,
    },
    orderBy: [
      { followUpAt: 'asc' },
      { updatedAt: 'desc' },
    ],
  })

  const now = new Date()

  return conversations.map((conversation) => ({
    id: conversation.id,
    contact: {
      id: conversation.contact.id,
      name: conversation.contact.name ?? conversation.contact.username ?? undefined,
      phone: conversation.contact.phone ?? undefined,
      initials: buildInitials(
        conversation.contact.name ?? conversation.contact.username ?? undefined,
        conversation.contact.phone ?? undefined,
      ),
      totalConversations: conversation.contact.totalConversations,
      tags: conversation.contact.tags,
      notes: conversation.contact.notes ?? undefined,
      lastSeen: conversation.contact.lastSeen?.toISOString(),
    },
    intent: normalizeIntent(conversation.intent),
    followUpAt: conversation.followUpAt?.toISOString() ?? conversation.updatedAt.toISOString(),
    overdue: Boolean(conversation.followUpAt && conversation.followUpAt < now),
  }))
}
