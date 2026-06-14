'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Clock, Inbox, Settings, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

const items = [
  { href: '/inbox', label: 'Inbox', icon: Inbox },
  { href: '/followups', label: 'Relances', icon: Clock },
  { href: '/contacts', label: 'Contacts', icon: Users },
  { href: '/settings', label: 'Réglages', icon: Settings },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="rp-bottom-nav" aria-label="Navigation mobile">
      <div className="rp-bottom-nav-inner">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              className={cn('rp-bottom-nav-link', active && 'is-active')}
              aria-current={active ? 'page' : undefined}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span className="truncate">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
