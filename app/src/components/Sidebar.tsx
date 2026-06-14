'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, Clock, Inbox, Settings, Users } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { SignOutButton } from '@/components/SignOutButton'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/inbox', label: 'Inbox', icon: Inbox, badge: 3 },
  { href: '/dashboard', label: 'Tableau de bord', icon: BarChart3 },
  { href: '/followups', label: 'Relances', icon: Clock },
  { href: '/contacts', label: 'Contacts', icon: Users },
  { href: '/settings', label: 'Paramètres', icon: Settings },
]

type SidebarProps = {
  business: { name: string; plan: string }
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

export function Sidebar({ business }: SidebarProps) {
  const pathname = usePathname()
  const displayName = business.name || 'Mon entreprise'
  const initials = getInitials(displayName)

  return (
    <aside className="rp-sidebar">
      <div className="rp-sidebar-brand">
        <div className="rp-sidebar-logo">R</div>
        <div className="min-w-0">
          <p className="truncate text-[13.5px] font-semibold leading-tight text-[color:var(--text-primary)]">Répondly</p>
          <p className="truncate text-[11.5px] leading-tight text-[color:var(--text-muted)]">Messagerie client</p>
        </div>
      </div>

      <nav className="rp-sidebar-nav" aria-label="Navigation principale">
        <div className="rp-sidebar-section">
          <p className="rp-sidebar-label">Espace</p>
          <div className="grid gap-1">
            {navItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn('rp-sidebar-link', active && 'is-active')}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {item.badge ? <span className="rp-sidebar-count">{item.badge}</span> : null}
                </Link>
              )
            })}
          </div>
        </div>
      </nav>

      <div className="rp-sidebar-user">
        <Avatar initials={initials} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12.5px] font-semibold leading-tight text-[color:var(--text-primary)]">{displayName}</p>
          <p className="truncate text-[11.5px] leading-tight text-[color:var(--text-muted)]">Plan {business.plan}</p>
        </div>
        <SignOutButton className="rp-sidebar-signout" />
      </div>
    </aside>
  )
}
