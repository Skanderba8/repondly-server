'use client'

import { usePathname, useRouter } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import Image from 'next/image'
import {
  Home,
  MessageSquare,
  Calendar,
  Settings,
  LogOut,
} from 'lucide-react'
import { useTheme } from '@/lib/theme'
import ThemeToggle from '@/components/shell/ThemeToggle'

const NAV = [
  { href: '/dashboard/accueil', label: 'Accueil', icon: Home },
  { href: '/dashboard/messagerie', label: 'Messages', icon: MessageSquare },
  { href: '/dashboard/rendez-vous', label: 'Agenda', icon: Calendar },
  { href: '/dashboard/configuration', label: 'Config', icon: Settings },
]

interface SidebarProps {
  unreadCount?: number
  waConnected?: boolean
  fbConnected?: boolean
}

export default function Sidebar({
  unreadCount = 0,
  waConnected = false,
  fbConnected = false,
}: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const isDark = useTheme()

  const businessName = session?.user?.name ?? 'Mon Entreprise'
  const businessEmail = session?.user?.email ?? ''
  const initial = businessName.charAt(0).toUpperCase()

  return (
    <aside
      className="rp-sidebar"
      style={{
        background: 'var(--surface-0)',
        borderRight: '1px solid var(--surface-border)',
        height: '100%',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 40,
        transition: 'background 0.2s',
      }}
    >
      {/* Brand */}
      <div
        style={{
          padding: '20px 16px 14px',
          borderBottom: '1px solid var(--surface-border)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Image
            src="/logo.png"
            alt=""
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
      </div>

      {/* Nav links */}
      <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
        {NAV.map(({ href, label, icon: Icon }) => {
          const isActive =
            pathname === href ||
            (href !== '/dashboard/accueil' && pathname.startsWith(href))
          return (
            <button
              key={href}
              onClick={() => router.push(href)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 12px',
                borderRadius: 8,
                border: 'none',
                background: isActive
                  ? 'var(--brand-primary-soft)'
                  : 'transparent',
                color: isActive
                  ? 'var(--brand-primary)'
                  : 'var(--text-muted)',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                cursor: 'pointer',
                marginBottom: 2,
                transition: 'background 0.15s, color 0.15s',
                textAlign: 'left',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                if (!isActive)
                  (e.currentTarget as HTMLElement).style.background = isDark
                    ? 'rgba(255,255,255,0.06)'
                    : 'rgba(0,0,0,0.04)'
              }}
              onMouseLeave={(e) => {
                if (!isActive)
                  (e.currentTarget as HTMLElement).style.background =
                    'transparent'
              }}
            >
              {isActive && (
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: '20%',
                    bottom: '20%',
                    width: 3,
                    background: 'var(--brand-primary)',
                    borderRadius: '0 2px 2px 0',
                  }}
                />
              )}
              <Icon size={15} />
              <span>{label}</span>
              {label === 'Messages' && unreadCount > 0 && (
                <span
                  style={{
                    marginLeft: 'auto',
                    minWidth: 18,
                    height: 18,
                    background: 'var(--brand-danger)',
                    color: '#fff',
                    borderRadius: 9,
                    fontSize: 10,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 4px',
                  }}
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Channel status */}
      <div
        style={{
          padding: '10px 16px 8px',
          borderTop: '1px solid var(--surface-border)',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 10,
            fontWeight: 600,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: 8,
          }}
        >
          Canaux
        </div>
        {[
          {
            label: 'WhatsApp',
            connected: waConnected,
            color: 'var(--brand-success)',
          },
          {
            label: 'Facebook / Instagram',
            connected: fbConnected,
            color: 'var(--brand-primary)',
          },
        ].map((ch) => (
          <div
            key={ch.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 5,
            }}
          >
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                flexShrink: 0,
                background: ch.connected ? ch.color : 'var(--surface-border)',
                boxShadow: ch.connected
                  ? `0 0 6px ${ch.color}`
                  : 'none',
                transition: 'all 0.2s',
              }}
            />
            <span
              style={{
                fontSize: 11,
                fontFamily: "'DM Sans', sans-serif",
                color: ch.connected
                  ? 'var(--text-primary)'
                  : 'var(--text-muted)',
              }}
            >
              {ch.label}
            </span>
            <span
              style={{
                marginLeft: 'auto',
                fontSize: 10,
                color: ch.connected ? ch.color : 'var(--text-muted)',
                fontWeight: 500,
              }}
            >
              {ch.connected ? 'Connecté' : 'Inactif'}
            </span>
          </div>
        ))}
      </div>

      {/* Theme + Profile */}
      <div
        style={{
          padding: '8px 8px',
          borderTop: '1px solid var(--surface-border)',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '8px 12px',
            marginBottom: 4,
          }}
        >
          <span
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 12,
              color: 'var(--text-muted)',
              flex: 1,
            }}
          >
            {isDark ? 'Mode sombre' : 'Mode clair'}
          </span>
          <ThemeToggle />
        </div>

        {/* Business row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '8px 12px',
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              flexShrink: 0,
              background: 'var(--brand-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              fontWeight: 700,
              color: '#fff',
            }}
          >
            {initial}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 12,
                fontWeight: 500,
                color: 'var(--text-primary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {businessName}
            </div>
            <div
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 11,
                color: 'var(--text-muted)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {businessEmail}
            </div>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={() => signOut({ callbackUrl: '/auth/signin' })}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 14px',
            border: 'none',
            background: 'transparent',
            color: 'var(--brand-danger)',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13,
            cursor: 'pointer',
            borderRadius: 8,
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLElement).style.background =
              'rgba(255,59,48,0.08)')
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLElement).style.background = 'transparent')
          }
        >
          <LogOut size={14} /> Déconnexion
        </button>
      </div>
    </aside>
  )
}
