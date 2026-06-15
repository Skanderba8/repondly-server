'use client'

import { useEffect } from 'react'
import { Bell, Calendar, Search } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'

interface TopBarProps {
  title: string
  businessName?: string
}

function getInitials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || 'RE'
  )
}

export function TopBar({ title, businessName = 'Business' }: TopBarProps) {
  useEffect(() => {
    document.title = `${title} | Répondly`
  }, [title])

  return (
    <header className="nx-topbar">
      <div className="nx-sidebar-mark md:hidden">R</div>
      <div className="nx-search">
        <Search className="h-3.5 w-3.5 shrink-0 text-[color:var(--text-muted)]" aria-hidden="true" />
        <input type="search" placeholder="Rechercher" aria-label="Rechercher" />
      </div>
      <div className="ml-auto flex items-center gap-2">
        <button type="button" className="nx-topbar-icon" aria-label="Calendrier">
          <Calendar className="h-4 w-4" aria-hidden="true" />
        </button>
        <button type="button" className="nx-topbar-icon" aria-label="Notifications">
          <Bell className="h-4 w-4" aria-hidden="true" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[color:var(--danger)]" aria-hidden="true" />
        </button>
        <div className="nx-user-block">
          <Avatar initials={getInitials(businessName)} size="md" />
          <div className="min-w-0">
            <p className="truncate text-[12px] font-semibold leading-tight text-[color:var(--text-primary)]">{businessName}</p>
            <p className="truncate text-[11px] leading-tight text-[color:var(--text-muted)]">Business</p>
          </div>
        </div>
      </div>
    </header>
  )
}
