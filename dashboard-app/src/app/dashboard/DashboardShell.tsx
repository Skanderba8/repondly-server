'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'
import {
  LayoutDashboard, Inbox, Zap, Bot, Settings, LogOut,
  Wifi, AlertCircle, CheckCircle, X, TrendingUp, Users,
  MessageSquare, Radio,
} from 'lucide-react'
import MessagerieView from './messagerie/MessagerieView'
import ChannelsPage from '@/components/ChannelsPage'

// ── Design tokens (matches repondly.com) ─────────────────────────────────────
const C = {
  blue:      '#1a6bff',
  blueDark:  '#0f4fd4',
  blueLight: '#e8f0ff',
  ink:       '#0d1b2e',
  mid:       '#5a6a80',
  muted:     '#8899aa',
  border:    '#e2e8f2',
  bg:        '#f5f7fa',
  white:     '#ffffff',
  sidebar:   '#0a1628',
  sidebarBorder: '#1a2d4a',
  green:     '#16a34a',
  greenBg:   '#f0fdf4',
  red:       '#dc2626',
  redBg:     '#fef2f2',
}

// ── Background patterns ───────────────────────────────────────────────────────
function PatternDots() {
  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none',
      backgroundImage: `radial-gradient(circle, #c8d6e8 1px, transparent 1px)`,
      backgroundSize: '28px 28px', opacity: 0.35,
    }} />
  )
}

function PatternGrid() {
  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none',
      backgroundImage: `
        linear-gradient(rgba(26,107,255,0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(26,107,255,0.04) 1px, transparent 1px)
      `,
      backgroundSize: '36px 36px',
    }} />
  )
}

// ── Types ─────────────────────────────────────────────────────────────────────
type PageId = 'home' | 'inbox' | 'channels' | 'bot' | 'settings'

const NAV: { id: PageId; label: string; icon: React.ReactNode }[] = [
  { id: 'home',     label: 'Accueil',    icon: <LayoutDashboard size={15} /> },
  { id: 'inbox',    label: 'Messagerie', icon: <Inbox size={15} /> },
  { id: 'channels', label: 'Canaux',     icon: <Radio size={15} /> },
  { id: 'bot',      label: 'Agent IA',   icon: <Bot size={15} /> },
  { id: 'settings', label: 'Paramètres', icon: <Settings size={15} /> },
]

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon, loading }: {
  label: string; value: string | number; sub: string
  icon: React.ReactNode; loading?: boolean
}) {
  return (
    <div style={{
      background: C.white, border: `1px solid ${C.border}`, borderRadius: 14,
      padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 12,
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: 0, right: 0, width: 120, height: 120, borderRadius: '50%', background: C.blueLight, opacity: 0.3, transform: 'translate(30%, -30%)' }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "'DM Sans', sans-serif" }}>{label}</span>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: C.blueLight, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.blue }}>
          {icon}
        </div>
      </div>
      {loading
        ? <div style={{ height: 36, width: 80, background: C.bg, borderRadius: 6 }} />
        : <div style={{ fontSize: 30, fontWeight: 700, color: C.ink, lineHeight: 1, fontFamily: "'DM Serif Display', serif", letterSpacing: '-0.03em' }}>{value}</div>
      }
      <div style={{ fontSize: 12, color: C.muted, fontFamily: 'Inter, sans-serif' }}>{sub}</div>
    </div>
  )
}

// ── Channel status pill ───────────────────────────────────────────────────────
function StatusPill({ active }: { active: boolean }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 9px', borderRadius: 20,
      background: active ? C.greenBg : C.bg,
      fontSize: 11, fontWeight: 600,
      color: active ? C.green : C.muted,
      border: `1px solid ${active ? '#bbf7d0' : C.border}`,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: active ? '#22c55e' : '#cbd5e1', flexShrink: 0 }} />
      {active ? 'Actif' : 'Inactif'}
    </span>
  )
}

