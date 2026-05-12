'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Users, Server, ChevronLeft, ChevronRight,
  LogOut, Shield, Database, CreditCard, Kanban, Activity,
  MessageSquare, Workflow,
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
  { label: "Vue d'ensemble", href: '/admin', icon: LayoutDashboard, exact: true },
  { label: 'Clients', href: '/admin/clients', icon: Users, exact: false },
  { label: 'Système', href: '/admin/system', icon: Server, exact: false },
  { label: 'n8n', href: '/admin/n8n', icon: Workflow, exact: false },
  { label: 'Base de données', href: '/admin/database', icon: Database, exact: false, superAdminOnly: true },
  { label: 'Accès', href: '/admin/access', icon: Shield, exact: false, superAdminOnly: true },
]

const PLACEHOLDER_LINKS = [
  { label: 'Facturation', icon: CreditCard },
  { label: 'Onboarding', icon: Kanban },
  { label: 'Bot Monitor', icon: Activity },
  { label: 'Chatwoot', icon: MessageSquare },
]

export default function AdminSidebar({ adminUser }: AdminSidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [hovered, setHovered] = useState<string | null>(null)

  const activeLinks = ACTIVE_LINKS.filter(l => !l.superAdminOnly || adminUser.role === 'SUPER_ADMIN')

  function isActive(href: string, exact: boolean) {
    return exact ? pathname === href : pathname.startsWith(href)
  }

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 220 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      style={{
        minWidth: collapsed ? 64 : 220, height: '100vh',
        background: C.bg, borderRight: `1px solid ${C.border}`,
        display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0, overflow: 'hidden', zIndex: 20,
        boxShadow: '2px 0 12px rgba(13,27,46,0.04)',
      }}
    >
      {/* Logo */}
      <div style={{
        padding: collapsed ? '20px 0' : '20px 16px',
        display: 'flex', alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        borderBottom: `1px solid ${C.border}`, minHeight: 64,
      }}>
        <AnimatePresence mode="wait">
          {!collapsed ? (
            <motion.div key="full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
            </motion.div>
          ) : (
            <motion.div key="icon" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{
                width: 30, height: 30, borderRadius: 8,
                background: 'linear-gradient(135deg, #1a6bff 0%, #0047cc 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
              <Shield size={15} color="#fff" />
            </motion.div>
          )}
        </AnimatePresence>
        {!collapsed && (
          <button onClick={() => setCollapsed(true)} style={{
            background: 'transparent', border: `1px solid ${C.border}`,
            borderRadius: 6, width: 24, height: 24, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.mid,
          }}>
            <ChevronLeft size={13} />
          </button>
        )}
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
              {active && (
                <motion.div layoutId="activeNav" style={{
                  position: 'absolute', inset: 0, background: C.blueLight,
                  borderRadius: 8, zIndex: 0,
                }} transition={{ duration: 0.2 }} />
              )}
              <span style={{ position: 'relative', zIndex: 1, display: 'flex', flexShrink: 0 }}>
                <Icon size={16} />
              </span>
              <AnimatePresence>
                {!collapsed && (
                  <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }} transition={{ duration: 0.18 }}
                    style={{ position: 'relative', zIndex: 1, overflow: 'hidden', flex: 1 }}>
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          )
        })}

        {/* Separator + placeholders */}
        <div style={{ margin: '10px 4px 2px', display: 'flex', alignItems: 'center', gap: 6 }}>
          {!collapsed && (
            <span style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
              Bientôt
            </span>
          )}
          <div style={{ flex: 1, height: 1, background: C.border }} />
        </div>

        {PLACEHOLDER_LINKS.map(({ label, icon: Icon }) => (
          <div key={label} title={collapsed ? `${label} — bientôt` : undefined}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: collapsed ? '9px 0' : '9px 12px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              borderRadius: 8, fontSize: 13.5, color: C.muted,
              cursor: 'not-allowed', whiteSpace: 'nowrap', overflow: 'hidden',
            }}
          >
            <span style={{ display: 'flex', flexShrink: 0 }}><Icon size={16} /></span>
            <AnimatePresence>
              {!collapsed && (
                <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }} transition={{ duration: 0.18 }}
                  style={{ overflow: 'hidden', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>{label}</span>
                  <span style={{ fontSize: 9, fontWeight: 700, background: C.bgAlt, color: C.muted, padding: '1px 5px', borderRadius: 4, marginLeft: 4 }}>
                    SOON
                  </span>
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        ))}
      </nav>

      {/* Bottom user */}
      <div style={{
        padding: collapsed ? '12px 8px' : '12px 14px',
        borderTop: `1px solid ${C.border}`,
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        <AnimatePresence>
          {!collapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 10px', background: C.bgAlt, borderRadius: 8, overflow: 'hidden',
              }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: 'linear-gradient(135deg, #1a6bff 0%, #0047cc 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>
                  {(adminUser.name || adminUser.email).slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div style={{ overflow: 'hidden', flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {adminUser.name || adminUser.email}
                </div>
                <div style={{ fontSize: 10, color: C.mid }}>
                  {adminUser.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }} transition={{ duration: 0.18 }}
                style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
                Se déconnecter
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  )
}