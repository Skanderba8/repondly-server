'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Clock3, MessageSquareText, Settings2, Users2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const items = [
  { href: '/inbox', label: 'Inbox', icon: MessageSquareText },
  { href: '/followups', label: 'Relances', icon: Clock3 },
  { href: '/contacts', label: 'Contacts', icon: Users2 },
  { href: '/settings', label: 'Paramètres', icon: Settings2 },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-3 pb-[calc(12px+env(safe-area-inset-bottom))] md:hidden">
      <div className="pointer-events-auto flex w-full max-w-sm items-center gap-1 rounded-[4px] border border-[color:var(--surface-border)] bg-[color:var(--surface-0)]/94 p-1 shadow-[var(--shadow-overlay)] backdrop-blur">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              className={cn('rp-mobile-nav-link', active && 'is-active')}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span className="text-[11px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