// ── Setup step row ────────────────────────────────────────────────────────────
function SetupStep({ done, label, cta, onClick }: {
  done: boolean; label: string; cta: string; onClick: () => void
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: `1px solid ${C.border}` }}>
      <div style={{
        width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
        background: done ? C.blue : C.bg,
        border: `1.5px solid ${done ? C.blue : C.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.2s',
      }}>
        {done && <CheckCircle size={12} color={C.white} />}
      </div>
      <span style={{
        flex: 1, fontSize: 13, fontWeight: 500,
        color: done ? C.muted : C.ink,
        textDecoration: done ? 'line-through' : 'none',
        fontFamily: 'Inter, sans-serif',
      }}>{label}</span>
      {!done && (
        <button onClick={onClick} style={{
          fontSize: 11, fontWeight: 700, color: C.blue, background: C.blueLight,
          border: 'none', cursor: 'pointer', padding: '4px 10px', borderRadius: 6,
          fontFamily: "'DM Sans', sans-serif",
        }}>{cta}</button>
      )}
    </div>
  )
}

// ── Empty page placeholder ────────────────────────────────────────────────────
function EmptyPage({ icon, label, sublabel }: { icon: React.ReactNode; label: string; sublabel: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12, color: C.muted }}>
      <div style={{ width: 56, height: 56, borderRadius: 16, background: C.blueLight, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.blue }}>
        {icon}
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: C.ink, marginBottom: 4, fontFamily: "'DM Sans', sans-serif" }}>{label}</div>
        <div style={{ fontSize: 13, color: C.muted, fontFamily: 'Inter, sans-serif' }}>{sublabel}</div>
      </div>
    </div>
  )
}

// ── Main shell ────────────────────────────────────────────────────────────────
export default function DashboardShell() {
  const { data: session, status } = useSession()
  const [activePage, setActivePage] = useState<PageId>('home')
  const [toast, setToast] = useState<{ type: 'error' | 'success'; msg: string } | null>(null)
  const [loading, setLoading] = useState(true)

  // Channel states
  const [waConnected, setWaConnected] = useState(false)
  const [fbConnected, setFbConnected] = useState(false)
  const [igConnected, setIgConnected] = useState(false)

  // Onboarding
  const [hasAcceptedDPA, setHasAcceptedDPA] = useState(false)
  const [hasConfiguredBot, setHasConfiguredBot] = useState(false)

  // Stats (real data from Chatwoot)
  const [stats, setStats] = useState({ messages: 0, contacts: 0, conversations: 0 })

  const showToast = useCallback((type: 'error' | 'success', msg: string) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 5000)
  }, [])

  const fetchStatus = useCallback(async () => {
    setLoading(true)
    try {
      const [resFb, resWa] = await Promise.all([
        fetch('/api/meta/pages'),
        fetch('/api/whatsapp/status'),
      ])
      if (resFb.ok) {
        const d = await resFb.json()
        const pages: any[] = d.pages || []
        setFbConnected(pages.some((p: any) => p.channel === 'FACEBOOK'))
        setIgConnected(pages.some((p: any) => p.channel === 'INSTAGRAM'))
      }
      if (resWa.ok) {
        const d = await resWa.json()
        setWaConnected(!!d.whatsappConnected)
      }
      // Fetch real stats from Chatwoot
      const resCw = await fetch('/api/chatwoot/conversations')
      if (resCw.ok) {
        const d = await resCw.json()
        const allCount = d?.data?.meta?.all_count ?? 0
        setStats(s => ({ ...s, conversations: allCount, messages: allCount * 4 }))
      }
    } catch (e: any) {
      showToast('error', e.message)
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => { fetchStatus() }, [fetchStatus])

  // WhatsApp Embedded Signup listener
  useEffect(() => {
    const handle = async (e: MessageEvent) => {
      if (e.origin !== 'https://www.facebook.com') return
      try {
        const data = JSON.parse(e.data)
        if (data.type !== 'WA_EMBEDDED_SIGNUP') return
        const res = await fetch('/api/whatsapp/connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phoneNumberId: data.data.phone_number_id, wabaId: data.data.waba_id }),
        })
        const d = await res.json()
        if (!res.ok) throw new Error(d.error || 'Connection failed')
        setWaConnected(true)
        showToast('success', 'WhatsApp connecté avec succès !')
        fetchStatus()
      } catch (err: any) {
        showToast('error', `WhatsApp: ${err.message}`)
      }
    }
    window.addEventListener('message', handle)
    return () => window.removeEventListener('message', handle)
  }, [showToast, fetchStatus])

  if (status === 'loading' || !session) return null

  const userName    = session.user?.name || 'Admin'
  const userInitial = userName.charAt(0).toUpperCase()
  const setupCount  = [waConnected || fbConnected || igConnected, hasAcceptedDPA, hasConfiguredBot].filter(Boolean).length
  const anyChannel  = waConnected || fbConnected || igConnected

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', sans-serif; background: ${C.bg}; overflow: hidden; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        button { font-family: inherit; }
      `}</style>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -16, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -16, x: '-50%' }}
            style={{
              position: 'fixed', top: 20, left: '50%', zIndex: 9999,
              background: toast.type === 'error' ? C.redBg : C.greenBg,
              border: `1px solid ${toast.type === 'error' ? '#fca5a5' : '#bbf7d0'}`,
              padding: '11px 16px', borderRadius: 10,
              display: 'flex', alignItems: 'center', gap: 10,
              boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
            }}
          >
            {toast.type === 'error'
              ? <AlertCircle size={15} color={C.red} />
              : <CheckCircle size={15} color={C.green} />
            }
            <span style={{ fontSize: 13, fontWeight: 500, color: toast.type === 'error' ? C.red : C.green }}>
              {toast.msg}
            </span>
            <button onClick={() => setToast(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, marginLeft: 4 }}>
              <X size={13} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: 'flex', height: '100dvh', width: '100vw' }}>

        {/* ══ Sidebar ══════════════════════════════════════════════════════════ */}
        <aside style={{
          width: 232, background: C.sidebar,
          borderRight: `1px solid ${C.sidebarBorder}`,
          display: 'flex', flexDirection: 'column', flexShrink: 0,
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Sidebar glow */}
          <div style={{ position: 'absolute', top: -80, left: -60, width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, rgba(26,107,255,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

          {/* Logo */}
          <div style={{ height: 68, display: 'flex', alignItems: 'center', padding: '0 22px', borderBottom: `1px solid ${C.sidebarBorder}`, flexShrink: 0 }}>
            <a href="https://repondly.com" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
              <Image src="/logo.png" alt="Répondly" width={26} height={26} style={{ objectFit: 'contain' }} priority />
              <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.1rem', letterSpacing: '-0.02em', color: '#f8fafc' }}>
                Répondly<span style={{ color: C.blue }}>.</span>
              </span>
            </a>
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0 10px', marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>
              Plateforme
            </div>
            {NAV.map(item => {
              const active = activePage === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setActivePage(item.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    width: '100%', padding: '9px 12px', borderRadius: 9,
                    background: active ? 'rgba(26,107,255,0.15)' : 'transparent',
                    color: active ? '#e8f0ff' : '#64748b',
                    fontSize: 13, fontWeight: active ? 600 : 400,
                    border: active ? '1px solid rgba(26,107,255,0.25)' : '1px solid transparent',
                    cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left',
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#94a3b8' } }}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b' } }}
                >
                  {item.icon}
                  {item.label}
                  {item.id === 'channels' && !anyChannel && (
                    <span style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: '#f59e0b', flexShrink: 0 }} />
                  )}
                </button>
              )
            })}

            {/* Channels status summary in sidebar */}
            <div style={{ marginTop: 20, padding: '12px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.sidebarBorder}` }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10, fontFamily: "'DM Sans', sans-serif" }}>Canaux</div>
              {[
                { label: 'WhatsApp', active: waConnected, color: '#25D366' },
                { label: 'Facebook', active: fbConnected, color: '#1877F2' },
                { label: 'Instagram', active: igConnected, color: '#E1306C' },
              ].map(ch => (
                <div key={ch.label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: ch.active ? ch.color : '#1e293b', flexShrink: 0, boxShadow: ch.active ? `0 0 6px ${ch.color}` : 'none', transition: 'all 0.3s' }} />
                  <span style={{ fontSize: 12, color: ch.active ? '#94a3b8' : '#334155', fontFamily: 'Inter, sans-serif', flex: 1 }}>{ch.label}</span>
                  {ch.active && <span style={{ fontSize: 10, color: '#22c55e', fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>ON</span>}
                </div>
              ))}
            </div>
          </nav>

          {/* User */}
          <div style={{ padding: '16px', borderTop: `1px solid ${C.sidebarBorder}`, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(26,107,255,0.2)', border: `1px solid rgba(26,107,255,0.3)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#93c5fd', fontSize: 13, fontWeight: 700, flexShrink: 0, fontFamily: "'DM Sans', sans-serif" }}>
                {userInitial}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: "'DM Sans', sans-serif" }}>{userName}</div>
                <button onClick={() => signOut()} style={{ background: 'none', border: 'none', padding: 0, color: '#475569', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, marginTop: 1, fontFamily: 'Inter, sans-serif' }}>
                  <LogOut size={10} /> Déconnexion
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* ══ Main area ════════════════════════════════════════════════════════ */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

          {/* Topbar */}
          <header style={{ height: 68, borderBottom: `1px solid ${C.border}`, background: C.white, display: 'flex', alignItems: 'center', padding: '0 32px', flexShrink: 0, gap: 16 }}>
            <div>
              <h1 style={{ fontSize: 15, fontWeight: 700, color: C.ink, fontFamily: "'DM Sans', sans-serif" }}>
                {NAV.find(n => n.id === activePage)?.label ?? 'Dashboard'}
              </h1>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 1, fontFamily: 'Inter, sans-serif' }}>
                {activePage === 'home' && 'Vue d\'ensemble de votre activité'}
                {activePage === 'inbox' && 'Toutes vos conversations en un seul endroit'}
                {activePage === 'channels' && 'Gérez vos intégrations WhatsApp, Facebook et Instagram'}
                {activePage === 'bot' && 'Configuration de votre agent IA'}
                {activePage === 'settings' && 'Paramètres de votre compte'}
              </div>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
              {anyChannel && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, background: C.greenBg, border: '1px solid #bbf7d0' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: C.green, fontFamily: "'DM Sans', sans-serif" }}>Système opérationnel</span>
                </div>
              )}
            </div>
          </header>

          {/* Content */}
          <main style={{ flex: 1, overflowY: activePage === 'inbox' ? 'hidden' : 'auto', position: 'relative' }}>
            {activePage === 'inbox' && <MessagerieView />}

            {activePage === 'channels' && (
              <ChannelsPage
                waConnected={waConnected}
                fbConnected={fbConnected}
                igConnected={igConnected}
                onStatusChange={fetchStatus}
                onToast={showToast}
              />
            )}

            {activePage === 'home' && (
              <HomeView
                loading={loading}
                stats={stats}
                waConnected={waConnected}
                fbConnected={fbConnected}
                igConnected={igConnected}
                hasAcceptedDPA={hasAcceptedDPA}
                hasConfiguredBot={hasConfiguredBot}
                setupCount={setupCount}
                onNavigate={setActivePage}
                onSignDPA={() => setHasAcceptedDPA(true)}
              />
            )}

            {activePage === 'bot' && (
              <div style={{ padding: '32px', height: '100%' }}>
                <EmptyPage
                  icon={<Bot size={24} />}
                  label="Agent IA — Bientôt disponible"
                  sublabel="La configuration de votre agent IA sera disponible dans la prochaine mise à jour."
                />
              </div>
            )}

            {activePage === 'settings' && (
              <div style={{ padding: '32px', height: '100%' }}>
                <EmptyPage
                  icon={<Settings size={24} />}
                  label="Paramètres du compte"
                  sublabel="Gestion des paramètres et préférences de votre compte."
                />
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  )
}

