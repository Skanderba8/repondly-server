'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'
import {
  LayoutDashboard, Inbox, Bot, Settings, LogOut,
  AlertCircle, CheckCircle, X, TrendingUp,
  MessageSquare, Radio, Calendar, ChevronDown, User,
  ArrowRight, Wifi, WifiOff, Zap, RefreshCw,
} from 'lucide-react'
import MessagerieView from './messagerie/MessagerieView'
import ChannelsPage from '@/components/ChannelsPage'

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  blue:        '#1a6bff',
  blueDark:    '#0f4fd4',
  blueLight:   '#e8f0ff',
  blueMid:     '#3b82f6',
  purple:      '#7c3aed',
  purpleLight: '#ede9fe',
  teal:        '#0d9488',
  tealLight:   '#ccfbf1',
  amber:       '#d97706',
  amberLight:  '#fef3c7',
  ink:         '#0f172a',
  inkSoft:     '#1e293b',
  mid:         '#475569',
  muted:       '#94a3b8',
  border:      '#e2e8f0',
  borderMid:   '#cbd5e1',
  bg:          '#f1f5f9',
  white:       '#ffffff',
  sidebar:     '#0f172a',
  sidebarHover:'#1e293b',
  sidebarBorder:'#1e293b',
  green:       '#059669',
  greenLight:  '#d1fae5',
  red:         '#dc2626',
  redLight:    '#fee2e2',
}

// ── Types ─────────────────────────────────────────────────────────────────────
type PageId = 'home' | 'inbox' | 'channels' | 'calendrier' | 'bot' | 'settings'

interface RecentConv {
  id: number
  name: string
  preview: string
  time: number
  channel: string
  unread: number
}

const NAV: { id: PageId; label: string; icon: React.ReactNode }[] = [
  { id: 'home',       label: 'Accueil',    icon: <LayoutDashboard size={16} /> },
  { id: 'inbox',      label: 'Messagerie', icon: <Inbox size={16} /> },
  { id: 'channels',   label: 'Canaux',     icon: <Radio size={16} /> },
  { id: 'calendrier', label: 'Calendrier', icon: <Calendar size={16} /> },
  { id: 'bot',        label: 'Agent IA',   icon: <Bot size={16} /> },
  { id: 'settings',   label: 'Paramètres', icon: <Settings size={16} /> },
]

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, icon, accent, loading, actionLabel, onAction }: {
  label: string; value: string | number; sub: string
  icon: React.ReactNode; accent: string; loading?: boolean
  actionLabel?: string; onAction?: () => void
}) {
  return (
    <div style={{
      background: 'linear-gradient(160deg, #ffffff 0%, #f8fbff 100%)',
      borderRadius: 16, overflow: 'hidden',
      border: '1px solid rgba(226,232,240,0.7)',
      boxShadow: `0 4px 16px ${accent}0d, 0 1px 3px rgba(15,23,42,0.06)`,
      transition: 'transform 0.18s, box-shadow 0.18s',
      cursor: 'default',
    }}
    onMouseEnter={e => {
      const el = e.currentTarget as HTMLElement
      el.style.transform = 'translateY(-4px)'
      el.style.boxShadow = `0 18px 44px ${accent}1e, 0 4px 12px rgba(15,23,42,0.08)`
    }}
    onMouseLeave={e => {
      const el = e.currentTarget as HTMLElement
      el.style.transform = 'translateY(0)'
      el.style.boxShadow = `0 4px 16px ${accent}0d, 0 1px 3px rgba(15,23,42,0.06)`
    }}
    >
      <div style={{ height: 3, background: `linear-gradient(90deg, ${accent}, ${accent}66)` }} />
      <div style={{ padding: '18px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</span>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: `linear-gradient(135deg, ${accent}20 0%, ${accent}0b 100%)`,
            boxShadow: `0 2px 8px ${accent}18`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: accent,
          }}>
            {icon}
          </div>
        </div>
        {loading
          ? <div style={{ height: 34, width: 72, background: C.bg, borderRadius: 8, marginBottom: 8 }} />
          : <div style={{ fontSize: 32, fontWeight: 800, color: C.ink, lineHeight: 1, letterSpacing: '-0.04em', marginBottom: 6 }}>{value}</div>
        }
        <div style={{ fontSize: 12, color: C.muted }}>{sub}</div>
        {actionLabel && onAction && (
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(226,232,240,0.6)' }}>
            <button onClick={onAction} style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              fontSize: 11, fontWeight: 700, color: accent,
              background: accent + '14', border: 'none',
              cursor: 'pointer', padding: '5px 11px', borderRadius: 6,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = accent + '28' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = accent + '14' }}
            >
              {actionLabel} <ArrowRight size={10} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Channel Card ──────────────────────────────────────────────────────────────
function ChannelCard({ label, desc, active, color, onClick }: {
  label: string; desc: string; active: boolean; color: string; onClick: () => void
}) {
  return (
    <button onClick={onClick} style={{
      flex: 1, padding: '16px', borderRadius: 12,
      background: active ? color + '0d' : C.white,
      border: `1.5px solid ${active ? color + '40' : C.border}`,
      display: 'flex', flexDirection: 'column', gap: 10,
      cursor: 'pointer', transition: 'all 0.18s', textAlign: 'left',
      boxShadow: active ? `0 4px 16px ${color}18` : 'none',
    }}
    onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.borderColor = C.borderMid }}
    onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.borderColor = C.border }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{
          width: 10, height: 10, borderRadius: '50%',
          background: active ? color : C.borderMid,
          boxShadow: active ? `0 0 10px ${color}99` : 'none',
          transition: 'all 0.3s',
        }} />
        <span style={{
          fontSize: 10, fontWeight: 700,
          color: active ? color : C.muted,
          background: active ? color + '15' : C.bg,
          padding: '2px 8px', borderRadius: 20,
          textTransform: 'uppercase', letterSpacing: '0.08em',
        }}>
          {active ? 'Actif' : 'Inactif'}
        </span>
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.ink, marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 11, color: C.muted }}>{desc}</div>
      </div>
    </button>
  )
}

