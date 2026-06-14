'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Clock3, MessageSquareText, Settings2, Users2 } from 'lucide-react'
import { SignOutButton } from '@/components/SignOutButton'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

const items = [
  { href: '/inbox', label: 'Inbox', icon: MessageSquareText },
  { href: '/followups', label: 'Relances', icon: Clock3 },
  { href: '/contacts', label: 'Contacts', icon: Users2 },
  { href: '/settings', label: 'Paramètres', icon: Settings2 },
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

  return (
    <aside className="hidden h-full w-[248px] flex-col border-r border-[color:var(--surface-border)] bg-[color:var(--surface-0)]/92 backdrop-blur md:flex">
      <div className="px-5 pb-5 pt-5">
        <div className="flex items-center gap-3 rounded-[4px] border border-[color:var(--surface-border)] bg-[color:var(--surface-0)] px-3 py-3 shadow-[var(--shadow-card)]">
          <div className="flex h-9 w-9 items-center justify-center rounded-[4px] bg-[color:var(--brand-primary-soft)] font-heading text-sm font-semibold text-[color:var(--brand)]">
            R.
          </div>
          <div>
            <p className="font-heading text-[13px] font-semibold text-[color:var(--text-primary)]">
              Répondly
            </p>
            <p className="text-[11px] text-[color:var(--text-secondary)]">
              Console messagerie
            </p>
          </div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              data-active={active}
              className={cn('rp-sidebar-link group', active && 'is-active')}
            >
              <span
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-[4px] border transition-all duration-200',
                  active
                    ? 'border-[color:var(--brand-primary-border)] bg-[color:var(--brand-primary-soft)] text-[color:var(--brand)]'
                    : 'border-transparent bg-transparent text-[color:var(--text-secondary)] group-hover:border-[color:var(--surface-border)] group-hover:bg-[color:var(--surface-2)] group-hover:text-[color:var(--text-primary)]',
                )}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-[color:var(--surface-border)] p-4">
        <div className="rounded-[4px] border border-[color:var(--surface-border)] bg-[color:var(--surface-0)] p-3 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-3">
            <Avatar initials={getInitials(business.name)} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[color:var(--text-primary)]">
                {business.name}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <Badge variant={business.plan} />
                <span className="text-[11px] text-[color:var(--text-secondary)]">
                  Espace actif
                </span>
              </div>
            </div>
          </div>
          <SignOutButton className="mt-4 inline-flex h-9 w-full items-center justify-center rounded-[4px] border border-[color:var(--surface-border)] bg-[color:var(--surface-0)] px-3 text-sm font-medium text-[color:var(--text-secondary)] transition-all duration-200 hover:border-[color:var(--surface-border-strong)] hover:bg-[color:var(--surface-2)] hover:text-[color:var(--text-primary)]" />
        </div>
      </div>
    </aside>
  )
}
