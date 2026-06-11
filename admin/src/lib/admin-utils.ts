export function filterBusinesses<T extends { name: string; email: string; plan: string }>(
  businesses: T[],
  query: string,
  plan?: string
): T[] {
  const q = query.toLowerCase()
  return businesses.filter(b => {
    const matchesQuery = !q || b.name.toLowerCase().includes(q) || b.email.toLowerCase().includes(q)
    const matchesPlan = !plan || b.plan === plan
    return matchesQuery && matchesPlan
  })
}

export const PLAN_PRICES: Record<string, number> = {
  STARTER: 49,
  PRO: 99,
  ENTERPRISE: 199,
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
  businesses: Array<{ plan: string; planStatus: string }>
): number {
  return businesses
    .filter(b => b.planStatus === 'ACTIVE')
    .reduce((sum, b) => sum + (PLAN_PRICES[b.plan] ?? 0), 0)
}

export function calculateConfirmedRevenue(
  businesses: Array<{ plan: string; planStatus: string; isPaid: boolean }>
): number {
  return businesses
    .filter(b => b.isPaid)
    .reduce((sum, b) => sum + (PLAN_PRICES[b.plan] ?? 0), 0)
}

export function calculatePendingRevenue(
  businesses: Array<{ plan: string; planStatus: string; isPaid: boolean }>
): number {
  return calculateExpectedRevenue(businesses) - calculateConfirmedRevenue(businesses)
}