// ── Activity row ──────────────────────────────────────────────────────────────
function ActivityRow({ conv, onClick }: { conv: RecentConv; onClick: () => void }) {
  const chColor = conv.channel.toLowerCase().includes('whatsapp') ? '#25D366'
    : conv.channel.toLowerCase().includes('facebook') ? '#1877F2'
    : conv.channel.toLowerCase().includes('instagram') ? '#E1306C'
    : C.blue
  const initials = conv.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
  const now = new Date()
  const d = new Date(conv.time * 1000)
  const diff = Math.floor((now.getTime() - d.getTime()) / 60000)
  const timeStr = diff < 60 ? `${diff}m` : diff < 1440 ? `${Math.floor(diff / 60)}h` : d.toLocaleDateString('fr-TN', { day: '2-digit', month: '2-digit' })

  return (
    <button onClick={onClick} style={{
      width: '100%', display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 14px', borderRadius: 10, border: 'none',
      background: 'transparent', cursor: 'pointer', transition: 'background 0.12s',
    }}
    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.bg}
    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
    >
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div style={{
          width: 38, height: 38, borderRadius: '50%',
          background: C.blueLight, color: C.blue,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 700,
        }}>{initials}</div>
        <div style={{
          position: 'absolute', bottom: -1, right: -1,
          width: 14, height: 14, borderRadius: '50%',
          background: chColor, border: '2px solid #fff',
        }} />
      </div>
      <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
          <span style={{ fontSize: 13, fontWeight: conv.unread > 0 ? 700 : 600, color: C.ink }}>{conv.name}</span>
          <span style={{ fontSize: 11, color: C.muted, flexShrink: 0, marginLeft: 8 }}>{timeStr}</span>
        </div>
        <div style={{ fontSize: 12, color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {conv.preview || 'Aucun message'}
        </div>
      </div>
      {conv.unread > 0 && (
        <div style={{
          width: 20, height: 20, borderRadius: '50%',
          background: C.blue, color: '#fff',
          fontSize: 10, fontWeight: 700, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{conv.unread}</div>
      )}
    </button>
  )
}

// ── Setup step ────────────────────────────────────────────────────────────────
function SetupStep({ done, step, label, cta, onClick }: {
  done: boolean; step: number; label: string; cta: string; onClick: () => void
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '12px 0', borderBottom: `1px solid ${C.border}`,
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
        background: done ? C.blue : C.white,
        border: `2px solid ${done ? C.blue : C.borderMid}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 700, color: done ? '#fff' : C.muted,
        transition: 'all 0.25s',
      }}>
        {done ? <CheckCircle size={14} /> : step}
      </div>
      <span style={{
        flex: 1, fontSize: 13, fontWeight: 500,
        color: done ? C.muted : C.ink,
        textDecoration: done ? 'line-through' : 'none',
      }}>{label}</span>
      {!done && (
        <button onClick={onClick} style={{
          display: 'flex', alignItems: 'center', gap: 4,
          fontSize: 11, fontWeight: 700, color: C.blue,
          background: C.blueLight, border: 'none',
          cursor: 'pointer', padding: '5px 12px', borderRadius: 8,
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#d0e2ff'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = C.blueLight}
        >{cta} <ArrowRight size={11} /></button>
      )}
    </div>
  )
}

// ── Empty placeholder ─────────────────────────────────────────────────────────
function EmptyPage({ icon, label, sublabel }: { icon: React.ReactNode; label: string; sublabel: string }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100%', gap: 16, padding: 40,
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: 18,
        background: 'linear-gradient(135deg, #e8f0ff 0%, #ede9fe 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: C.blue, boxShadow: '0 4px 16px rgba(26,107,255,0.12)',
      }}>
        {icon}
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: C.ink, marginBottom: 6 }}>{label}</div>
        <div style={{ fontSize: 13, color: C.muted, maxWidth: 320, lineHeight: 1.7 }}>{sublabel}</div>
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
  const [isMobile, setIsMobile] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [waConnected, setWaConnected] = useState(false)
  const [fbConnected, setFbConnected] = useState(false)
  const [igConnected, setIgConnected] = useState(false)
  const [hasAcceptedDPA, setHasAcceptedDPA] = useState(false)
  const [hasConfiguredBot, setHasConfiguredBot] = useState(false)
  const [stats, setStats] = useState({ messages: 0, conversations: 0, openCount: 0 })
  const [recentConvs, setRecentConvs] = useState<RecentConv[]>([])

  const showToast = useCallback((type: 'error' | 'success', msg: string) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 4000)
  }, [])

  const fetchStatus = useCallback(async () => {
    setLoading(true)
    try {
      const [resFb, resWa, resCw] = await Promise.all([
        fetch('/api/meta/pages'),
        fetch('/api/whatsapp/status'),
        fetch('/api/chatwoot/conversations?status=open'),
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
      if (resCw.ok) {
        const d = await resCw.json()
        const payload: any[] = d.data?.payload || []
        const openCount = payload.length
        setStats({ conversations: openCount, messages: openCount * 4, openCount })
        setRecentConvs(payload.slice(0, 6).map((c: any) => ({
          id: c.id,
          name: c.meta?.sender?.name || 'Contact',
          preview: c.last_non_activity_message?.content || '',
          time: c.last_activity_at || 0,
          channel: c.inbox?.channel_type || '',
          unread: c.unread_count || 0,
        })))
      }
    } catch (e: any) {
      showToast('error', e.message)
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => { fetchStatus() }, [fetchStatus])

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (mobile) setActivePage(p => p === 'home' ? 'inbox' : p)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    const handle = async (e: MessageEvent) => {
      if (e.origin !== 'https://www.facebook.com') return
      try {
        const data = JSON.parse(e.data)
        if (data.type !== 'WA_EMBEDDED_SIGNUP') return
        const res = await fetch('/api/whatsapp/connect', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
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

  const userName   = session.user?.name || 'Admin'
  const initial    = userName.charAt(0).toUpperCase()
  const anyChannel = waConnected || fbConnected || igConnected
  const setupCount = [anyChannel, hasAcceptedDPA, hasConfiguredBot].filter(Boolean).length
  const activeChannels = [waConnected, fbConnected, igConnected].filter(Boolean).length

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Inter:wght@300;400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', system-ui, sans-serif; background: #0a0d1a; overflow: hidden; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${C.borderMid}; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: ${C.muted}; }
        button { font-family: inherit; }
      `}</style>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            style={{
              position: 'fixed', top: 24, left: '50%', zIndex: 9999,
              background: C.white, borderRadius: 12,
              border: `1px solid ${toast.type === 'error' ? '#fca5a5' : '#6ee7b7'}`,
              padding: '12px 18px',
              display: 'flex', alignItems: 'center', gap: 10,
              boxShadow: '0 16px 40px rgba(15,23,42,0.14)',
            }}
          >
            {toast.type === 'error'
              ? <AlertCircle size={16} color={C.red} />
              : <CheckCircle size={16} color={C.green} />}
            <span style={{ fontSize: 13, fontWeight: 500, color: C.ink }}>{toast.msg}</span>
            <button onClick={() => setToast(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, padding: 0, marginLeft: 4, display: 'flex' }}>
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: 'flex', height: '100dvh', width: '100vw', overflow: 'hidden', background: 'linear-gradient(135deg, #07101f 0%, #0d1830 50%, #08111e 100%)' }}>

        {/* ══ Sidebar ══════════════════════════════════════════════════════════ */}
        {!isMobile && (
          <aside style={{
            width: 240, flexShrink: 0,
            background: 'rgba(9, 13, 26, 0.93)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            borderRight: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '4px 0 32px rgba(0,0,0,0.4), inset -1px 0 0 rgba(255,255,255,0.04)',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
          } as React.CSSProperties}>
            {/* Logo */}
            <div style={{ height: 64, display: 'flex', alignItems: 'center', padding: '0 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
              <a href="https://repondly.com" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
                <Image src="/logo.png" alt="Répondly" width={28} height={28} style={{ objectFit: 'contain' }} priority />
                <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.15rem', color: '#f8fafc', letterSpacing: '-0.02em' }}>
                  Répondly<span style={{ color: C.blue }}>.</span>
                </span>
              </a>
            </div>

            {/* Nav */}
            <nav style={{ flex: 1, padding: '16px 10px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.22)', textTransform: 'uppercase', letterSpacing: '0.14em', padding: '0 10px', marginBottom: 8 }}>
                Navigation
              </div>
              {NAV.map(item => {
                const active = activePage === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => setActivePage(item.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      width: '100%', padding: '10px 12px', borderRadius: 8,
                      background: active ? 'rgba(26,107,255,0.18)' : 'transparent',
                      color: active ? '#ddeeff' : '#64748b',
                      fontSize: 13, fontWeight: active ? 600 : 400,
                      border: 'none', cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left',
                      borderLeft: active ? `3px solid ${C.blue}` : '3px solid transparent',
                      boxShadow: active ? 'inset 0 0 16px rgba(26,107,255,0.1)' : 'none',
                    }}
                    onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLElement).style.color = '#94a3b8' } }}
                    onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#64748b' } }}
                  >
                    {item.icon}
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {item.id === 'inbox' && stats.openCount > 0 && (
                      <span style={{ background: C.blue, color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20 }}>
                        {stats.openCount}
                      </span>
                    )}
                    {item.id === 'channels' && !anyChannel && (
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.amber, flexShrink: 0 }} />
                    )}
                  </button>
                )
              })}

              {/* Channel status widget */}
              <div style={{ marginTop: 24, padding: '14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.22)', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 12 }}>Statut des canaux</div>
                {[
                  { label: 'WhatsApp', active: waConnected, color: '#25D366' },
                  { label: 'Facebook', active: fbConnected, color: '#1877F2' },
                  { label: 'Instagram', active: igConnected, color: '#E1306C' },
                ].map(ch => (
                  <div key={ch.label} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '5px 0' }}>
                    <span style={{
                      width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                      background: ch.active ? ch.color : '#334155',
                      boxShadow: ch.active ? `0 0 8px ${ch.color}bb` : 'none',
                      transition: 'all 0.3s',
                    }} />
                    <span style={{ fontSize: 12, color: ch.active ? '#94a3b8' : '#475569', flex: 1 }}>{ch.label}</span>
                    <span style={{ fontSize: 10, fontWeight: 600, color: ch.active ? '#4ade80' : '#475569' }}>
                      {ch.active ? 'ON' : 'OFF'}
                    </span>
                  </div>
                ))}
              </div>
            </nav>

            {/* User */}
            <div style={{ padding: '14px', borderTop: '1px solid rgba(255,255,255,0.07)', background: 'rgba(0,0,0,0.18)', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg, #1a6bff 0%, #7c3aed 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 700, color: '#fff',
                }}>{initial}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userName}</div>
                  <div style={{ fontSize: 11, color: '#475569' }}>Compte actif</div>
                </div>
                <button onClick={() => signOut()} title="Déconnexion" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: 4, display: 'flex', borderRadius: 6, transition: 'color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#94a3b8'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#475569'}
                >
                  <LogOut size={15} />
                </button>
              </div>
            </div>
          </aside>
        )}

        {/* ══ Main area ════════════════════════════════════════════════════════ */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

          {/* ── Header ── */}
          <header style={{
            height: 64, flexShrink: 0,
            background: 'rgba(248,250,255,0.90)',
            backdropFilter: 'blur(16px) saturate(180%)',
            WebkitBackdropFilter: 'blur(16px) saturate(180%)',
            borderBottom: '1px solid rgba(226,232,240,0.65)',
            display: 'flex', alignItems: 'center',
            padding: isMobile ? '0 16px' : '0 32px',
            gap: 12,
            boxShadow: '0 2px 16px rgba(26,107,255,0.06), 0 1px 0 rgba(226,232,240,0.5)',
          } as React.CSSProperties}>
            {isMobile && (
              <a href="https://repondly.com" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', marginRight: 4 }}>
                <Image src="/logo.png" alt="Répondly" width={24} height={24} style={{ objectFit: 'contain' }} priority />
                <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1rem', color: C.ink, letterSpacing: '-0.02em' }}>
                  Répondly<span style={{ color: C.blue }}>.</span>
                </span>
              </a>
            )}
            <div>
              <div style={{ fontSize: 12, color: C.muted }}>
                Bienvenu, <span style={{ fontWeight: 600, color: C.inkSoft }}>{userName}</span>
              </div>
              {!isMobile && (
                <div style={{ fontSize: 15, fontWeight: 700, color: C.ink, marginTop: 1 }}>
                  {NAV.find(n => n.id === activePage)?.label ?? 'Tableau de bord'}
                </div>
              )}
            </div>

            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
              {anyChannel && !isMobile && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, background: C.greenLight, border: '1px solid #6ee7b7' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.green, boxShadow: `0 0 6px ${C.green}` }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: C.green }}>{activeChannels} canal{activeChannels > 1 ? 'x' : ''} actif{activeChannels > 1 ? 's' : ''}</span>
                </div>
              )}
              <button onClick={() => fetchStatus()} style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 8, padding: 7, cursor: 'pointer', color: C.muted, display: 'flex', transition: 'all 0.15s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = C.blue; (e.currentTarget as HTMLElement).style.color = C.blue }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.color = C.muted }}
              >
                <RefreshCw size={14} />
              </button>

              {/* Profile avatar + dropdown */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #1a6bff 0%, #7c3aed 100%)',
                    border: profileOpen ? `2px solid ${C.blue}` : '2px solid transparent',
                    color: '#fff', fontSize: 14, fontWeight: 700,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'border-color 0.15s',
                    boxShadow: '0 2px 8px rgba(26,107,255,0.25)',
                  }}
                >{initial}</button>
                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -8 }}
                      transition={{ duration: 0.12 }}
                      style={{
                        position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                        background: C.white, border: `1px solid ${C.border}`,
                        borderRadius: 12, padding: 6,
                        minWidth: 180, boxShadow: '0 16px 40px rgba(15,23,42,0.12)',
                        zIndex: 200,
                      }}
                    >
                      <div style={{ padding: '10px 12px 8px', borderBottom: `1px solid ${C.border}`, marginBottom: 4 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{userName}</div>
                        <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>{session.user?.email}</div>
                      </div>
                      <button
                        onClick={() => setProfileOpen(false)}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: 7, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, color: C.ink, transition: 'background 0.12s' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.bg}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                      >
                        <User size={14} color={C.muted} /> Profil
                      </button>
                      <button
                        onClick={() => signOut()}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: 7, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, color: C.red, transition: 'background 0.12s' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.redLight}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                      >
                        <LogOut size={14} /> Déconnexion
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </header>

          {/* ── Content area ── */}
          <main style={{
            flex: 1, overflowY: activePage === 'inbox' ? 'hidden' : 'auto',
            position: 'relative',
            paddingBottom: isMobile ? 66 : 0,
            background: 'linear-gradient(150deg, #edf1ff 0%, #f8fafc 45%, #eff4ff 100%)',
          }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activePage}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                style={{ height: activePage === 'inbox' ? '100%' : 'auto' }}
              >
                {activePage === 'inbox' && <MessagerieView />}
                {activePage === 'channels' && (
                  <ChannelsPage waConnected={waConnected} fbConnected={fbConnected} igConnected={igConnected} onStatusChange={fetchStatus} onToast={showToast} />
                )}
                {activePage === 'home' && (
                  <HomeView
                    loading={loading} stats={stats} recentConvs={recentConvs}
                    waConnected={waConnected} fbConnected={fbConnected} igConnected={igConnected}
                    hasAcceptedDPA={hasAcceptedDPA} hasConfiguredBot={hasConfiguredBot}
                    setupCount={setupCount}
                    onNavigate={setActivePage}
                    onSignDPA={() => setHasAcceptedDPA(true)}
                  />
                )}
                {activePage === 'calendrier' && (
                  <EmptyPage
                    icon={<Calendar size={28} />}
                    label="Calendrier"
                    sublabel="La synchronisation Google Calendar sera disponible prochainement. Vous pourrez gérer vos rendez-vous et disponibilités directement ici."
                  />
                )}
                {activePage === 'bot' && (
                  <EmptyPage
                    icon={<Bot size={28} />}
                    label="Agent IA"
                    sublabel="Configurez votre assistant IA pour répondre automatiquement aux messages entrants sur tous vos canaux."
                  />
                )}
                {activePage === 'settings' && (
                  <EmptyPage
                    icon={<Settings size={28} />}
                    label="Paramètres"
                    sublabel="Gérez les paramètres de votre compte, notifications et préférences."
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </main>

          {/* ── Mobile bottom navigation ── */}
          {isMobile && (
            <div style={{
              position: 'fixed', bottom: 0, left: 0, right: 0,
              height: 66, background: C.white,
              borderTop: `1px solid ${C.border}`,
              display: 'flex', alignItems: 'center',
              padding: '0 4px',
              zIndex: 1000,
              boxShadow: '0 -4px 24px rgba(15,23,42,0.07)',
            }}>
              {NAV.map(item => {
                const active = activePage === item.id
                return (
                  <button key={item.id} onClick={() => setActivePage(item.id)} style={{
                    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    gap: 4, padding: '8px 4px', background: 'none', border: 'none', cursor: 'pointer',
                    position: 'relative',
                  }}>
                    <div style={{
                      width: 40, height: 32, borderRadius: 10,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: active ? C.blueLight : 'transparent',
                      color: active ? C.blue : C.muted,
                      transition: 'all 0.15s',
                      position: 'relative',
                    }}>
                      {item.icon}
                      {item.id === 'inbox' && stats.openCount > 0 && (
                        <span style={{
                          position: 'absolute', top: 2, right: 2,
                          width: 8, height: 8, borderRadius: '50%',
                          background: C.blue, border: '2px solid #fff',
                        }} />
                      )}
                    </div>
                    <span style={{ fontSize: 10, fontWeight: active ? 700 : 400, color: active ? C.blue : C.muted }}>
                      {item.label}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// ── Home view ─────────────────────────────────────────────────────────────────
function HomeView({
  loading, stats, recentConvs, waConnected, fbConnected, igConnected,
  hasAcceptedDPA, hasConfiguredBot, setupCount, onNavigate, onSignDPA,
}: {
  loading: boolean
  stats: { messages: number; conversations: number; openCount: number }
  recentConvs: RecentConv[]
  waConnected: boolean; fbConnected: boolean; igConnected: boolean
  hasAcceptedDPA: boolean; hasConfiguredBot: boolean; setupCount: number
  onNavigate: (p: PageId) => void
  onSignDPA: () => void
}) {
  const anyChannel = waConnected || fbConnected || igConnected
  const activeChannels = [waConnected, fbConnected, igConnected].filter(Boolean).length

  return (
    <div style={{
      padding: '28px 32px',
      minHeight: '100%',
      background: 'linear-gradient(150deg, #edf1ff 0%, #f8fafc 45%, #eff4ff 100%)',
    }}>

      {/* ── KPI row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <KpiCard
          label="Conversations ouvertes"
          value={loading ? '—' : stats.openCount}
          sub="En attente de réponse"
          icon={<MessageSquare size={17} />}
          accent={C.blue}
          loading={loading}
          actionLabel="Messagerie"
          onAction={() => onNavigate('inbox')}
        />
        <KpiCard
          label="Messages traités"
          value={loading ? '—' : stats.messages}
          sub="Estimation totale"
          icon={<TrendingUp size={17} />}
          accent="#6366f1"
          loading={loading}
          actionLabel="Canaux"
          onAction={() => onNavigate('channels')}
        />
        <KpiCard
          label="Canaux actifs"
          value={loading ? '—' : activeChannels}
          sub="Sur 3 disponibles"
          icon={<Wifi size={17} />}
          accent="#0284c7"
          loading={loading}
          actionLabel="Calendrier"
          onAction={() => onNavigate('calendrier')}
        />
        <KpiCard
          label="Automatisation IA"
          value="—"
          sub="Bientôt disponible"
          icon={<Zap size={17} />}
          accent={C.purple}
          loading={loading}
          actionLabel="Agent IA"
          onAction={() => onNavigate('bot')}
        />
      </div>

      {/* ── Two-column layout ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>

        {/* ── Left column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Recent activity */}
          <div style={{ background: 'linear-gradient(180deg, #ffffff 0%, #f9fbff 100%)', borderRadius: 16, border: '1px solid rgba(226,232,240,0.7)', overflow: 'hidden', boxShadow: '0 4px 20px rgba(26,107,255,0.06), 0 1px 4px rgba(15,23,42,0.05)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(226,232,240,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>Activité récente</div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Dernières conversations ouvertes</div>
              </div>
              <button onClick={() => onNavigate('inbox')} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', borderRadius: 8,
                background: C.blueLight, border: 'none',
                fontSize: 12, fontWeight: 600, color: C.blue, cursor: 'pointer',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#d0e2ff'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = C.blueLight}
              >
                Voir tout <ArrowRight size={13} />
              </button>
            </div>
            <div>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 20px', borderBottom: i < 3 ? `1px solid ${C.border}` : 'none' }}>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: C.bg, flexShrink: 0 }} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center' }}>
                      <div style={{ height: 12, width: '40%', background: C.bg, borderRadius: 6 }} />
                      <div style={{ height: 10, width: '70%', background: C.bg, borderRadius: 6 }} />
                    </div>
                  </div>
                ))
              ) : recentConvs.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: C.muted, fontSize: 13 }}>
                  <MessageSquare size={32} style={{ margin: '0 auto 12px', opacity: 0.4, display: 'block' }} />
                  Aucune conversation ouverte
                </div>
              ) : (
                recentConvs.map((conv, i) => (
                  <div key={conv.id} style={{ borderBottom: i < recentConvs.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                    <ActivityRow conv={conv} onClick={() => onNavigate('inbox')} />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Channels row */}
          <div style={{ background: 'linear-gradient(180deg, #ffffff 0%, #f9fbff 100%)', borderRadius: 16, border: '1px solid rgba(226,232,240,0.7)', overflow: 'hidden', boxShadow: '0 4px 20px rgba(26,107,255,0.06), 0 1px 4px rgba(15,23,42,0.05)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(226,232,240,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>Canaux de messagerie</div>
              <button onClick={() => onNavigate('channels')} style={{ fontSize: 12, fontWeight: 600, color: C.blue, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                Gérer <ArrowRight size={12} />
              </button>
            </div>
            <div style={{ padding: '16px 20px', display: 'flex', gap: 12 }}>
              <ChannelCard label="WhatsApp" desc="Messages & automatisation" active={waConnected} color="#25D366" onClick={() => onNavigate('channels')} />
              <ChannelCard label="Facebook" desc="Page & discussions" active={fbConnected} color="#1877F2" onClick={() => onNavigate('channels')} />
              <ChannelCard label="Instagram" desc="DMs & réponses auto" active={igConnected} color="#E1306C" onClick={() => onNavigate('channels')} />
            </div>
          </div>
        </div>

        {/* ── Right column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Setup checklist */}
          <div style={{ background: 'linear-gradient(180deg, #ffffff 0%, #f9fbff 100%)', borderRadius: 16, border: '1px solid rgba(226,232,240,0.7)', overflow: 'hidden', boxShadow: '0 4px 20px rgba(26,107,255,0.06), 0 1px 4px rgba(15,23,42,0.05)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(226,232,240,0.7)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>Mise en service</div>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.blue }}>{setupCount}/3</span>
              </div>
              <div style={{ height: 6, borderRadius: 6, background: C.bg, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(setupCount / 3) * 100}%`, borderRadius: 6, background: `linear-gradient(90deg, ${C.blue}, ${C.purple})`, transition: 'width 0.5s ease' }} />
              </div>
            </div>
            <div style={{ padding: '4px 20px 8px' }}>
              <SetupStep step={1} done={anyChannel} label="Connecter un canal" cta="Lier" onClick={() => onNavigate('channels')} />
              <SetupStep step={2} done={hasAcceptedDPA} label="Accord de conformité" cta="Signer" onClick={onSignDPA} />
              <SetupStep step={3} done={hasConfiguredBot} label="Configurer l'agent IA" cta="Configurer" onClick={() => onNavigate('bot')} />
            </div>
          </div>

          {/* System status */}
          <div style={{ background: 'linear-gradient(180deg, #ffffff 0%, #f9fbff 100%)', borderRadius: 16, border: '1px solid rgba(226,232,240,0.7)', padding: '16px 20px', boxShadow: '0 4px 20px rgba(26,107,255,0.06), 0 1px 4px rgba(15,23,42,0.05)' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.ink, marginBottom: 12 }}>Statut système</div>
            {[
              { label: 'Plateforme Répondly', ok: true },
              { label: 'Chatwoot', ok: stats.openCount >= 0 },
              { label: 'Canaux connectés', ok: anyChannel },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: 13, color: C.mid }}>{item.label}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: item.ok ? C.green : C.muted, boxShadow: item.ok ? `0 0 6px ${C.green}` : 'none' }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: item.ok ? C.green : C.muted }}>{item.ok ? 'Opérationnel' : 'Inactif'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}