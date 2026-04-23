import type { Metadata } from 'next'
import DashboardShell from './DashboardShell'

export const metadata: Metadata = { title: 'Tableau de bord | Répondly' }

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>
}
