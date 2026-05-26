'use client'

import { usePathname, useRouter } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import {
  LayoutDashboard, MessageSquare, ShoppingBag, Settings,
  LogOut, ChevronDown,
} from 'lucide-react'
import { useTheme } from '@/lib/theme'
import TopBar from '@/components/shell/TopBar'
import IslandNav from '@/components/shell/IslandNav'
import ThemeToggle from '@/components/shell/ThemeToggle'

const NAV = [
  { href: '/dashboard/accueil',        label: 'Accueil',       icon: LayoutDashboard },
  { href: '/dashboard/messagerie',     label: 'Messagerie',    icon: MessageSquare },
  { href: '/dashboard/commandes',      label: 'Commandes',     icon: ShoppingBag },
  { href: '/dashboard/configuration',  label: 'Configuration', icon: Settings },
]

const PAGE_TITLES: Record<string, string> = {
  '/dashboard/accueil':       'Accueil',
  '/dashboard/messagerie':    'Messagerie',
  '/dashboard/commandes':     'Commandes',
  '/dashboard/configuration': 'Configuration',
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const isDark = useTheme()
  const [profileOpen, setProfileOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [waConnected, setWaConnected] = useState(false)
  const [fbConnected, setFbConnected] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)
  const sseRef = useRef<EventSource | null>(null)
  const shellRef = useRef<HTMLDivElement>(null)

  // Lock shell to visualViewport to prevent iOS phantom bottom bar
  useEffect(() => {
    const applyHeight = () => {
      const h = window.visualViewport?.height ?? window.innerHeight
      const w = window.visualViewport?.width ?? window.innerWidth
      if (shellRef.current) {
        shellRef.current.style.height = `${h}px`
        shellRef.current.style.width = `${w}px`
      }
    }
    applyHeight()
    window.visualViewport?.addEventListener('resize', applyHeight)
    window.addEventListener('resize', applyHeight)
    return () => {
      window.visualViewport?.removeEventListener('resize', applyHeight)
      window.removeEventListener('resize', applyHeight)
    }
  }, [])

  // SSE for real-time unread count
  useEffect(() => {
    sseRef.current = new EventSource('/api/sse')
    sseRef.current.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        if (data.type === 'new_message' || data.type === 'conversation_update') {
          setUnreadCount(prev => prev + 1)
        }
      } catch {}
    }
    return () => sseRef.current?.close()
  }, [])

  // Channel status
  useEffect(() => {
    Promise.all([
      fetch('/api/whatsapp/status').then(r => r.ok ? r.json() : null),
      fetch('/api/meta/pages').then(r => r.ok ? r.json() : null),
    ]).then(([wa, meta]) => {
      if (wa) setWaConnected(!!wa.whatsappConnected)
      if (meta) setFbConnected((meta.pages ?? []).some((p: { channel: string }) => p.channel === 'FACEBOOK' || p.channel === 'INSTAGRAM'))
    }).catch(() => {})
  }, [])

  // Close profile dropdown on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const businessName = session?.user?.name ?? 'Mon Entreprise'
  const businessEmail = session?.user?.email ?? ''
  const initial = businessName.charAt(0).toUpperCase()
  const pageTitle = PAGE_TITLES[pathname] ?? 'Répondly'
  const isThreadView = /^\/dashboard\/messagerie\/.+/.test(pathname)
  const isMsg = pathname.startsWith('/dashboard/messagerie')

  // ── Sidebar nav item ──────────────────────────────────────────────────────────
  const SidebarItem = ({ href, label, icon: Icon }: typeof NAV[0]) => {
    const isActive = pathname === href || (href !== '/dashboard/accueil' && pathname.startsWith(href))
    return (
      <button
        onClick={() => router.push(href)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          padding: '9px 12px', borderRadius: 8, border: 'none',
          background: isActive ? 'var(--color-accent-soft)' : 'transparent',
          color: isActive ? 'var(--color-accent)' : 'var(--color-text-3)',
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 13, fontWeight: isActive ? 600 : 400,
          cursor: 'pointer', marginBottom: 2,
          transition: 'background 0.15s, color 0.15s', textAlign: 'left', position: 'relative',
        }}
        onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}
        onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
      >
        {isActive && (
          <div style={{
            position: 'absolute', left: 0, top: '20%', bottom: '20%',
            width: 3, background: 'var(--color-accent)', borderRadius: '0 2px 2px 0',
          }} />
        )}
        <Icon size={15} />
        <span>{label}</span>
        {label === 'Messagerie' && unreadCount > 0 && (
          <span style={{
            marginLeft: 'auto', minWidth: 18, height: 18,
            background: 'var(--color-danger)', color: '#fff',
            borderRadius: 9, fontSize: 10, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px',
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
    )
  }

  return (
    <div ref={shellRef} className="rp-shell">

      {/* ── Desktop sidebar ──────────────────────────────────────────────────── */}
      <aside
        className="rp-sidebar"
        style={{
          background: 'var(--color-surface)',
          borderRight: '1px solid var(--color-border)',
          height: '100%', position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 40,
          transition: 'background 0.2s',
        }}
      >
        {/* Brand */}
        <div style={{ padding: '18px 16px 14px', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Image src="/logo.png" alt="" width={28} height={28} style={{ borderRadius: 7, flexShrink: 0 }} />
            <span style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 17, fontWeight: 700,
              color: 'var(--color-accent)',
              letterSpacing: '-0.01em', lineHeight: 1,
            }}>
              Répondly
            </span>
          </div>
        </div>

        {/* Nav links */}
        <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
          {NAV.map(item => <SidebarItem key={item.href} {...item} />)}
        </nav>

        {/* Channel status */}
        <div style={{ padding: '10px 16px 8px', borderTop: '1px solid var(--color-border)', flexShrink: 0 }}>
          <div style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 10, fontWeight: 600, color: 'var(--color-text-3)',
            textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8,
          }}>
            Canaux
          </div>
          {[
            { label: 'WhatsApp', connected: waConnected, color: 'var(--color-success)' },
            { label: 'Facebook / Instagram', connected: fbConnected, color: 'var(--color-accent)' },
          ].map(ch => (
            <div key={ch.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
              <div style={{
                width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                background: ch.connected ? ch.color : 'var(--color-border-2)',
                boxShadow: ch.connected ? `0 0 6px ${ch.color}` : 'none',
                transition: 'all 0.2s',
              }} />
              <span style={{ fontSize: 11, fontFamily: "'DM Sans', sans-serif", color: ch.connected ? 'var(--color-text)' : 'var(--color-text-3)' }}>
                {ch.label}
              </span>
              <span style={{ marginLeft: 'auto', fontSize: 10, color: ch.connected ? ch.color : 'var(--color-text-3)', fontWeight: 500 }}>
                {ch.connected ? 'Connecté' : 'Inactif'}
              </span>
            </div>
          ))}
        </div>

        {/* Theme + Profile */}
        <div style={{ padding: '8px 8px', borderTop: '1px solid var(--color-border)', flexShrink: 0 }} ref={profileRef}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', marginBottom: 4 }}>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'var(--color-text-3)', flex: 1 }}>
              {isDark ? 'Mode sombre' : 'Mode clair'}
            </span>
            <ThemeToggle />
          </div>
          <button
            onClick={() => setProfileOpen(o => !o)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 10px', borderRadius: 8, border: 'none',
              background: profileOpen ? 'var(--color-accent-soft)' : 'transparent',
              cursor: 'pointer',
            }}
            onMouseEnter={e => { if (!profileOpen) (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}
            onMouseLeave={e => { if (!profileOpen) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
          >
            <div style={{
              width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
              background: 'var(--color-accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, color: '#fff',
            }}>
              {initial}
            </div>
            <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 500, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {businessName}
              </div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'var(--color-text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {businessEmail}
              </div>
            </div>
            <ChevronDown
              size={14}
              color="var(--color-text-3)"
              style={{ flexShrink: 0, transform: profileOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}
            />
          </button>
          {profileOpen && (
            <div style={{
              marginTop: 4,
              background: 'var(--color-surface-2)',
              border: '1px solid var(--color-border)',
              borderRadius: 8, overflow: 'hidden',
            }}>
              <button
                onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', border: 'none', background: 'transparent', color: 'var(--color-danger)', fontFamily: "'DM Sans', sans-serif", fontSize: 13, cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,59,48,0.08)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
              >
                <LogOut size={14} /> Déconnexion
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ── Mobile top bar (via TopBar component) ────────────────────────────── */}
      {!isThreadView && <TopBar title={pageTitle} unreadCount={unreadCount} />}

      {/* ── Content area ─────────────────────────────────────────────────────── */}
      <main
        className={`rp-content${isMsg && !isThreadView ? ' rp-msg' : ''}${isThreadView ? ' rp-fullscreen' : ''}`}
        style={{ marginLeft: 0, background: 'var(--color-bg)' }}
      >
        <style>{`@media (min-width: 768px) { .rp-content { margin-left: 240px !important; } }`}</style>
        {children}
      </main>

      {/* ── Mobile island nav (via IslandNav component) ───────────────────────── */}
      <IslandNav unreadCount={unreadCount} />

    </div>
  )
}