// ── Home view ─────────────────────────────────────────────────────────────────
function HomeView({
  loading, stats, waConnected, fbConnected, igConnected,
  hasAcceptedDPA, hasConfiguredBot, setupCount,
  onNavigate, onSignDPA,
}: {
  loading: boolean
  stats: { messages: number; contacts: number; conversations: number }
  waConnected: boolean; fbConnected: boolean; igConnected: boolean
  hasAcceptedDPA: boolean; hasConfiguredBot: boolean; setupCount: number
  onNavigate: (p: PageId) => void
  onSignDPA: () => void
}) {
  const anyChannel = waConnected || fbConnected || igConnected
  const setupDone = setupCount === 3

  return (
    <div style={{ padding: '32px', display: 'flex', gap: 28, alignItems: 'flex-start' }}>

      {/* Left — main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          <StatCard label="Conversations" value={loading ? '—' : stats.conversations} sub="7 derniers jours" icon={<MessageSquare size={15} />} loading={loading} />
          <StatCard label="Messages traités" value={loading ? '—' : stats.messages} sub="Total estimé" icon={<TrendingUp size={15} />} loading={loading} />
          <StatCard label="Automatisation" value="—" sub="Bientôt disponible" icon={<Zap size={15} />} loading={loading} />
        </div>

        {/* Quick actions */}
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 14, padding: '22px', position: 'relative', overflow: 'hidden' }}>
          <PatternDots />
          <div style={{ position: 'relative' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: C.ink, marginBottom: 5, fontFamily: "'DM Sans', sans-serif" }}>Accès rapide</h3>
            <p style={{ fontSize: 13, color: C.muted, marginBottom: 18, fontFamily: 'Inter, sans-serif' }}>Accédez aux fonctionnalités principales en un clic.</p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                onClick={() => onNavigate('inbox')}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 8, background: C.ink, color: C.white, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                <Inbox size={14} /> Messagerie
              </button>
              <button
                onClick={() => onNavigate('channels')}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 8, background: C.white, color: C.ink, border: `1px solid ${C.border}`, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                <Radio size={14} /> Gérer les canaux
              </button>
            </div>
          </div>
        </div>

        {/* Channels overview */}
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 14, padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: C.ink, fontFamily: "'DM Sans', sans-serif" }}>Canaux actifs</h3>
            <button onClick={() => onNavigate('channels')} style={{ fontSize: 12, color: C.blue, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>Gérer →</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'WhatsApp', active: waConnected, color: '#25D366', desc: 'Messages directs & automatisation' },
              { label: 'Facebook Messenger', active: fbConnected, color: '#1877F2', desc: 'Page & discussions' },
              { label: 'Instagram Direct', active: igConnected, color: '#E1306C', desc: 'DMs & réponses auto' },
            ].map(ch => (
              <div key={ch.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10, background: ch.active ? `${ch.color}08` : C.bg, border: `1px solid ${ch.active ? `${ch.color}22` : C.border}` }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: ch.active ? ch.color : '#cbd5e1', flexShrink: 0, boxShadow: ch.active ? `0 0 8px ${ch.color}66` : 'none' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.ink, fontFamily: "'DM Sans', sans-serif" }}>{ch.label}</div>
                  <div style={{ fontSize: 11, color: C.muted, fontFamily: 'Inter, sans-serif' }}>{ch.desc}</div>
                </div>
                <StatusPill active={ch.active} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — setup checklist */}
      <div style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>

        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 14, padding: '20px', position: 'relative', overflow: 'hidden' }}>
          <PatternGrid />
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: C.ink, fontFamily: "'DM Sans', sans-serif" }}>Mise en service</h3>
              <div style={{ display: 'flex', gap: 4 }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ width: 20, height: 4, borderRadius: 2, background: i < setupCount ? C.blue : C.border, transition: 'background 0.3s' }} />
                ))}
              </div>
            </div>

            {setupDone ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '20px 0' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: C.blueLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle size={22} color={C.blue} />
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.ink, textAlign: 'center', fontFamily: "'DM Sans', sans-serif" }}>Mise en service complète</div>
                <div style={{ fontSize: 11, color: C.muted, textAlign: 'center', fontFamily: 'Inter, sans-serif' }}>Votre système est opérationnel</div>
              </div>
            ) : (
              <div>
                <SetupStep done={anyChannel} label="Connecter un canal" cta="Lier" onClick={() => onNavigate('channels')} />
                <SetupStep done={hasAcceptedDPA} label="Accord de conformité" cta="Signer" onClick={onSignDPA} />
                <SetupStep done={hasConfiguredBot} label="Configurer l'agent IA" cta="Régler" onClick={() => onNavigate('bot')} />
              </div>
            )}
          </div>
        </div>

        {/* Agent IA placeholder */}
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 14, padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: C.blueLight, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.blue }}>
              <Bot size={16} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.ink, fontFamily: "'DM Sans', sans-serif" }}>Agent Répondly</div>
              <div style={{ fontSize: 11, color: C.muted, fontFamily: 'Inter, sans-serif' }}>Configuration disponible bientôt</div>
            </div>
          </div>
          <div style={{ padding: '10px 12px', borderRadius: 8, background: C.bg, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 11, color: C.muted, fontFamily: 'Inter, sans-serif', lineHeight: 1.6 }}>
              L'agent IA répondra automatiquement aux messages entrants sur tous vos canaux connectés.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}