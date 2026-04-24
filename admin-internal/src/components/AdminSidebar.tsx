'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Users,
  Kanban,
  Activity,
  CreditCard,
  Server,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Shield,
} from 'lucide-react'

const C = {
  bg: '#ffffff',
  bgAlt: '#f4f7fb',
  blue: '#1a6bff',
  blueLight: '#e8f0ff',
  ink: '#0d1b2e',
  mid: '#5a6a80',
  border: '#e2e8f0',
  hover: '#f8faff',
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
  const [collapsed, setCollapsed] = useState(false)
  const [hoveredHref, setHoveredHref] = useState<string | null>(null)

  function isActive(href: string, exact: boolean) {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 220 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      style={{
        minWidth: collapsed ? 64 : 220,
        height: '100vh',
        background: C.bg,
        borderRight: `1px solid ${C.border}`,
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        overflow: 'hidden',
        zIndex: 20,
        boxShadow: '2px 0 12px rgba(13,27,46,0.04)',
      }}
    >
      {/* Logo */}
      <div style={{
        padding: collapsed ? '20px 0' : '20px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        borderBottom: `1px solid ${C.border}`,
        minHeight: 64,
      }}>
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              key="logo-full"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.18 }}
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <div style={{
                width: 30, height: 30, borderRadius: 8,
                background: 'linear-gradient(135deg, #1a6bff 0%, #0047cc 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Shield size={15} color="#fff" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: C.ink, lineHeight: 1.2 }}>Répondly</div>
                <div style={{
                  fontSize: 10, fontWeight: 700, color: '#ff3b30',
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                }}>Admin</div>
              </div>
            </motion.div>
          )}
          {collapsed && (
            <motion.div
              key="logo-icon"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.18 }}
              style={{
                width: 30, height: 30, borderRadius: 8,
                background: 'linear-gradient(135deg, #1a6bff 0%, #0047cc 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Shield size={15} color="#fff" />
            </motion.div>
          )}
        </AnimatePresence>

        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            style={{
              background: 'transparent', border: `1px solid ${C.border}`,
              borderRadius: 6, width: 24, height: 24, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: C.mid, flexShrink: 0,
            }}
          >
            <ChevronLeft size={13} />
          </button>
        )}
      </div>

      {/* Expand button when collapsed */}
      {collapsed && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
          <button
            onClick={() => setCollapsed(false)}
            style={{
              background: 'transparent', border: `1px solid ${C.border}`,
              borderRadius: 6, width: 24, height: 24, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: C.mid,
            }}
          >
            <ChevronRight size={13} />
          </button>
        </div>
      )}

      {/* Nav */}
      <nav style={{
        flex: 1,
        padding: collapsed ? '8px 8px' : '8px 10px',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        overflowY: 'auto',
      }}>
        {navLinks.map(({ label, href, icon: Icon, exact }) => {
          const active = isActive(href, exact)
          const hovered = hoveredHref === href
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              onMouseEnter={() => setHoveredHref(href)}
              onMouseLeave={() => setHoveredHref(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: collapsed ? '9px 0' : '9px 12px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                borderRadius: 8,
                textDecoration: 'none',
                fontSize: 13.5,
                fontWeight: active ? 600 : 400,
                background: active ? C.blueLight : hovered && !active ? C.hover : 'transparent',
                color: active ? C.blue : hovered ? C.ink : C.mid,
                transition: 'background 0.15s, color 0.15s',
                position: 'relative',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
              }}
            >
              {active && (
                <motion.div
                  layoutId="activeNav"
                  style={{
                    position: 'absolute', inset: 0,
                    background: C.blueLight,
                    borderRadius: 8,
                    zIndex: 0,
                  }}
                  transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                />
              )}
              <span style={{ position: 'relative', zIndex: 1, display: 'flex', flexShrink: 0 }}>
                <Icon size={16} />
              </span>
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.18 }}
                    style={{ position: 'relative', zIndex: 1, overflow: 'hidden' }}
                  >
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div style={{
        padding: collapsed ? '12px 8px' : '12px 14px',
        borderTop: `1px solid ${C.border}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 10px',
                background: C.bgAlt,
                borderRadius: 8,
                overflow: 'hidden',
              }}
            >
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: 'linear-gradient(135deg, #1a6bff 0%, #0047cc 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>
                  {adminEmail.slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div style={{ overflow: 'hidden', flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {adminEmail}
                </div>
                <div style={{ fontSize: 10, color: C.mid }}>Administrateur</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => signOut({ callbackUrl: '/auth/signin' })}
          title={collapsed ? 'Se déconnecter' : undefined}
          style={{
            display: 'flex', alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: 8,
            background: 'transparent',
            border: `1px solid ${C.border}`,
            borderRadius: 7,
            padding: collapsed ? '8px 0' : '7px 10px',
            fontSize: 13,
            color: C.mid,
            cursor: 'pointer',
            width: '100%',
            transition: 'background 0.15s, color 0.15s, border-color 0.15s',
          }}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLButtonElement
            el.style.background = '#fff1f0'
            el.style.color = '#dc2626'
            el.style.borderColor = '#fca5a5'
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLButtonElement
            el.style.background = 'transparent'
            el.style.color = C.mid
            el.style.borderColor = C.border
          }}
        >
          <LogOut size={14} />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.18 }}
                style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}
              >
                Se déconnecter
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  )
}
