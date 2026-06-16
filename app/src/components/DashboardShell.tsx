'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { BottomNav } from '@/components/BottomNav'
import { InstallBanner } from '@/components/pwa/InstallBanner'
import { Sidebar } from '@/components/Sidebar'
import { TopBar } from '@/components/TopBar'

type DashboardShellProps = {
  children: ReactNode
  business: {
    name: string
    plan: string
  }
}

function getTitle(pathname: string) {
  if (pathname.startsWith('/contacts/')) return 'Contact'
  if (pathname.startsWith('/contacts')) return 'Contacts'
  if (pathname.startsWith('/followups')) return 'Relances'
  if (pathname.startsWith('/settings')) return 'Paramètres'
  if (pathname.startsWith('/dashboard')) return 'Tableau de bord'
  return 'Inbox'
}

export function DashboardShell({ children, business }: DashboardShellProps) {
  const pathname = usePathname()
  const inboxRoute = pathname.startsWith('/inbox')

  return (
    <div className="nx-shell">
      <Sidebar business={business} />
      <div className="nx-stage">
        <TopBar title={getTitle(pathname)} businessName={business.name} plan={business.plan} />
        <InstallBanner />
        <main className="nx-main">
          <div className={inboxRoute ? 'nx-content-inbox' : 'nx-content'}>{children}</div>
        </main>
      </div>
      <BottomNav />
    </div>
  )
}
