import { prisma } from '@/lib/prisma'
import { calculateMRR } from '@/lib/admin'

const C = {
  bg: '#ffffff',
  bgAlt: '#f4f7fb',
  blue: '#1a6bff',
  blueLight: '#e8f0ff',
  ink: '#0d1b2e',
  mid: '#5a6a80',
  border: '#e2e8f0',
}

async function checkHealth(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(3000) })
    return res.ok
  } catch {
    return false
  }
}

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `il y a ${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `il y a ${hours}h`
  return `il y a ${Math.floor(hours / 24)}j`
}

export default async function AdminOverviewPage() {
  const [businesses, recentActivity, botOnline, chatwootOnline] = await Promise.all([
    prisma.business.findMany({ include: { onboarding: true } }),
    prisma.activityLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { business: { select: { name: true } } },
    }).catch(() => []),
    checkHealth('http://127.0.0.1:3001/health'),
    checkHealth('http://127.0.0.1:3000'),
  ])

  const now = new Date()
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const totalClients = businesses.length
  const mrr = calculateMRR(businesses.map(b => ({ plan: b.plan as string, status: b.status })))
  const trialsExpiring = businesses.filter(
    (b) => b.status === 'TRIAL' && b.trialEndsAt && b.trialEndsAt <= in7Days && b.trialEndsAt >= now
  ).length
  const pendingConfig = businesses.filter(
    (b) => !b.onboarding || !['LIVE', 'PAYING'].includes(b.onboarding.stage)
  ).length

  const stats = [
    { label: 'Total Clients', value: totalClients, color: C.ink },
    { label: 'MRR', value: `${mrr} DT/mois`, color: C.blue },
    { label: 'Essais expirant', value: trialsExpiring, color: '#f59e0b' },
    { label: 'Config en attente', value: pendingConfig, color: '#f59e0b' },
    { label: 'Statut Bot', value: botOnline ? 'En ligne' : 'Hors ligne', color: botOnline ? '#22c55e' : '#ef4444' },
    { label: 'Statut Chatwoot', value: chatwootOnline ? 'En ligne' : 'Hors ligne', color: chatwootOnline ? '#22c55e' : '#ef4444' },
  ]

  return (
    <div style={{ padding: '32px', background: C.bgAlt, minHeight: '100vh' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: C.ink, marginBottom: 24 }}>
        Vue d&apos;ensemble
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
        {stats.map(stat => (
          <div
            key={stat.label}
            style={{
              background: C.bg,
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              padding: 20,
            }}
          >
            <div style={{ fontSize: 12, color: C.mid, marginBottom: 8 }}>{stat.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: C.ink, marginBottom: 16 }}>
          Activité récente
        </h2>
        <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
          {recentActivity.length === 0 ? (
            <div style={{ padding: 20, color: C.mid, fontSize: 14 }}>Aucune activité récente.</div>
          ) : (
            recentActivity.map((entry, i) => (
              <div
                key={entry.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 20px',
                  borderBottom: i < recentActivity.length - 1 ? `1px solid ${C.border}` : 'none',
                }}
              >
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, color: C.ink, fontSize: 14 }}>
                    {entry.business.name}
                  </span>
                  <span style={{ color: C.mid, fontSize: 14 }}>{entry.action}</span>
                </div>
                <span style={{ color: C.mid, fontSize: 12 }}>{timeAgo(entry.createdAt)}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
