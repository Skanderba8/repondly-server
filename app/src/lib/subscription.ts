import { Prisma, type Plan } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import {
  PLAN_CARDS,
  PLAN_LIMITS,
  PLAN_NAMES,
  TRIAL_DATA_RETENTION_DAYS,
  getEffectiveLimits,
  getEffectivePlan,
  getTrialDaysRemaining,
  getUpgradeTargetForLimit,
  isTrialExpired,
  type EffectivePlan,
  type LimitType,
} from '@/lib/plans'

type BusinessForSubscription = {
  id: string
  plan: Plan
  planStatus: string
  isPaid: boolean
  trialStartedAt: Date | null
  trialEndsAt: Date | null
  trialExpiredAt: Date | null
  dataDeletionScheduledAt: Date | null
  currentPeriodStart: Date | null
  currentPeriodEnd: Date | null
}

type SubscriptionDbClient = Prisma.TransactionClient | typeof prisma

export type UsageSnapshot = {
  aiReplies: number
  conversations: number
  orders: number
  appointments: number
  broadcasts: number
  channels: number
  products: number
  users: number
}

export type SubscriptionState = {
  plan: Plan
  planName: string
  effectivePlan: EffectivePlan
  planStatus: string
  isPaid: boolean
  trialStartedAt: string | null
  trialEndsAt: string | null
  trialExpiredAt: string | null
  dataDeletionScheduledAt: string | null
  daysUntilTrialEnds: number
  currentPeriodStart: string | null
  currentPeriodEnd: string | null
  limits: (typeof PLAN_LIMITS)['TRIAL']
  usage: UsageSnapshot
  blockedFeatures: string[]
  warnings: string[]
  recommendedUpgradePlan: Plan
  planCards: typeof PLAN_CARDS
}

export function getCurrentMonthPeriod(now = new Date()) {
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  return { periodStart, periodEnd }
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function toIso(value: Date | null) {
  return value ? value.toISOString() : null
}

export async function getOrCreateMonthlyUsage(businessId: string, tx: SubscriptionDbClient = prisma) {
  const { periodStart, periodEnd } = getCurrentMonthPeriod()

  return tx.monthlyUsage.upsert({
    where: {
      businessId_periodStart: {
        businessId,
        periodStart,
      },
    },
    update: { periodEnd },
    create: {
      businessId,
      periodStart,
      periodEnd,
    },
  })
}

export async function incrementMonthlyUsage(
  businessId: string,
  field: 'aiReplies' | 'conversations' | 'orders' | 'appointments' | 'broadcasts',
  amount = 1,
  tx: SubscriptionDbClient = prisma,
) {
  const usage = await getOrCreateMonthlyUsage(businessId, tx)
  return tx.monthlyUsage.update({
    where: { id: usage.id },
    data: {
      [field]: {
        increment: amount,
      },
    },
  })
}

export async function ensureBusinessSubscriptionState(businessId: string) {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: {
      id: true,
      plan: true,
      planStatus: true,
      isPaid: true,
      trialStartedAt: true,
      trialEndsAt: true,
      trialExpiredAt: true,
      dataDeletionScheduledAt: true,
      currentPeriodStart: true,
      currentPeriodEnd: true,
    },
  })

  if (!business) return null

  if (!isTrialExpired(business)) return business

  const now = new Date()
  return prisma.business.update({
    where: { id: businessId },
    data: {
      planStatus: 'TRIAL_EXPIRED',
      botEnabled: false,
      trialExpiredAt: business.trialExpiredAt ?? now,
      dataDeletionScheduledAt: business.dataDeletionScheduledAt ?? addDays(now, TRIAL_DATA_RETENTION_DAYS),
    },
    select: {
      id: true,
      plan: true,
      planStatus: true,
      isPaid: true,
      trialStartedAt: true,
      trialEndsAt: true,
      trialExpiredAt: true,
      dataDeletionScheduledAt: true,
      currentPeriodStart: true,
      currentPeriodEnd: true,
    },
  })
}

