'use client'

import { usePathname, useRouter } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { createContext, useContext, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import {
  LayoutDashboard, MessageSquare, ShoppingBag, Settings,
  LogOut, ChevronDown, Sun, Moon,
} from 'lucide-react'

const MobileNavContext = createContext<{ hideNav: boolean; setHideNav: (hide: boolean) => void }>({
  hideNav: false,
  setHideNav: () => {},
})

export const useMobileNav = () => useContext(MobileNavContext)

const NAV = [
  { href: '/dashboard/accueil',        label: 'Accueil',       icon: LayoutDashboard },
  { href: '/dashboard/messagerie',     label: 'Messagerie',    icon: MessageSquare },
  { href: '/dashboard/commandes',      label: 'Commandes',     icon: ShoppingBag },
  { href: '/dashboard/configuration',  label: 'Configuration', icon: Settings },
]

function useTheme() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  useEffect(() => {
    const stored = (localStorage.getItem('rp_theme') as 'dark' | 'light') || 'dark'
    setTheme(stored)
    document.documentElement.setAttribute('data-theme', stored)
  }, [])

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('rp_theme', next)
    document.documentElement.setAttribute('data-theme', next)
  }

  return { theme, toggle }
}

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
  const { theme, toggle } = useTheme()
  const [profileOpen, setProfileOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [waConnected, setWaConnected] = useState(false)
  const [fbConnected, setFbConnected] = useState(false)
  const [hideNav, setHideNav] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)
  const sseRef = useRef<EventSource | null>(null)

  const isDark = theme === 'dark'

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
      if (meta) setFbConnected((meta.pages || []).some((p: any) => p.channel === 'FACEBOOK' || p.channel === 'INSTAGRAM'))
    }).catch(() => {})
  }, [])

  // Close profile on outside click
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
  const isMsg = pathname === '/dashboard/messagerie'

  // ── Color tokens ─────────────────────────────────────────────────────────────
  const sidebarBg     = isDark ? '#1C1C1E'                 : '#FFFFFF'
  const sidebarBorder = isDark ? '#38383A'                 : '#C6C6C8'
  const textPrimary   = isDark ? '#FFFFFF'                 : '#000000'
  const textMuted     = isDark ? '#8E8E93'                 : '#8E8E93'
  const textSub       = isDark ? '#8E8E93'                 : '#8E8E93'
  const hoverBg       = isDark ? 'rgba(255,255,255,0.08)'  : 'rgba(0,0,0,0.05)'
  const activeBg      = isDark ? 'rgba(10,132,255,0.15)'   : 'rgba(0,122,255,0.1)'
  const dropdownBg    = isDark ? '#161622'                 : '#F8FAFC'
  const navIslandBg   = isDark ? 'rgba(28,28,30,0.85)'    : 'rgba(255,255,255,0.85)'
  const navIslandBorder = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'
  const topBarBg      = isDark ? 'rgba(28,28,30,0.85)'    : 'rgba(255,255,255,0.85)'
  const topBarBorder  = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'

  // ── Shared sidebar nav item ───────────────────────────────────────────────────
  const SidebarItem = ({ href, label, icon: Icon }: typeof NAV[0]) => {
    const isActive = pathname === href || (href !== '/dashboard/accueil' && pathname.startsWith(href))
    return (
      <button
        onClick={() => router.push(href)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          padding: '9px 12px', borderRadius: 8, border: 'none',
          background: isActive ? activeBg : 'transparent',
          color: isActive ? '#3B82F6' : textMuted,
          fontSize: 13, fontWeight: isActive ? 600 : 400,
          cursor: 'pointer', marginBottom: 2,
          transition: 'background 0.15s, color 0.15s', textAlign: 'left', position: 'relative',
        }}
        onMouseEnter={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = hoverBg; (e.currentTarget as HTMLElement).style.color = isDark ? '#94A3B8' : '#475569' } }}
        onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = textMuted } }}
      >
        {isActive && <div style={{ position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 3, background: '#3B82F6', borderRadius: '0 2px 2px 0' }} />}
        <Icon size={15} />
        <span>{label}</span>
        {label === 'Messagerie' && unreadCount > 0 && (
          <span style={{ marginLeft: 'auto', minWidth: 18, height: 18, background: '#EF4444', color: '#fff', borderRadius: 9, fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
    )
  }

  return (
    <MobileNavContext.Provider value={{ hideNav, setHideNav }}>
      <div className="rp-shell" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* ── Desktop sidebar ─────────────────────────────────────────────────── */}
      <aside
        className="rp-sidebar"
        style={{
          background: sidebarBg, borderRight: `1px solid ${sidebarBorder}`,
          height: '100dvh', position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 40,
          transition: 'background 0.2s',
        }}
      >
        {/* Brand */}
        <div style={{ padding: '18px 16px 14px', borderBottom: `1px solid ${sidebarBorder}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Image src="/logo.png" alt="" width={28} height={28} style={{ borderRadius: 7, flexShrink: 0 }} />
            <span style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 17, fontWeight: 400, color: textPrimary, letterSpacing: '-0.01em', lineHeight: 1 }}>
              Répondly
            </span>
          </div>
        </div>

        {/* Nav links */}
        <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
          {NAV.map(item => <SidebarItem key={item.href} {...item} />)}
        </nav>

        {/* Channel status */}
        <div style={{ padding: '10px 16px 8px', borderTop: `1px solid ${sidebarBorder}`, flexShrink: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Canaux</div>
          {[{ label: 'WhatsApp', connected: waConnected, color: '#22C55E' }, { label: 'Facebook / Instagram', connected: fbConnected, color: '#3B82F6' }].map(ch => (
            <div key={ch.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, background: ch.connected ? ch.color : (isDark ? '#334155' : '#CBD5E1'), boxShadow: ch.connected ? `0 0 6px ${ch.color}80` : 'none', transition: 'all 0.2s' }} />
              <span style={{ fontSize: 11, color: ch.connected ? textPrimary : textMuted }}>{ch.label}</span>
              <span style={{ marginLeft: 'auto', fontSize: 10, color: ch.connected ? ch.color : textMuted, fontWeight: 500 }}>{ch.connected ? 'Connecté' : 'Inactif'}</span>
            </div>
          ))}
        </div>

        {/* Theme + Profile */}
        <div style={{ padding: '8px 8px', borderTop: `1px solid ${sidebarBorder}`, flexShrink: 0 }} ref={profileRef}>
          <button onClick={toggle} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, border: 'none', background: 'transparent', color: textMuted, fontSize: 12, cursor: 'pointer', marginBottom: 4 }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = hoverBg }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
            {isDark ? <Sun size={14} /> : <Moon size={14} />}
            {isDark ? 'Mode clair' : 'Mode sombre'}
          </button>
          <button onClick={() => setProfileOpen(o => !o)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, border: 'none', background: profileOpen ? hoverBg : 'transparent', cursor: 'pointer' }}
            onMouseEnter={e => { if (!profileOpen) (e.currentTarget as HTMLElement).style.background = hoverBg }}
            onMouseLeave={e => { if (!profileOpen) (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg, #3B82F6, #6366F1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff' }}>{initial}</div>
            <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{businessName}</div>
              <div style={{ fontSize: 11, color: textSub, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{businessEmail}</div>
            </div>
            <ChevronDown size={14} color={textSub} style={{ flexShrink: 0, transform: profileOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
          </button>
          {profileOpen && (
            <div style={{ marginTop: 4, background: dropdownBg, border: `1px solid ${sidebarBorder}`, borderRadius: 8, overflow: 'hidden' }}>
              <button onClick={() => signOut({ callbackUrl: '/auth/signin' })} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', border: 'none', background: 'transparent', color: '#EF4444', fontSize: 13, cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                <LogOut size={14} /> Déconnexion
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ── Mobile top header ───────────────────────────────────────────────── */}
      <div
        className="rp-mobile-header"
        style={{
          background: isDark ? '#1C1C1E' : '#FFFFFF',
          backdropFilter: 'blur(32px) saturate(180%)',
          WebkitBackdropFilter: 'blur(32px) saturate(180%)',
          borderBottom: `1px solid ${topBarBorder}`,
          zIndex: 50,
        }}
      >
        <div style={{ height: 44, display: 'flex', alignItems: 'center', paddingLeft: 16, paddingRight: 12, gap: 0, paddingTop: 'env(safe-area-inset-top)' }}>
          <Image src="/logo.png" alt="" width={24} height={24} style={{ borderRadius: 6, flexShrink: 0 }} />
          <span key={pathname} style={{ flex: 1, textAlign: 'center', fontSize: 16, fontWeight: 600, color: textPrimary, letterSpacing: '-0.02em' }}>{pageTitle}</span>
          {/* Avatar → profile sheet */}
          <div ref={profileRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setProfileOpen(o => !o)}
              style={{ 
                width: 36, 
                height: 36, 
                borderRadius: '50%', 
                background: isDark 
                  ? '#0A84FF' 
                  : '#007AFF', 
                border: `2px solid ${isDark ? '#FFFFFF' : '#000000'}`, 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontSize: 14, 
                fontWeight: 700, 
                color: '#FFFFFF', 
                position: 'relative',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              }}
            >
              {initial}
              {unreadCount > 0 && <span style={{ position: 'absolute', top: -2, right: -2, width: 16, height: 16, borderRadius: '50%', background: '#FF453A', color: '#fff', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${isDark ? '#000000' : '#FFFFFF'}`, boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>{unreadCount > 9 ? '9+' : unreadCount}</span>}
            </button>
          </div>
        </div>
      </div>

      {/* ── Content area ────────────────────────────────────────────────────── */}
      <main
        className={`rp-content${isMsg ? ' rp-msg' : ''}${hideNav ? ' rp-fullscreen' : ''}`}
        style={{ marginLeft: 0, background: 'var(--bg)' }}
      >
        {/* Desktop: account for sidebar */}
        <style>{`@media (min-width: 768px) { .rp-content { margin-left: 220px !important; } }`}</style>
        {children}
      </main>

      {/* ── Mobile bottom nav island ────────────────────────────────────────── */}
      <div
        className={`rp-mobile-nav${hideNav ? ' rp-hidden' : ''}`}
        style={{
          paddingLeft: 12, paddingRight: 12,
          paddingTop: 8,
          paddingBottom: 'calc(8px + env(safe-area-inset-bottom))',
          background: 'var(--bg)',
        }}
      >
        <div style={{
          background: isDark ? '#1C1C1E' : '#FFFFFF',
          backdropFilter: 'blur(32px) saturate(180%)',
          WebkitBackdropFilter: 'blur(32px) saturate(180%)',
          border: `1px solid ${navIslandBorder}`,
          borderRadius: 24,
          display: 'flex',
          alignItems: 'center',
          padding: '6px 8px',
          boxShadow: isDark
            ? '0 4px 20px rgba(0,0,0,0.3)'
            : '0 4px 20px rgba(0,0,0,0.1)',
        }}>
          {NAV.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || (href !== '/dashboard/accueil' && pathname.startsWith(href))
            return (
              <button
                key={href}
                onClick={() => router.push(href)}
                style={{
                  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', gap: 2, padding: '8px 4px',
                  borderRadius: 16, border: 'none', background: 'transparent',
                  cursor: 'pointer', position: 'relative', minWidth: 0,
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                {/* Active indicator */}
                {isActive && (
                  <div style={{
                    position: 'absolute', inset: '2px',
                    borderRadius: 14,
                    background: isDark ? 'rgba(10,132,255,0.15)' : 'rgba(0,122,255,0.1)',
                  }} />
                )}

                {/* Icon */}
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <Icon size={20} color={isActive ? (isDark ? '#0A84FF' : '#007AFF') : textMuted} strokeWidth={isActive ? 2.5 : 1.8} />
                  {label === 'Messagerie' && unreadCount > 0 && !isActive && (
                    <span style={{ position: 'absolute', top: -3, right: -5, width: 14, height: 14, borderRadius: '50%', background: '#FF453A', color: '#fff', fontSize: 8, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </div>

                {/* Label */}
                <span style={{ fontSize: 9, fontWeight: isActive ? 600 : 500, color: isActive ? (isDark ? '#0A84FF' : '#007AFF') : textMuted, zIndex: 1, lineHeight: 1 }}>
                  {label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Mobile profile sheet ────────────────────────────────────────────── */}
      {profileOpen && (
        <>
          <div onClick={() => setProfileOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }} className="rp-mobile-header" />
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 201, background: isDark ? '#111118' : '#FFFFFF', borderRadius: '20px 20px 0 0', border: `1px solid ${sidebarBorder}`, borderBottom: 'none', paddingBottom: 'env(safe-area-inset-bottom)', boxShadow: '0 -8px 40px rgba(0,0,0,0.3)', animation: 'slideUpSheet 0.28s cubic-bezier(0.32,0.72,0,1)' }} className="rp-mobile-header">
            <style>{`@keyframes slideUpSheet { from { transform: translateY(100%) } to { transform: translateY(0) } }`}</style>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: isDark ? '#334155' : '#CBD5E1' }} />
            </div>
            <div style={{ padding: '8px 20px 12px', borderBottom: `1px solid ${sidebarBorder}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #3B82F6, #6366F1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#fff' }}>{initial}</div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: textPrimary }}>{businessName}</div>
                  <div style={{ fontSize: 12, color: textMuted }}>{businessEmail}</div>
                </div>
              </div>
            </div>
            <div style={{ padding: '6px 0' }}>
              <button onClick={toggle} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '13px 20px', border: 'none', background: 'transparent', color: textPrimary, fontSize: 15, cursor: 'pointer', textAlign: 'left' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: isDark ? '#1E1E2E' : '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {isDark ? <Sun size={18} color="#F59E0B" /> : <Moon size={18} color="#6366F1" />}
                </div>
                {isDark ? 'Mode clair' : 'Mode sombre'}
              </button>
              <button onClick={() => signOut({ callbackUrl: '/auth/signin' })} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '13px 20px', border: 'none', background: 'transparent', color: '#EF4444', fontSize: 15, cursor: 'pointer', textAlign: 'left' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <LogOut size={18} color="#EF4444" />
                </div>
                Déconnexion
              </button>
            </div>
            <div style={{ padding: '4px 16px 8px' }}>
              <button onClick={() => setProfileOpen(false)} style={{ width: '100%', padding: '14px', borderRadius: 14, background: isDark ? '#1E1E2E' : '#F1F5F9', border: 'none', color: textPrimary, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>Annuler</button>
            </div>
          </div>
        </>
      )}
    </div>
    </MobileNavContext.Provider>
  )
}
