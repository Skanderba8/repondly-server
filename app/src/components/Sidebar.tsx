'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Clock, MessageSquare, Settings, Users } from 'lucide-react'
import { SignOutButton } from '@/components/SignOutButton'
import { cn } from '@/lib/utils'

const items = [
  { href: '/inbox', label: 'Inbox', icon: MessageSquare, badge: 3 },
  { href: '/followups', label: 'Relances', icon: Clock },
  { href: '/contacts', label: 'Contacts', icon: Users },
  { href: '/settings', label: 'Paramètres', icon: Settings },
]

type SidebarProps = {
  business: {
    name: string
    plan: string
  }
}

function getInitials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || 'ME'
  )
}

export function Sidebar({ business }: SidebarProps) {
  const pathname = usePathname()
  const displayName = business.name || 'Mon entreprise'
  const initials = getInitials(displayName)

  return (
    <aside className="rp-sidebar">
      <div className="rp-sidebar-brand">
        <div className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] bg-[color:var(--brand-primary)] font-heading text-[14px] font-semibold text-[color:var(--text-on-brand)]">
          R
        </div>
        <div className="min-w-0">
          <p className="truncate font-heading text-[14px] font-semibold leading-[1.1] text-[color:var(--text-primary)]">
            Répondly
          </p>
          <p className="truncate text-[12px] leading-[1.2] text-[color:var(--text-muted)]">
            Console messagerie
          </p>
        </div>
      </div>

      <nav className="rp-sidebar-nav">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              data-active={active}
              className={cn('rp-sidebar-link', active && 'is-active')}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
              {item.badge ? <span className="rp-sidebar-count">{item.badge}</span> : null}
            </Link>
          )
        })}
      </nav>

      <div className="rp-sidebar-user">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[color:var(--brand-primary)] text-[11px] font-semibold text-[color:var(--text-on-brand)]">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold leading-[1.2] text-[color:var(--text-primary)]">
            {displayName}
          </p>
          <p className="truncate text-[12px] leading-[1.2] text-[color:var(--text-muted)]">
            Plan {business.plan}
          </p>
        </div>
        <SignOutButton className="rp-sidebar-signout" />
      </div>
    </aside>
  )
}
