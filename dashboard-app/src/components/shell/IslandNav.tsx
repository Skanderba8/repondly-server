'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, MessageSquare, ShoppingBag, Settings } from 'lucide-react'
import { motion } from 'framer-motion'

const NAV = [
  { href: '/dashboard/accueil',        label: 'Accueil',    icon: LayoutDashboard },
  { href: '/dashboard/messagerie',     label: 'Messagerie', icon: MessageSquare },
  { href: '/dashboard/commandes',      label: 'Commandes',  icon: ShoppingBag },
  { href: '/dashboard/configuration',  label: 'Config',     icon: Settings },
]

interface IslandNavProps {
  unreadCount?: number
}

export default function IslandNav({ unreadCount = 0 }: IslandNavProps) {
  const pathname = usePathname()

  const isThreadView = /^\/dashboard\/messagerie\/.+/.test(pathname)
  if (isThreadView) return null

  return (
    <div
      className="rp-mobile-nav"
    >
      <div style={{
        background: 'var(--color-surface-glass)',
        backdropFilter: 'blur(40px) saturate(200%)',
        WebkitBackdropFilter: 'blur(40px) saturate(200%)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-island)',
        display: 'flex',
        alignItems: 'center',
        padding: '6px 8px',
        boxShadow: 'var(--shadow-island)',
        gap: 4,
        maxWidth: 420,
        margin: '0 auto',
      }}>
        {NAV.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== '/dashboard/accueil' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
                padding: '8px 4px',
                borderRadius: 20,
                position: 'relative',
                minWidth: 0,
                textDecoration: 'none',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {isActive && (
                <motion.div
                  layoutId="island-pill"
                  style={{
                    position: 'absolute',
                    inset: '2px',
                    borderRadius: 18,
                    background: 'var(--color-accent-soft)',
                    zIndex: 0,
                  }}
                  transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                />
              )}

              <div style={{ position: 'relative', zIndex: 1 }}>
                <Icon
                  size={20}
                  color={isActive ? 'var(--color-accent)' : 'var(--color-text-3)'}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
                {label === 'Messagerie' && unreadCount > 0 && !isActive && (
                  <span style={{
                    position: 'absolute',
                    top: -3,
                    right: -5,
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    background: 'var(--color-danger)',
                    color: '#fff',
                    fontSize: 8,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>

              <span style={{
                fontSize: 9,
                fontWeight: isActive ? 600 : 500,
                color: isActive ? 'var(--color-accent)' : 'var(--color-text-3)',
                zIndex: 1,
                lineHeight: 1,
                fontFamily: "'DM Sans', sans-serif",
              }}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
