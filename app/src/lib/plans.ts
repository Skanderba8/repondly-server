import type { Plan, PlanStatus } from '@prisma/client'

export type PaidPlan = Plan
export type EffectivePlan = PaidPlan | 'TRIAL'
export type LimitType = 'channels' | 'users' | 'aiReplies' | 'conversations' | 'ordersAndAppointments' | 'products' | 'broadcasts'
export type FeatureKey = 'aiReplies' | 'channels' | 'broadcasts' | 'products' | 'users'

export type PlanLimits = {
  price?: number
  durationDays?: number
  channels: number
  users: number
  aiRepliesPerMonth: number
  conversationsPerMonth: number
  ordersAndAppointmentsPerMonth: number
  products: number
  broadcastsPerMonth: number
}

export type PlanCard = {
  plan: PaidPlan
  name: string
  price: number
  description: string
  bestFor: string
  badge?: string
  features: string[]
}

export const TRIAL_DURATION_DAYS = 7
export const TRIAL_DATA_RETENTION_DAYS = 15

export const PLAN_LIMITS: Record<EffectivePlan, PlanLimits> = {
  TRIAL: {
    durationDays: TRIAL_DURATION_DAYS,
    channels: 2,
    users: 1,
    aiRepliesPerMonth: 500,
    conversationsPerMonth: 1000,
    ordersAndAppointmentsPerMonth: 300,
    products: 50,
    broadcastsPerMonth: 0,
  },
  ESSENTIEL: {
    price: 39,
    channels: 1,
    users: 1,
    aiRepliesPerMonth: 2000,
    conversationsPerMonth: 5000,
    ordersAndAppointmentsPerMonth: 1000,
    products: 100,
    broadcastsPerMonth: 0,
  },
  BUSINESS: {
    price: 89,
    channels: 2,
    users: 2,
    aiRepliesPerMonth: 6000,
    conversationsPerMonth: 15000,
    ordersAndAppointmentsPerMonth: 3000,
    products: 300,
    broadcastsPerMonth: 1,
  },
  BUSINESS_PLUS: {
    price: 119,
    channels: 3,
    users: 3,
    aiRepliesPerMonth: 12000,
    conversationsPerMonth: 30000,
    ordersAndAppointmentsPerMonth: 7500,
    products: 750,
    broadcastsPerMonth: 2,
  },
  GROWTH: {
    price: 199,
    channels: 5,
    users: 5,
    aiRepliesPerMonth: 30000,
    conversationsPerMonth: 100000,
    ordersAndAppointmentsPerMonth: 25000,
    products: 2500,
    broadcastsPerMonth: 5,
  },
}

export const PLAN_NAMES: Record<EffectivePlan, string> = {
  TRIAL: 'Essai gratuit',
  ESSENTIEL: 'Essentiel',
  BUSINESS: 'Business',
  BUSINESS_PLUS: 'Business Plus',
  GROWTH: 'Growth',
}

export const PLAN_CARDS: PlanCard[] = [
  {
    plan: 'ESSENTIEL',
    name: 'Essentiel',
    price: 39,
    description: 'Pour commencer avec un seul canal.',
    bestFor: 'Business qui utilise principalement WhatsApp ou Instagram et veut automatiser les questions repetitives.',
    features: [
      '1 canal connecte',
      '1 utilisateur',
      'Assistant IA 24/7',
      '2,000 reponses IA / mois',
      'Jusqu a 5,000 conversations / mois',
      'Jusqu a 1,000 commandes ou demandes de rendez-vous / mois',
      '100 produits ou services',
      'Boite de reception simple',
      '7 jours gratuits',
    ],
  },
  {
    plan: 'BUSINESS',
    name: 'Business',
    price: 89,
    description: 'Pour les messages clients quotidiens sur deux canaux.',
    bestFor: 'Business qui recoit des commandes ou demandes chaque jour et veut mieux suivre les clients.',
    features: [
      '2 canaux connectes',
      '2 utilisateurs',
      'Assistant IA 24/7',
      '6,000 reponses IA / mois',
      'Jusqu a 15,000 conversations / mois',
      'Jusqu a 3,000 commandes ou demandes de rendez-vous / mois',
      '300 produits ou services',
      'Suivi clients et relances simples',
      '1 campagne promotionnelle / mois',
      '7 jours gratuits',
    ],
  },
  {
    plan: 'BUSINESS_PLUS',
    name: 'Business Plus',
    price: 119,
    description: 'Le plus complet pour WhatsApp, Messenger et Instagram.',
    bestFor: 'Business qui veut connecter ses trois canaux principaux et gerer ses messages, commandes et relances au meme endroit.',
    badge: 'Le plus complet',
    features: [
      '3 canaux connectes',
      '3 utilisateurs',
      'WhatsApp + Messenger + Instagram',
      'Assistant IA multi-canal',
      '12,000 reponses IA / mois',
      'Jusqu a 30,000 conversations / mois',
      'Jusqu a 7,500 commandes ou demandes de rendez-vous / mois',
      '750 produits ou services',
      'Relances clients avancees',
      '2 campagnes promotionnelles / mois',
      '7 jours gratuits',
    ],
  },
  {
    plan: 'GROWTH',
    name: 'Growth',
    price: 199,
    description: 'Pour les equipes, plusieurs comptes et gros volumes.',
    bestFor: 'Business avec plusieurs pages/comptes, plus de produits, plus de messages, ou une equipe qui gere les clients.',
    features: [
      '5 canaux connectes',
      '5 utilisateurs',
      'Assistant IA avance',
      '30,000 reponses IA / mois',
      'Jusqu a 100,000 conversations / mois',
      'Jusqu a 25,000 commandes ou demandes de rendez-vous / mois',
      '2,500 produits ou services',
      'Gestion d equipe',
      'Relances clients avancees',
      '5 campagnes promotionnelles / mois',
      'Tableau de bord business',
      'Support prioritaire',
    ],
  },
]

