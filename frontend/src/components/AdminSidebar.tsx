'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard,
  Users,
  Kanban,
  Activity,
  CreditCard,
  Server,
} from 'lucide-react'

const C = {
  bg: '#ffffff',
  bgAlt: '#f4f7fb',
  blue: '#1a6bff',
  blueLight: '#e8f0ff',
  ink: '#0d1b2e',
  mid: '#5a6a80',
  border: '#e2e8f0',
}

const navLinks = [
  { label: "Vue d'ensemble", href: '/admin', icon: LayoutDashboard, exact: true },
  { label: 'Clients', href: '/admin/clients', icon: Users, exact: false },
  { label: 'Onboarding', href: '/admin/onboarding', icon: Kanban, exact: false },
  { label: 'Bot Monitor', href: '/admin/bot', icon: Activity, exact: false },
  { label: 'Facturation', href: '/admin/billing', icon: CreditCard, exact: false },
  { label: 'Système', href: '/admin/system', icon: Server, exact: false },
]

export default function AdminSidebar({ adminEmail }: { adminEmail: string }) {
  const pathname = usePathname()

  function isActive(href: string, exact: boolean) {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <aside
      style={{
        width: 220,
        minWidth: 220,
        height: '100vh',
        background: C.bg,
        borderRight: `1px solid ${C.border}`,
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
      }}
    >
      {/* Logo */}
      <div style={{ padding: '24px 20px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontWeight: 700, fontSize: 18, color: C.ink }}>Répondly</span>
        <span
          style={{
            background: '#ff3b30',
            color: '#fff',
            fontSize: 10,
            fontWeight: 700,
            borderRadius: 4,
            padding: '2px 6px',
            letterSpacing: '0.05em',
          }}
        >
          Admin
        </span>
      </div>

      {/* Nav links */}
      <nav style={{ flex: 1, padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {navLinks.map(({ label, href, icon: Icon, exact }) => {
          const active = isActive(href, exact)
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 12px',
                borderRadius: 8,
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: active ? 600 : 400,
                background: active ? C.blueLight : 'transparent',
                color: active ? C.blue : C.mid,
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              <Icon size={16} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom section */}
      <div
        style={{
          padding: '16px 20px',
          borderTop: `1px solid ${C.border}`,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <span style={{ fontSize: 11, color: C.mid, wordBreak: 'break-all' }}>{adminEmail}</span>
        <button
          onClick={() => signOut({ callbackUrl: '/auth/signin' })}
          style={{
            background: 'transparent',
            border: `1px solid ${C.border}`,
            borderRadius: 6,
            padding: '6px 12px',
            fontSize: 13,
            color: C.mid,
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          Se déconnecter
        </button>
      </div>
    </aside>
  )
}
