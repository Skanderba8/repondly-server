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
    <nav className="nx-bottomnav" aria-label="Navigation mobile">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.label}
            className={cn('nx-bottomnav-item', active && 'is-active')}
            aria-current={active ? 'page' : undefined}
          >
            <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
            <span className="truncate">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
