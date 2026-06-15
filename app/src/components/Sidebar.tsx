'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, Bell, Bot, ChevronDown, Inbox, LayoutDashboard, Package, Settings, ShoppingBag, UserPlus, Users } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { cn } from '@/lib/utils'

const sections = [
  {
    label: 'GÉNÉRAL',
    items: [
      { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
      { href: '/inbox', label: 'Boîte de réception', icon: Inbox },
      { href: '/contacts', label: 'Contacts', icon: Users },
      { href: '/orders', label: 'Commandes', icon: ShoppingBag },
    ],
  },
  {
    label: 'OUTILS',
    items: [
      { href: '/inventory', label: 'Inventaire', icon: Package },
      { href: '/followups', label: 'Relances', icon: Bell },
      { href: '/bot', label: 'Bot IA', icon: Bot },
      { href: '/analytics', label: 'Analytiques', icon: BarChart3 },
    ],
  },
  {
    label: 'SUPPORT',
    items: [
      { href: '/settings', label: 'Paramètres', icon: Settings },
    ],
  },
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
    <aside className="nx-sidebar">
      <div className="nx-sidebar-logo">
        <div className="nx-sidebar-mark">
          <img src="/logo.png" alt="" />
        </div>
        <span>Répondly</span>
      </div>

      <nav className="flex flex-1 flex-col overflow-y-auto py-3" aria-label="Navigation principale">
        {sections.map((section) => (
          <div key={section.label} className="nx-nav-section">
            <span className="nx-nav-label">{section.label}</span>
            <div className="flex flex-col gap-1">
              {section.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn('nx-nav-item', active && 'is-active')}
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon aria-hidden="true" />
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="nx-sidebar-bottom">
        <div className="nx-workspace-card">
          <div className="nx-sidebar-mark">
            <img src="/logo.png" alt="" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-semibold leading-tight text-[color:var(--text-primary)]">Répondly</p>
            <p className="truncate text-[11px] leading-tight text-[color:var(--text-muted)]">Plan {business.plan}</p>
          </div>
          <ChevronDown className="h-3.5 w-3.5 text-[color:var(--text-muted)]" aria-hidden="true" />
        </div>
        <button type="button" className="nx-invite-btn">
          <UserPlus size={15} aria-hidden="true" />
          Inviter un membre
        </button>
        <div className="nx-team-block">
          <Avatar initials={initials} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-semibold leading-tight text-[color:var(--text-primary)]">{displayName}</p>
            <p className="truncate text-[11px] leading-tight text-[color:var(--text-muted)]">Administrateur</p>
          </div>
          <span className="nx-kebab" aria-hidden="true">•••</span>
        </div>
        {business.plan === 'TRIAL' ? <button type="button" className="nx-upgrade-btn">Mettre à niveau</button> : null}
      </div>
    </aside>
  )
}
