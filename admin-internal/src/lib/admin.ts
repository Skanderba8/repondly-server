import { auth } from '@/lib/auth'

/**
 * Returns true if the current session user has the ADMIN or SUPER_ADMIN role.
 * Replaces the legacy email-based isAdmin check.
 */
export async function isAdminRole(): Promise<boolean> {
  const session = await auth()
  const role = session?.user?.role
  return role === 'ADMIN' || role === 'SUPER_ADMIN'
}

/**
 * Returns true only if the current session user has the SUPER_ADMIN role.
 * Use this to gate destructive or reserved operations.
 */
export async function isSuperAdmin(): Promise<boolean> {
  const session = await auth()
  return session?.user?.role === 'SUPER_ADMIN'
}

/**
 * Backward-compatible alias for isAdminRole().
 * @deprecated Use isAdminRole() instead.
 */
export const isAdmin = isAdminRole

export const PLAN_PRICES: Record<string, number> = {
  STARTER: 49,
  PRO: 99,
  BUSINESS: 199,
}

export function calculateMRR(businesses: Array<{ plan: string; status: string }>): number {
  return businesses
    .filter(b => b.status === 'ACTIVE')
    .reduce((sum, b) => sum + (PLAN_PRICES[b.plan] ?? 0), 0)
}

export function filterBusinesses<T extends { name: string; email: string }>(
  businesses: T[],
  query: string,
  plan?: string
): T[] {
  const q = query.toLowerCase()
  return businesses.filter(b => {
    const matchesQuery = !q || b.name.toLowerCase().includes(q) || b.email.toLowerCase().includes(q)
    const matchesPlan = !plan || (b as unknown as Record<string, string>)['plan'] === plan
    return matchesQuery && matchesPlan
  })
}

export const ONBOARDING_STAGES = [
  'DEMO_BOOKED',
  'SETUP_IN_PROGRESS',
  'CHANNELS_CONNECTED',
  'BOT_CONFIGURED',
  'LIVE',
  'PAYING',
] as const

export type OnboardingStage = typeof ONBOARDING_STAGES[number]

export function getNextStage(stage: string): string {
  const idx = ONBOARDING_STAGES.indexOf(stage as OnboardingStage)
  if (idx === -1 || idx >= ONBOARDING_STAGES.length - 1) return stage
  return ONBOARDING_STAGES[idx + 1]
}

export type NoRuleGroup = { message: string; count: number }

export function groupNoRuleEvents(
  events: Array<{ ruleMatched: string | null; message: string | null }>
): NoRuleGroup[] {
  const noRuleEvents = events.filter(e => e.ruleMatched === null)
  const counts = new Map<string, number>()
  for (const e of noRuleEvents) {
    const key = (e.message ?? '').trim().toLowerCase().slice(0, 50)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return Array.from(counts.entries())
    .map(([message, count]) => ({ message, count }))
    .sort((a, b) => b.count - a.count)
}

export function calculateExpectedRevenue(
  businesses: Array<{ plan: string; status: string }>
): number {
  return businesses
    .filter(b => b.status === 'ACTIVE' || b.status === 'TRIAL')
    .reduce((sum, b) => sum + (PLAN_PRICES[b.plan] ?? 0), 0)
}

export function calculateConfirmedRevenue(
  businesses: Array<{ plan: string; status: string; paidThisMonth: boolean }>
): number {
  return businesses
    .filter(b => b.paidThisMonth)
    .reduce((sum, b) => sum + (PLAN_PRICES[b.plan] ?? 0), 0)
}

export function calculatePendingRevenue(
  businesses: Array<{ plan: string; status: string; paidThisMonth: boolean }>
): number {
  return calculateExpectedRevenue(businesses) - calculateConfirmedRevenue(businesses)
}
