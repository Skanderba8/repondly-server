import type { ConversationStatus, Direction } from '@/types'
import { prisma } from '@/lib/prisma'

export type MessageStat = {
  date: string
  count: number
}

export type WeeklyConversationStat = {
  week: string
  count: number
}

export type TopContactStat = {
  name: string
  totalConversations: number
}

export type ResponseStats = {
  inbound: number
  outbound: number
  rate: number
}

const CONVERSATION_STATUSES: ConversationStatus[] = ['NEW', 'IN_PROGRESS', 'CONFIRMED', 'FOLLOW_UP', 'RESOLVED']

function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setUTCDate(next.getUTCDate() + days)
  return next
}

function getDateRange(days: number, offsetDays = 0) {
  const safeDays = Math.max(1, days)
  const safeOffset = Math.max(0, offsetDays)
  const end = addDays(startOfUtcDay(new Date()), 1 - safeOffset)
  const start = addDays(end, -safeDays)

  return { start, end }
}

function formatDateKey(date: Date) {
  return date.toISOString().slice(0, 10)
}

function getIsoWeekKey(date: Date) {
  const current = startOfUtcDay(date)
  const day = current.getUTCDay() || 7
  current.setUTCDate(current.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(current.getUTCFullYear(), 0, 1))
  const week = Math.ceil((((current.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)

  return `${current.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

function getIsoWeekStart(date: Date) {
  const current = startOfUtcDay(date)
  const day = current.getUTCDay() || 7
  current.setUTCDate(current.getUTCDate() - day + 1)

  return current
}

export async function getMessageStats(businessId: string, days: number, offsetDays = 0): Promise<MessageStat[]> {
  const { start, end } = getDateRange(days, offsetDays)
  const rows = await prisma.$queryRaw<Array<{ date: string; count: number }>>`
    SELECT DATE("createdAt")::text AS date, COUNT(*)::int AS count
    FROM "Message"
    WHERE "businessId" = ${businessId}
      AND "direction" = 'INBOUND'
      AND "createdAt" >= ${start}
      AND "createdAt" < ${end}
    GROUP BY DATE("createdAt")
    ORDER BY date ASC
  `
  const countsByDate = new Map(rows.map((row) => [row.date, Number(row.count)]))

  return Array.from({ length: Math.max(1, days) }, (_, index) => {
    const date = formatDateKey(addDays(start, index))

    return {
      date,
      count: countsByDate.get(date) ?? 0,
    }
  })
}

export async function getConversationStatusBreakdown(businessId: string): Promise<Record<ConversationStatus, number>> {
  const rows = await prisma.conversation.groupBy({
    by: ['status'],
    _count: true,
    where: { businessId },
  })

  return CONVERSATION_STATUSES.reduce<Record<ConversationStatus, number>>((breakdown, status) => {
    breakdown[status] = rows.find((row) => row.status === status)?._count ?? 0
    return breakdown
  }, {
    NEW: 0,
    IN_PROGRESS: 0,
    CONFIRMED: 0,
    FOLLOW_UP: 0,
    RESOLVED: 0,
  })
}

export async function getWeeklyConversations(businessId: string, weeks = 8): Promise<WeeklyConversationStat[]> {
  const safeWeeks = Math.max(1, weeks)
  const currentWeekStart = getIsoWeekStart(new Date())
  const start = addDays(currentWeekStart, -(safeWeeks - 1) * 7)
  const end = addDays(currentWeekStart, 7)
  const rows = await prisma.$queryRaw<Array<{ week: string; count: number }>>`
    SELECT to_char(date_trunc('week', "createdAt"), 'IYYY-"W"IW') AS week, COUNT(*)::int AS count
    FROM "Conversation"
    WHERE "businessId" = ${businessId}
      AND "createdAt" >= ${start}
      AND "createdAt" < ${end}
    GROUP BY date_trunc('week', "createdAt")
    ORDER BY week ASC
  `
  const countsByWeek = new Map(rows.map((row) => [row.week, Number(row.count)]))

  return Array.from({ length: safeWeeks }, (_, index) => {
    const weekStart = addDays(start, index * 7)
    const week = getIsoWeekKey(weekStart)

    return {
      week,
      count: countsByWeek.get(week) ?? 0,
    }
  })
}

export async function getTopContacts(businessId: string, limit = 8): Promise<TopContactStat[]> {
  const contacts = await prisma.contact.findMany({
    where: { businessId },
    orderBy: [
      { totalConversations: 'desc' },
      { lastSeen: 'desc' },
    ],
    select: {
      name: true,
      username: true,
      phone: true,
      totalConversations: true,
    },
    take: Math.max(1, limit),
  })

  return contacts.map((contact) => ({
    name: contact.name ?? contact.username ?? contact.phone ?? 'Contact sans nom',
    totalConversations: contact.totalConversations,
  }))
}

export async function getResponseStats(businessId: string, days: number, offsetDays = 0): Promise<ResponseStats> {
  const { start, end } = getDateRange(days, offsetDays)
  const rows = await prisma.message.groupBy({
    by: ['direction'],
    _count: true,
    where: {
      businessId,
      createdAt: {
        gte: start,
        lt: end,
      },
    },
  })
  const counts = rows.reduce<Record<Direction, number>>((result, row) => {
    result[row.direction] = row._count
    return result
  }, {
    INBOUND: 0,
    OUTBOUND: 0,
  })
  const rate = counts.INBOUND > 0 ? Math.round((counts.OUTBOUND / counts.INBOUND) * 100) : 0

  return {
    inbound: counts.INBOUND,
    outbound: counts.OUTBOUND,
    rate,
  }
}