function usageWarnings(business: BusinessForSubscription, usage: UsageSnapshot) {
  const limits = getEffectiveLimits(business)
  const warnings: string[] = []

  if (usage.conversations >= limits.conversationsPerMonth * 0.9) {
    warnings.push('Vous approchez de la limite de conversations de votre plan.')
  }

  if (usage.orders + usage.appointments >= limits.ordersAndAppointmentsPerMonth * 0.9) {
    warnings.push('Vous approchez de la limite de commandes & rendez-vous de votre plan.')
  }

  if (usage.aiReplies >= limits.aiRepliesPerMonth) {
    warnings.push('Vous avez atteint la limite de reponses IA de votre plan.')
  }

  return warnings
}

function blockedFeatures(business: BusinessForSubscription, usage: UsageSnapshot) {
  const limits = getEffectiveLimits(business)
  const blocked: string[] = []

  if (['TRIAL_EXPIRED', 'PAST_DUE', 'SUSPENDED', 'CANCELLED'].includes(business.planStatus)) {
    blocked.push('assistant IA', 'campagnes promotionnelles', 'nouveaux canaux')
  }

  if (usage.aiReplies >= limits.aiRepliesPerMonth) blocked.push('reponses IA automatiques')
  if (usage.channels >= limits.channels) blocked.push('nouveaux canaux')
  if (usage.products >= limits.products) blocked.push('nouveaux produits/services')
  if (usage.broadcasts >= limits.broadcastsPerMonth) blocked.push('campagnes promotionnelles')

  return Array.from(new Set(blocked))
}

export async function getSubscriptionState(businessId: string): Promise<SubscriptionState | null> {
  const business = await ensureBusinessSubscriptionState(businessId)
  if (!business) return null

  const [monthlyUsage, channelCount, productCount, memberCount] = await Promise.all([
    getOrCreateMonthlyUsage(businessId),
    prisma.businessChannelConnection.count({
      where: {
        businessId,
        status: { in: ['PENDING', 'ACTIVE'] },
      },
    }),
    prisma.product.count({ where: { businessId } }),
    prisma.businessMember.count({ where: { businessId } }),
  ])

  const usage: UsageSnapshot = {
    aiReplies: monthlyUsage.aiReplies,
    conversations: monthlyUsage.conversations,
    orders: monthlyUsage.orders,
    appointments: monthlyUsage.appointments,
    broadcasts: monthlyUsage.broadcasts,
    channels: channelCount,
    products: productCount,
    users: Math.max(1, memberCount),
  }
  const effectivePlan = getEffectivePlan(business)
  const limits = getEffectiveLimits(business)
  const warningList = usageWarnings(business, usage)
  const blocked = blockedFeatures(business, usage)

  return {
    plan: business.plan,
    planName: PLAN_NAMES[business.plan],
    effectivePlan,
    planStatus: business.planStatus,
    isPaid: business.isPaid,
    trialStartedAt: toIso(business.trialStartedAt),
    trialEndsAt: toIso(business.trialEndsAt),
    trialExpiredAt: toIso(business.trialExpiredAt),
    dataDeletionScheduledAt: toIso(business.dataDeletionScheduledAt),
    daysUntilTrialEnds: getTrialDaysRemaining(business),
    currentPeriodStart: toIso(business.currentPeriodStart),
    currentPeriodEnd: toIso(business.currentPeriodEnd),
    limits,
    usage,
    blockedFeatures: blocked,
    warnings: warningList,
    recommendedUpgradePlan: getUpgradeTargetForLimit(resolveMostRelevantLimit(limits, usage), effectivePlan),
    planCards: PLAN_CARDS,
  }
}

function resolveMostRelevantLimit(limits: (typeof PLAN_LIMITS)['TRIAL'], usage: UsageSnapshot): LimitType {
  if (usage.aiReplies >= limits.aiRepliesPerMonth * 0.7) return 'aiReplies'
  if (usage.channels >= limits.channels) return 'channels'
  if (usage.products >= limits.products * 0.7) return 'products'
  if (usage.broadcasts >= limits.broadcastsPerMonth && limits.broadcastsPerMonth > 0) return 'broadcasts'
  return 'aiReplies'
}

export async function activateManualSubscription(businessId: string, plan: Plan) {
  const now = new Date()
  const currentPeriodEnd = new Date(now)
  currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1)

  await prisma.business.update({
    where: { id: businessId },
    data: {
      plan,
      planStatus: 'ACTIVE',
      isPaid: true,
      subscriptionStartedAt: now,
      currentPeriodStart: now,
      currentPeriodEnd,
      dataDeletionScheduledAt: null,
    },
  })

  return getSubscriptionState(businessId)
}
