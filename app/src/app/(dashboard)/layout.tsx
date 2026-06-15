import type { ReactNode } from 'react'
import { DashboardShell } from '@/components/DashboardShell'
import { requireBusinessSession, type BusinessSession } from '@/lib/auth'

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session: BusinessSession = await requireBusinessSession()

  return (
    <DashboardShell
      business={{
        name: session.user.name || 'Mon entreprise',
        plan: session.user.plan,
      }}
    >
      {children}
    </DashboardShell>
  )
}
