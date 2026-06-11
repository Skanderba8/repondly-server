'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, MessageSquare, Calendar, Settings } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/dashboard/accueil', label: 'Accueil', icon: Home },
  { href: '/dashboard/messagerie', label: 'Messages', icon: MessageSquare },
  { href: '/dashboard/rendez-vous', label: 'Agenda', icon: Calendar },
  { href: '/dashboard/configuration', label: 'Config', icon: Settings },
]

interface IslandNavProps {
  unreadCount?: number
}

export default function IslandNav({ unreadCount = 0 }: IslandNavProps) {
  const pathname = usePathname()

  const isThreadView = /^\/dashboard\/messagerie\/.+/.test(pathname)
  if (isThreadView) return null

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 50,
        width: 'calc(100% - 32px)',
        maxWidth: '420px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          backgroundColor: 'var(--surface-0)',
          border: '1px solid var(--surface-border)',
          borderRadius: 'var(--radius-xl)',
          padding: '8px 12px',
          boxShadow: 'var(--shadow-overlay)',
          backdropFilter: 'blur(12px)',
        }}
      >
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname.startsWith(href)
          const isMessages = href.includes('messagerie')

          return (
            <Link
              key={href}
              href={href}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '3px',
                padding: '8px 16px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: isActive
                  ? 'var(--brand-primary-soft)'
                  : 'transparent',
                transition: 'all var(--transition-fast)',
                position: 'relative',
                textDecoration: 'none',
                minWidth: '56px',
              }}
            >
              <div style={{ position: 'relative' }}>
                <Icon
                  size={22}
                  style={{
                    color: isActive
                      ? 'var(--brand-primary)'
                      : 'var(--text-muted)',
                    transition: 'color var(--transition-fast)',
                  }}
                />
                {isMessages && unreadCount > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-6px',
                      backgroundColor: 'var(--brand-danger)',
                      color: 'white',
                      fontSize: '10px',
                      fontWeight: 700,
                      borderRadius: 'var(--radius-pill)',
                      minWidth: '16px',
                      height: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 4px',
                    }}
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: isActive ? 600 : 400,
                  color: isActive
                    ? 'var(--brand-primary)'
                    : 'var(--text-muted)',
                  transition: 'color var(--transition-fast)',
                }}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
