'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { Bell } from 'lucide-react'
import ThemeToggle from '@/components/shell/ThemeToggle'
import ProfileSheet from '@/components/shell/ProfileSheet'

interface TopBarProps {
  unreadCount?: number
}

export default function TopBar({ unreadCount = 0 }: TopBarProps) {
  const { data: session } = useSession()
  const [profileOpen, setProfileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const businessName = session?.user?.name ?? 'Mon Entreprise'
  const initial = businessName.charAt(0).toUpperCase()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <div
        className="rp-mobile-header"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          paddingTop: 'env(safe-area-inset-top)',
          background: 'var(--surface-0)',
          borderBottom: '1px solid var(--surface-border)',
          boxShadow: scrolled
            ? '0 2px 8px rgba(0,0,0,0.06)'
            : 'none',
          transition: 'box-shadow var(--transition-fast)',
        }}
      >
        <div
          style={{
            height: 'var(--topbar-height)',
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 16,
            paddingRight: 12,
            gap: 12,
          }}
        >
          {/* Logo + business name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <Image
              src="/logo.png"
              alt="Répondly"
              width={28}
              height={28}
              style={{ borderRadius: 7, flexShrink: 0 }}
            />
            <span
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 16,
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '-0.01em',
                whiteSpace: 'nowrap',
              }}
            >
              {businessName}
            </span>
          </div>

          {/* Right actions */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Notification bell */}
            <button
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                flexShrink: 0,
              }}
              aria-label="Notifications"
            >
              <Bell size={20} color="var(--text-muted)" />
              {unreadCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: 2,
                    right: 2,
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: 'var(--brand-danger)',
                  }}
                />
              )}
            </button>

            {/* Theme toggle */}
            <ThemeToggle />

            {/* Avatar */}
            <button
              onClick={() => setProfileOpen(true)}
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'var(--brand-primary)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
                fontWeight: 700,
                color: '#fff',
                flexShrink: 0,
              }}
              aria-label="Profil"
            >
              {initial}
            </button>
          </div>
        </div>
      </div>

      <ProfileSheet open={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
  )
}
