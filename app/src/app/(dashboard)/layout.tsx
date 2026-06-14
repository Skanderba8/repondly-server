import type { ReactNode } from 'react'
import { DashboardShell } from '@/components/DashboardShell'
import { requireBusinessSession } from '@/lib/auth'

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await requireBusinessSession()

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
