import { prisma } from '@/lib/prisma'
import { mapConversation } from '@/lib/inbox'
import type { Conversation } from '@/types'

export type DashboardStats = {
  newCount: number
  followUpCount: number
  activeCount: number
  resolvedCount: number
}

export async function getDashboardStats(businessId: string): Promise<DashboardStats> {
  const [newCount, followUpCount, activeCount, resolvedCount] = await Promise.all([
    prisma.conversation.count({
      where: { businessId, status: 'NEW' },
    }),
    prisma.conversation.count({
      where: { businessId, needsFollowUp: true },
    }),
    prisma.conversation.count({
      where: {
        businessId,
        status: {
          in: ['IN_PROGRESS', 'CONFIRMED'],
        },
      },
    }),
    prisma.conversation.count({
      where: { businessId, status: 'RESOLVED' },
    }),
  ])

  return { newCount, followUpCount, activeCount, resolvedCount }
}

export async function getRecentConversations(businessId: string, limit = 5): Promise<Conversation[]> {
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
    take: limit,
  })

  return conversations.map(mapConversation)
}

export async function getFollowUpConversations(businessId: string, limit = 3): Promise<Conversation[]> {
  const conversations = await prisma.conversation.findMany({
    where: {
      businessId,
      needsFollowUp: true,
    },
    include: {
      contact: true,
      messages: {
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: [
      { followUpAt: 'asc' },
      { updatedAt: 'desc' },
    ],
    take: limit,
  })

  return conversations.map(mapConversation)
}
