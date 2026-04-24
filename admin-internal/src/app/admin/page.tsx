import { prisma } from '@/lib/prisma'
import { calculateMRR } from '@/lib/admin'
import AdminOverviewClient from './OverviewClient'

async function checkHealth(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(3000) })
    return res.ok
  } catch {
    return false
  }
}

export default async function AdminOverviewPage() {
  const [businesses, recentActivity, botOnline, appOnline] = await Promise.all([
    prisma.business.findMany({ include: { onboarding: true } }),
    prisma.activityLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { business: { select: { name: true } } },
    }).catch(() => []),
    checkHealth('http://127.0.0.1:3001/health'),
    checkHealth('https://app.repondly.com'),
  ])

  const now = new Date()
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const totalClients = businesses.length
  const activeClients = businesses.filter(b => b.status === 'ACTIVE').length
  const trialClients = businesses.filter(b => b.status === 'TRIAL').length
  const mrr = calculateMRR(businesses.map(b => ({ plan: b.plan as string, status: b.status })))
  const trialsExpiring = businesses.filter(
    b => b.status === 'TRIAL' && b.trialEndsAt && b.trialEndsAt <= in7Days && b.trialEndsAt >= now
  ).length
  const pendingConfig = businesses.filter(
    b => !b.onboarding || !['LIVE', 'PAYING'].includes(b.onboarding.stage)
  ).length

  const planBreakdown = {
    FREE: businesses.filter(b => b.plan === 'FREE').length,
    STARTER: businesses.filter(b => b.plan === 'STARTER').length,
    PRO: businesses.filter(b => b.plan === 'PRO').length,
    BUSINESS: businesses.filter(b => b.plan === 'BUSINESS').length,
  }

  return (
    <AdminOverviewClient
      stats={{ totalClients, activeClients, trialClients, mrr, trialsExpiring, pendingConfig }}
      services={{ botOnline, appOnline }}
      recentActivity={recentActivity.map(e => ({
        id: e.id,
        businessName: e.business.name,
        action: e.action,
        createdAt: e.createdAt.toISOString(),
      }))}
      planBreakdown={planBreakdown}
    />
  )
}
