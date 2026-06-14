'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { BottomNav } from '@/components/BottomNav'
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
  if (pathname.startsWith('/contacts/')) {
    return 'Contact'
  }

  if (pathname.startsWith('/contacts')) {
    return 'Contacts'
  }

  if (pathname.startsWith('/followups')) {
    return 'Relances'
  }

  if (pathname.startsWith('/settings')) {
    return 'Paramètres'
  }

  if (pathname.startsWith('/dashboard')) {
    return 'Accueil'
  }

  return 'Inbox'
}

export function DashboardShell({ children, business }: DashboardShellProps) {
  const pathname = usePathname()

  return (
    <div className="rp-app-shell">
      <Sidebar business={business} />
      <div className="flex min-h-0 flex-1 flex-col">
        <TopBar title={getTitle(pathname)} />
        <main className="rp-shell-main">
          <div className="rp-shell-content">{children}</div>
        </main>
      </div>
      <BottomNav />
    </div>
  )
}
