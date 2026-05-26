'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import ProfileSheet from '@/components/shell/ProfileSheet'

interface TopBarProps {
  title: string
  unreadCount?: number
}

export default function TopBar({ title, unreadCount = 0 }: TopBarProps) {
  const { data: session } = useSession()
  const [profileOpen, setProfileOpen] = useState(false)
  const name = session?.user?.name ?? 'Répondly'
  const initial = name.charAt(0).toUpperCase()

  return (
    <>
      <div
        className="rp-mobile-header"
        style={{
          background: 'var(--color-surface-glass, var(--color-surface))',
          backdropFilter: 'blur(32px) saturate(180%)',
          WebkitBackdropFilter: 'blur(32px) saturate(180%)',
          borderBottom: '1px solid var(--color-border)',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          paddingTop: 'env(safe-area-inset-top)',
        }}
      >
        <div style={{
          height: 'var(--topbar-height)',
          display: 'flex',
          alignItems: 'center',
          paddingLeft: 16,
          paddingRight: 12,
          position: 'relative',
        }}>
          <Image src="/logo.png" alt="Répondly" width={28} height={28} style={{ borderRadius: 7, flexShrink: 0 }} />

          <span style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: "'Syne', sans-serif",
            fontSize: 16,
            fontWeight: 700,
            color: 'var(--color-text)',
            letterSpacing: '-0.02em',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}>
            {title}
          </span>

          <div style={{ marginLeft: 'auto' }}>
            <button
              onClick={() => setProfileOpen(true)}
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'var(--color-accent)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
                fontWeight: 700,
                color: '#fff',
                position: 'relative',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                flexShrink: 0,
              }}
            >
              {initial}
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: -2,
                  right: -2,
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: 'var(--color-danger)',
                  color: '#fff',
                  fontSize: 9,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid var(--color-bg)',
                }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <ProfileSheet open={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
  )
}
