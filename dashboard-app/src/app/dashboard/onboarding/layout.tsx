'use client'

import Image from 'next/image'
import { signOut } from 'next-auth/react'
import { LogOut } from 'lucide-react'

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        minHeight: '100dvh',
        backgroundColor: 'var(--surface-1)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header: logo + logout */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          paddingTop: 'calc(16px + env(safe-area-inset-top, 0px))',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
              fontSize: 17,
              fontWeight: 700,
              color: 'var(--brand-primary)',
              letterSpacing: '-0.01em',
              lineHeight: 1,
            }}
          >
            Répondly
          </span>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/auth/signin' })}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13,
            cursor: 'pointer',
            padding: '6px 10px',
            borderRadius: 8,
          }}
        >
          <LogOut size={14} />
          <span className="hidden sm:inline">Se déconnecter</span>
        </button>
      </div>

      {/* Wizard content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  )
}
