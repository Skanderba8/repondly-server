import { prisma } from '@/lib/prisma'
import KanbanBoard from '@/components/admin/KanbanBoard'

export default async function OnboardingPage() {
  const businesses = await prisma.business.findMany({
    include: {
      onboarding: true,
      adminNotes: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
    orderBy: { createdAt: 'asc' },
  })

  return (
    <div style={{ padding: '32px 36px', background: '#f4f7fb', minHeight: '100vh' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0d1b2e', margin: 0 }}>
          Suivi d&apos;onboarding
        </h1>
        <p style={{ fontSize: 13, color: '#5a6a80', margin: '4px 0 0' }}>
          {businesses.length} client{businesses.length !== 1 ? 's' : ''} en cours de suivi
        </p>
      </div>
      <KanbanBoard businesses={businesses} />
    </div>
  )
}
