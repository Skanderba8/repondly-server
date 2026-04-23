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
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0d1b2e', marginBottom: 24 }}>
        Suivi d&apos;onboarding
      </h1>
      <KanbanBoard businesses={businesses} />
    </div>
  )
}
