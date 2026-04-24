import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import DashboardShell from './DashboardShell'

export const metadata: Metadata = { title: 'Tableau de bord | Répondly' }

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect('/auth/signin')

  return <DashboardShell>{children}</DashboardShell>
}
