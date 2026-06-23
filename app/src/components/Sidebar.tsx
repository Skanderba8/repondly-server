'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, Bell, Bot, ChevronUp, Inbox, LayoutDashboard, Package, Settings, ShoppingBag, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buildInitials } from '@/lib/utils/initials'

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
      { href: '/inventory', label: 'Produits et services', icon: Package },
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

export function Sidebar({ business }: SidebarProps) {
  const pathname = usePathname()

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
        <div className="nx-team-block">
          <div className="nx-sidebar-mark" aria-hidden="true">
            {buildInitials(business.name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold leading-tight text-[color:var(--text-primary)]">{business.name}</p>
            <p className="truncate text-[11px] leading-tight text-[color:var(--text-muted)]">Plan {business.plan}</p>
          </div>
          <ChevronUp className="h-3.5 w-3.5 text-[color:var(--text-muted)]" aria-hidden="true" />
        </div>
      </div>
    </aside>
  )
}
