/* eslint-disable react-hooks/set-state-in-effect */
'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect } from 'react'

const C = {
  bg: '#ffffff',
  bgAlt: '#f4f7fb',
  blue: '#1a6bff',
  ink: '#0d1b2e',
  mid: '#5a6a80',
  border: '#e2e8f0',
}

const navLinks = [
  { href: '/privacy', label: 'Politique de Confidentialité' },
  { href: '/terms', label: 'Conditions Générales' },
  { href: '/sla', label: 'Service Level Agreement' },
]

interface LegalShellProps {
  children: React.ReactNode
}

export default function LegalShell({ children }: LegalShellProps) {
  const pathname = usePathname()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)')
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      background: C.bgAlt,
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        maxWidth: 1100,
        margin: '0 auto',
        width: '100%',
        padding: isMobile ? '0' : '40px 24px',
        gap: isMobile ? 0 : 32,
        boxSizing: 'border-box',
      }}>
        {/* Sidebar / Top nav */}
        <nav style={{
          width: isMobile ? '100%' : 220,
          flexShrink: 0,
          background: C.bg,
          borderRadius: isMobile ? 0 : 12,
          border: `1px solid ${C.border}`,
          padding: isMobile ? '12px 16px' : '24px 16px',
          display: 'flex',
          flexDirection: isMobile ? 'row' : 'column',
          gap: isMobile ? 4 : 4,
          alignSelf: isMobile ? 'auto' : 'flex-start',
          position: isMobile ? 'static' : 'sticky',
          top: isMobile ? 'auto' : 40,
          overflowX: isMobile ? 'auto' : 'visible',
          boxSizing: 'border-box',
        }}>
          {!isMobile && (
            <div style={{
              fontSize: 11,
              fontWeight: 700,
              color: C.mid,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 8,
              paddingLeft: 10,
            }}>
              Informations légales
            </div>
          )}
          {navLinks.map(({ href, label }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                style={{
                  display: 'block',
                  padding: isMobile ? '7px 12px' : '9px 10px',
                  borderRadius: 8,
                  textDecoration: 'none',
                  fontSize: 13.5,
                  fontWeight: active ? 600 : 400,
                  color: active ? C.blue : C.mid,
                  background: active ? '#e8f0ff' : 'transparent',
                  whiteSpace: isMobile ? 'nowrap' : 'normal',
                  transition: 'background 0.15s, color 0.15s',
                  flexShrink: 0,
                }}
                onMouseEnter={e => {
                  if (!active) {
                    const el = e.currentTarget as HTMLAnchorElement
                    el.style.background = C.bgAlt
                    el.style.color = C.ink
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    const el = e.currentTarget as HTMLAnchorElement
                    el.style.background = 'transparent'
                    el.style.color = C.mid
                  }
                }}
              >
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Main content */}
        <main style={{
          flex: 1,
          background: C.bg,
          borderRadius: isMobile ? 0 : 12,
          border: isMobile ? 'none' : `1px solid ${C.border}`,
          borderTop: isMobile ? `1px solid ${C.border}` : undefined,
          padding: isMobile ? '24px 16px' : '40px 48px',
          minWidth: 0,
          boxSizing: 'border-box',
        }}>
          {children}
        </main>
      </div>

      {/* Compliance footer */}
      <footer style={{
        borderTop: `1px solid ${C.border}`,
        background: C.bg,
        padding: '16px 24px',
        textAlign: 'center',
        fontSize: 12,
        color: C.mid,
      }}>
        Propulsé par Répondly — Traitement des données conforme à la Loi tunisienne n° 2004-63.
      </footer>
    </div>
  )
}
