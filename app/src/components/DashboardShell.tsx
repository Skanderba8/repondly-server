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
    <div className="flex h-screen overflow-hidden bg-[var(--surface-1)] md:flex-row">
      <Sidebar business={business} />
      <TopBar title={getTitle(pathname)} />
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden pb-[calc(56px+env(safe-area-inset-bottom))] pt-12 md:pb-0 md:pt-0">
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </main>
      <BottomNav />
    </div>
  )
}
