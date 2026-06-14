'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Clock, MessageSquare, Settings, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui/Avatar'

const items = [
  { href: '/inbox', label: 'Inbox', icon: MessageSquare },
  { href: '/followups', label: 'Relances', icon: Clock },
  { href: '/contacts', label: 'Contacts', icon: Users },
  { href: '/settings', label: 'Paramètres', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden h-full w-[220px] flex-col border-r border-[var(--border)] bg-[var(--surface-1)] md:flex">
      <div className="px-4 pb-6 pt-4">
        <p className="text-sm font-semibold text-[var(--text-primary)]">Répondly</p>
      </div>

      <nav className="flex flex-col gap-1 px-2">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex h-8 items-center gap-2 rounded px-3 text-sm transition-colors duration-100',
                active
                  ? 'bg-[var(--brand-soft)] font-medium text-[var(--brand)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--surface-2)]',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto flex items-center gap-3 px-4 py-4">
        <Avatar initials="ME" size="sm" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-xs font-medium text-[var(--text-primary)]">Mon Entreprise</span>
            <span className="inline-flex items-center rounded bg-[var(--surface-2)] px-1.5 py-0.5 text-[10px] font-medium uppercase leading-none text-[var(--text-secondary)]">
              TRIAL
            </span>
          </div>
        </div>
      </div>
    </aside>
  )
}
