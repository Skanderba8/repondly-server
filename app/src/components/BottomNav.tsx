'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Clock, MessageSquare, Settings, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

const items = [
  { href: '/inbox', label: 'Inbox', icon: MessageSquare },
  { href: '/followups', label: 'Relances', icon: Clock },
  { href: '/contacts', label: 'Contacts', icon: Users },
  { href: '/settings', label: 'Paramètres', icon: Settings },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-14 border-t border-[var(--border)] bg-white md:hidden">
      <div className="flex h-full items-center">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              className={cn(
                'flex h-full flex-1 items-center justify-center transition-colors duration-100',
                active ? 'text-[var(--brand)]' : 'text-[var(--text-muted)]',
              )}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
