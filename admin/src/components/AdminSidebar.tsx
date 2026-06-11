'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useState } from 'react'
import {
  LayoutDashboard, Users, Server, ChevronLeft, ChevronRight,
  LogOut, Shield, Database,
} from 'lucide-react'

const C = {
  bg: '#ffffff', bgAlt: '#f4f7fb', blue: '#1a6bff', blueLight: '#e8f0ff',
  ink: '#0d1b2e', mid: '#5a6a80', border: '#e2e8f0', hover: '#f8faff',
  muted: '#c8d0dc',
}

interface AdminSidebarProps {
  adminUser: { email: string; name: string; role: 'SUPER_ADMIN' | 'ADMIN' }
}

const ACTIVE_LINKS = [
  { label: "Vue d'ensemble", href: '/', icon: LayoutDashboard, exact: true },
  { label: 'Clients', href: '/clients', icon: Users, exact: false },
  { label: 'Système', href: '/system', icon: Server, exact: false },
  { label: 'Base de données', href: '/database', icon: Database, exact: false, superAdminOnly: true },
  { label: 'Accès', href: '/access', icon: Shield, exact: false, superAdminOnly: true },
]

export default function AdminSidebar({ adminUser }: AdminSidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [hovered, setHovered] = useState<string | null>(null)

  const activeLinks = ACTIVE_LINKS.filter(l => !l.superAdminOnly || (adminUser && adminUser.role === 'SUPER_ADMIN'))

  function isActive(href: string, exact: boolean) {
    return exact ? pathname === href : pathname.startsWith(href)
  }

  return (
    <aside
      style={{
        width: collapsed ? 64 : 220, minWidth: collapsed ? 64 : 220,
        height: '100vh',
        background: C.bg, borderRight: `1px solid ${C.border}`,
        display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0, overflow: 'hidden', zIndex: 20,
        boxShadow: '2px 0 12px rgba(13,27,46,0.04)',
        transition: 'width 0.25s ease, min-width 0.25s ease',
      }}
    >
      {/* Logo */}
      <div style={{
        padding: collapsed ? '20px 0' : '20px 16px',
        display: 'flex', alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        borderBottom: `1px solid ${C.border}`, minHeight: 64,
      }}>
        {!collapsed ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: 'linear-gradient(135deg, #1a6bff 0%, #0047cc 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Shield size={15} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: C.ink, lineHeight: 1.2 }}>Répondly</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#ff3b30', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Admin</div>
            </div>
          </div>
        ) : (
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: 'linear-gradient(135deg, #1a6bff 0%, #0047cc 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Shield size={15} color="#fff" />
          </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)} style={{
          background: 'transparent', border: `1px solid ${C.border}`,
          borderRadius: 6, width: 24, height: 24, cursor: 'pointer',
          display: collapsed ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', color: C.mid,
        }}>
          <ChevronLeft size={13} />
        </button>
        {collapsed && (
          <button onClick={() => setCollapsed(false)} style={{
            background: 'transparent', border: `1px solid ${C.border}`,
            borderRadius: 6, width: 24, height: 24, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.mid,
          }}>
            <ChevronRight size={13} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav style={{
        flex: 1, padding: collapsed ? '8px 8px' : '8px 10px',
        display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto',
      }}>
        {activeLinks.map(({ label, href, icon: Icon, exact }) => {
          const active = isActive(href, exact)
          const isHovered = hovered === href
          return (
            <Link key={href} href={href} title={collapsed ? label : undefined}
              onMouseEnter={() => setHovered(href)} onMouseLeave={() => setHovered(null)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: collapsed ? '9px 0' : '9px 12px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                borderRadius: 8, textDecoration: 'none', fontSize: 13.5,
                fontWeight: active ? 600 : 400,
                background: active ? C.blueLight : isHovered ? C.hover : 'transparent',
                color: active ? C.blue : isHovered ? C.ink : C.mid,
                transition: 'background 0.15s, color 0.15s',
                position: 'relative', whiteSpace: 'nowrap', overflow: 'hidden',
              }}
            >
              <span style={{ display: 'flex', flexShrink: 0 }}>
                <Icon size={16} />
              </span>
              {!collapsed && (
                <span style={{ overflow: 'hidden', flex: 1 }}>
                  {label}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom user */}
      <div style={{
        padding: collapsed ? '12px 8px' : '12px 14px',
        borderTop: `1px solid ${C.border}`,
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        {!collapsed && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 10px', background: C.bgAlt, borderRadius: 8, overflow: 'hidden',
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'linear-gradient(135deg, #1a6bff 0%, #0047cc 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>
                {(adminUser?.name || adminUser?.email || 'U').slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {adminUser?.name || adminUser?.email || 'Loading...'}
              </div>
              <div style={{ fontSize: 10, color: C.mid }}>
                {adminUser?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
              </div>
            </div>
          </div>
        )}
        <button onClick={() => signOut({ callbackUrl: '/auth/signin' })}
          title={collapsed ? 'Se déconnecter' : undefined}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start',
            gap: 8, background: 'transparent', border: `1px solid ${C.border}`,
            borderRadius: 7, padding: collapsed ? '8px 0' : '7px 10px',
            fontSize: 13, color: C.mid, cursor: 'pointer', width: '100%',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { const el = e.currentTarget as HTMLButtonElement; el.style.background = '#fff1f0'; el.style.color = '#dc2626'; el.style.borderColor = '#fca5a5' }}
          onMouseLeave={e => { const el = e.currentTarget as HTMLButtonElement; el.style.background = 'transparent'; el.style.color = C.mid; el.style.borderColor = C.border }}
        >
          <LogOut size={14} />
          {!collapsed && <span>Se déconnecter</span>}
        </button>
      </div>
    </aside>
  )
}