const PLAN_ORDER: PaidPlan[] = ['ESSENTIEL', 'BUSINESS', 'BUSINESS_PLUS', 'GROWTH']

export function getPlanLimits(plan: EffectivePlan) {
  return PLAN_LIMITS[plan]
}

export function isTrialActive(business: { planStatus: PlanStatus | string, trialEndsAt?: Date | string | null }) {
  return business.planStatus === 'TRIALING' && Boolean(business.trialEndsAt) && new Date(business.trialEndsAt as Date | string).getTime() > Date.now()
}

export function isTrialExpired(business: { planStatus: PlanStatus | string, trialEndsAt?: Date | string | null }) {
  if (business.planStatus === 'TRIAL_EXPIRED') return true
  return business.planStatus === 'TRIALING' && Boolean(business.trialEndsAt) && new Date(business.trialEndsAt as Date | string).getTime() <= Date.now()
}

export function getTrialDaysRemaining(business: { planStatus: PlanStatus | string, trialEndsAt?: Date | string | null }) {
  if (!isTrialActive(business) || !business.trialEndsAt) return 0
  const diff = new Date(business.trialEndsAt).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / 86_400_000))
}

export function getEffectivePlan(business: { plan: PaidPlan, planStatus: PlanStatus | string }) {
  return business.planStatus === 'TRIALING' ? 'TRIAL' : business.plan
}

export function getEffectiveLimits(business: { plan: PaidPlan, planStatus: PlanStatus | string }) {
  return getPlanLimits(getEffectivePlan(business))
}

export function getUpgradeTargetForLimit(limitType: LimitType, currentPlan: EffectivePlan): PaidPlan {
  const currentIndex = currentPlan === 'TRIAL' ? -1 : PLAN_ORDER.indexOf(currentPlan)

  for (const plan of PLAN_ORDER.slice(Math.max(0, currentIndex + 1))) {
    const limits = PLAN_LIMITS[plan]
    if (limitType === 'channels' && limits.channels > PLAN_LIMITS[currentPlan].channels) return plan
    if (limitType === 'users' && limits.users > PLAN_LIMITS[currentPlan].users) return plan
    if (limitType === 'aiReplies' && limits.aiRepliesPerMonth > PLAN_LIMITS[currentPlan].aiRepliesPerMonth) return plan
    if (limitType === 'conversations' && limits.conversationsPerMonth > PLAN_LIMITS[currentPlan].conversationsPerMonth) return plan
    if (limitType === 'ordersAndAppointments' && limits.ordersAndAppointmentsPerMonth > PLAN_LIMITS[currentPlan].ordersAndAppointmentsPerMonth) return plan
    if (limitType === 'products' && limits.products > PLAN_LIMITS[currentPlan].products) return plan
    if (limitType === 'broadcasts' && limits.broadcastsPerMonth > PLAN_LIMITS[currentPlan].broadcastsPerMonth) return plan
  }

  return 'GROWTH'
}

export function canUseFeature(business: { plan: PaidPlan, planStatus: PlanStatus | string }, feature: FeatureKey) {
  if (['TRIAL_EXPIRED', 'PAST_DUE', 'SUSPENDED', 'CANCELLED'].includes(business.planStatus)) return false
  const limits = getEffectiveLimits(business)
  if (feature === 'broadcasts') return limits.broadcastsPerMonth > 0
  return true
}

export function buildPlanLimitError(params: {
  code: string
  message: string
  limitType: LimitType
  currentLimit: number
  currentUsage: number
  currentPlan: EffectivePlan
}) {
  return {
    success: false,
    error: params.message,
    code: params.code,
    limitType: params.limitType,
    currentLimit: params.currentLimit,
    currentUsage: params.currentUsage,
    recommendedPlan: getUpgradeTargetForLimit(params.limitType, params.currentPlan),
  }
}
