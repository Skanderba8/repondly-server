'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import Messagerie from './messagerie/page'
import {
  LayoutDashboard, Inbox, Zap, Bot, Settings,
  MessageSquare, Activity, AlertCircle, CheckCircle2,
  PauseCircle, PlayCircle, ExternalLink, LogOut, User,
  ChevronDown, X, Circle, Clock, TrendingUp,
  Wifi, WifiOff, FlaskConical, TriangleAlert,
  Menu, SlidersHorizontal
} from 'lucide-react'

const IgIcon = ({ size = 11 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="white">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
)

const FbIcon = ({ size = 11 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="white">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
)

// ─── Design Tokens ─────────────────────────────────────────────────────────────
const C = {
  // Backgrounds
  sidebarBg:    'rgba(10, 22, 48, 0.97)',       // deep navy
  mainBg:       '#f0f4fb',                       // light blue-grey
  cardBg:       'rgba(255,255,255,0.82)',         // glassy white
  cardBgSolid:  '#ffffff',
  topbarBg:     'rgba(255,255,255,0.75)',

  // Blues
  blue:         '#1a6bff',
  blueDark:     '#0f4fd4',
  blueLight:    '#ddeaff',
  skyBlue:      '#4db8ff',
  skyBlueDim:   'rgba(77,184,255,0.12)',

  // Text
  ink:          '#0d1b2e',
  inkSoft:      '#1e3557',
  mid:          '#5a6a80',
  muted:        '#8899aa',
  sideText:     'rgba(255,255,255,0.55)',
  sideTextActive:'#ffffff',

  // Status
  green:        '#00c853',
  greenBg:      'rgba(0,200,83,0.1)',
  amber:        '#f59e0b',
  amberBg:      'rgba(245,158,11,0.1)',
  red:          '#ef4444',
  redBg:        'rgba(239,68,68,0.1)',

  // Borders
  border:       'rgba(26,107,255,0.1)',
  borderLight:  'rgba(0,0,0,0.06)',
  sideBorder:   'rgba(255,255,255,0.07)',
}

// ─── WhatsApp Icon ─────────────────────────────────────────────────────────────
const WaIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <path d="M16 2C8.268 2 2 8.268 2 16c0 2.4.627 4.65 1.72 6.6L2 30l7.6-1.694A13.93 13.93 0 0016 30c7.732 0 14-6.268 14-14S23.732 2 16 2z" fill="#25D366"/>
    <path d="M22.5 19.5c-.3-.15-1.8-.9-2.1-1-.3-.1-.5-.15-.7.15-.2.3-.8 1-.95 1.2-.18.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.47-.89-.79-1.48-1.76-1.66-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.7-1.68-.96-2.3-.25-.6-.5-.52-.7-.53-.18-.01-.38-.01-.58-.01-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.22 3.08.15.2 2.1 3.2 5.08 4.49.71.31 1.27.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.8-.74 2.05-1.45.25-.71.25-1.32.17-1.45-.07-.13-.27-.2-.57-.35z" fill="white"/>
  </svg>
)

// ─── Nav Items ─────────────────────────────────────────────────────────────────
type NavItem = { id: string; label: string; icon: React.ReactNode; badge?: number }

const NAV: NavItem[] = [
  { id: 'home',        label: 'Accueil',         icon: <LayoutDashboard size={17} /> },
  { id: 'inbox',       label: 'Messagerie',       icon: <Inbox size={17} />,           badge: 3 },
  { id: 'automations', label: 'Automatisations',  icon: <Zap size={17} /> },
  { id: 'bot',         label: 'Config. Bot',      icon: <Bot size={17} /> },
  { id: 'settings',    label: 'Paramètres',       icon: <Settings size={17} /> },
]

// ─── Placeholder Page ──────────────────────────────────────────────────────────
function PlaceholderPage({ title, icon, description }: { title: string; icon: React.ReactNode; description: string }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '40px' }}>
      <div style={{ width: '64px', height: '64px', borderRadius: '18px', background: C.blueLight, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.blue }}>
        {icon}
      </div>
      <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: C.ink, letterSpacing: '-0.02em' }}>{title}</h2>
      <p style={{ margin: 0, fontSize: '14px', color: C.mid, textAlign: 'center', maxWidth: '320px', lineHeight: 1.6 }}>{description}</p>
      <div style={{ marginTop: '8px', padding: '8px 20px', background: C.blueLight, color: C.blue, borderRadius: '100px', fontSize: '12px', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        Bientôt disponible
      </div>
    </div>
  )
}

// ─── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status, label }: { status: 'active' | 'paused' | 'error' | 'disconnected'; label: string }) {
  const map = {
    active:       { bg: C.greenBg,  color: C.green,   dot: C.green  },
    paused:       { bg: C.amberBg,  color: C.amber,   dot: C.amber  },
    error:        { bg: C.redBg,    color: C.red,      dot: C.red    },
    disconnected: { bg: 'rgba(88,99,115,0.1)', color: C.muted, dot: C.muted },
  }
  const s = map[status]
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px 3px 7px', borderRadius: '100px', background: s.bg, fontSize: '11.5px', fontWeight: 600, color: s.color }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: s.dot, display: 'inline-block', ...(status === 'active' ? { boxShadow: `0 0 0 2px ${s.bg}`, animation: 'pulse 2s infinite' } : {}) }} />
      {label}
    </span>
  )
}

// ─── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <div style={{ background: C.cardBg, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: `1px solid ${C.borderLight}`, borderRadius: '16px', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '4px', boxShadow: '0 2px 12px rgba(13,27,46,0.05)' }}>
      <div style={{ fontSize: '12px', fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      <div style={{ fontSize: '30px', fontWeight: 800, color: accent || C.ink, letterSpacing: '-0.03em', lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: '12px', color: C.muted, marginTop: '2px' }}>{sub}</div>}
    </div>
  )
}

// ─── Alert Banner ─────────────────────────────────────────────────────────────
function AlertBanner({ type, message, action, onAction }: { type: 'warning' | 'error' | 'info'; message: string; action?: string; onAction?: () => void }) {
  const styles = {
    warning: { bg: C.amberBg, border: `1px solid rgba(245,158,11,0.25)`, color: '#92400e', icon: <TriangleAlert size={15} color={C.amber} /> },
    error:   { bg: C.redBg,   border: `1px solid rgba(239,68,68,0.2)`,   color: C.red,     icon: <AlertCircle size={15} color={C.red} /> },
    info:    { bg: C.blueLight, border: `1px solid ${C.border}`,          color: C.blueDark, icon: <Activity size={15} color={C.blue} /> },
  }
  const s = styles[type]
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '10px', background: s.bg, border: s.border }}>
      {s.icon}
      <span style={{ fontSize: '13px', color: s.color, fontWeight: 500, flex: 1 }}>{message}</span>
      {action && onAction && (
        <button onClick={onAction} style={{ fontSize: '12px', fontWeight: 700, color: s.color, background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
          {action} →
        </button>
      )}
    </div>
  )
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function DashboardShell() {
  const { data: session, status } = useSession()

  // Navigation
  const [activePage, setActivePage] = useState<string>('home')

  // WhatsApp / bot state
  const [waConnected, setWaConnected]           = useState(false)
  const [waPhoneNumber, setWaPhoneNumber]       = useState<string | null>(null) // <-- Add this line
  const [botStatus, setBotStatus]               = useState<'active' | 'paused'>('paused')
  const [fbLoaded, setFbLoaded]                 = useState(false)
  const [waLoading, setWaLoading]               = useState(false)

  // Onboarding
  const [hasAcceptedDPA, setHasAcceptedDPA]     = useState(false)
  const [hasConfiguredBot, setHasConfiguredBot] = useState(false)
  const [showDPAModal, setShowDPAModal]         = useState(false)
  const [dpaScrolled, setDpaScrolled]           = useState(false)
  const [savingDPA, setSavingDPA]               = useState(false)
  const [showPersonaModal, setShowPersonaModal] = useState(false)
  const [savingPersona, setSavingPersona]       = useState(false)

  // Profile
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  // Mock data
  const alertsList = [
    ...(!waConnected ? [{ type: 'error' as const, message: 'WhatsApp non connecté — vos clients ne reçoivent aucune réponse.', action: 'Connecter', onAction: () => {} }] : []),
    ...(!hasAcceptedDPA ? [{ type: 'warning' as const, message: 'Données & conformité non validées (DPA manquant).', action: 'Compléter', onAction: () => setShowDPAModal(true) }] : []),
    ...(!hasConfiguredBot ? [{ type: 'warning' as const, message: 'FAQ non configurée — le bot répond sans base de connaissance.', action: 'Configurer', onAction: () => setShowPersonaModal(true) }] : []),
  ]

  const waitingConversations = [
    { id: 1, contact: 'Sonia B.', preview: 'Bonjour, est-ce que vous avez de la place pour demain ?', time: '3 min', channel: 'wa' },
    { id: 2, contact: 'Med Ali K.', preview: 'Je voudrais annuler mon rendez-vous de jeudi', time: '11 min', channel: 'wa' },
    { id: 3, contact: 'Fatma C.', preview: 'Quel est le prix pour une séance complète ?', time: '25 min', channel: 'wa' },
  ]

  const failedAutomations: { id: number; name: string; error: string; time: string }[] = []

  const progress = useMemo(() => {
    let p = 0
    if (waConnected) p += 34
    if (hasAcceptedDPA) p += 33
    if (hasConfiguredBot) p += 33
    return p
  }, [waConnected, hasAcceptedDPA, hasConfiguredBot])

  const activeStep = useMemo(() => {
    if (!waConnected) return 1
    if (!hasAcceptedDPA) return 2
    if (!hasConfiguredBot) return 3
    return 4
  }, [waConnected, hasAcceptedDPA, hasConfiguredBot])

  // FB SDK + WA status
  useEffect(() => {
    if (document.getElementById('fb-sdk')) { setFbLoaded(true); return }
    ;(window as any).fbAsyncInit = function () {
      (window as any).FB.init({ appId: process.env.NEXT_PUBLIC_META_APP_ID, autoLogAppEvents: true, xfbml: true, version: 'v21.0' })
      setFbLoaded(true)
    }
    const script = document.createElement('script')
    script.id = 'fb-sdk'; script.src = 'https://connect.facebook.net/en_US/sdk.js'; script.async = true
    document.body.appendChild(script)
    fetch('/api/whatsapp/status').then(r => r.json()).then(d => { 
  if (d.whatsappConnected) {
    setWaConnected(true)
    if (d.phoneNumber) setWaPhoneNumber(d.phoneNumber)
  } 
}).catch(() => {})
  }, [])

  useEffect(() => {
    const handle = (event: MessageEvent) => {
      if (event.origin !== 'https://www.facebook.com') return
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'WA_EMBEDDED_SIGNUP') sendToBackend({ phoneNumberId: data.data.phone_number_id, wabaId: data.data.waba_id })
      } catch {
        if (typeof event.data === 'string' && event.data.includes('code=')) {
          const code = new URLSearchParams(event.data.split('?')[1] || event.data).get('code')
          if (code) sendToBackend({ code })
        }
      }
    }
    const sendToBackend = (payload: any) => {
      fetch('/api/auth/meta/connect', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        .then(r => r.json()).then(d => { if (d.success) { setWaConnected(true); setWaLoading(false) } })
    }
    window.addEventListener('message', handle)
    return () => window.removeEventListener('message', handle)
  }, [])

  const handleSignup = () => {
    if (!(window as any).FB) return
    setWaLoading(true)
    ;(window as any).FB.login((resp: any) => { if (!resp.authResponse) setWaLoading(false) }, {
      config_id: '1984471322183154', response_type: 'code', override_default_response_type: true,
      extras: { setup: {}, featureType: '', sessionInfoVersion: '3' },
    })
  }

  useEffect(() => {
    const fn = (e: MouseEvent) => { if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  if (status === 'loading' || !session) return null

  const userName = session.user?.name || 'Utilisateur'
  const userInitial = userName.charAt(0).toUpperCase()

  // ─── Home Content ──────────────────────────────────────────────────────────
  const HomeContent = () => (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '100%' }}>

      {/* ── SECTION 1 — Status + Quick Actions ── */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

        {/* Alert banners */}
        {alertsList.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {alertsList.map((a, i) => <AlertBanner key={i} {...a} />)}
          </div>
        )}

        {/* Channel status cards + quick actions */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>

          {/* WhatsApp */}
          <div style={{ background: C.cardBg, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: `1px solid ${C.borderLight}`, borderRadius: '16px', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '10px', boxShadow: '0 2px 12px rgba(13,27,46,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <WaIcon size={18} />
                <span style={{ fontSize: '13px', fontWeight: 600, color: C.ink }}>WhatsApp</span>
              </div>
              <StatusBadge 
  status={waConnected ? 'active' : 'disconnected'} 
  label={waConnected ? (waPhoneNumber || 'Connecté') : 'Non connecté'} 
/>
            </div>
            {!waConnected && (
              <button onClick={handleSignup} disabled={!fbLoaded || waLoading} style={{ background: '#25D366', color: '#fff', border: 'none', borderRadius: '8px', padding: '7px 12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', alignSelf: 'flex-start' }}>
                <Wifi size={13} /> {waLoading ? 'Connexion...' : 'Connecter'}
              </button>
            )}
          </div>

          {/* Instagram */}
          <div style={{ background: C.cardBg, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: `1px solid ${C.borderLight}`, borderRadius: '16px', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '10px', boxShadow: '0 2px 12px rgba(13,27,46,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '18px', height: '18px', borderRadius: '5px', background: 'linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IgIcon size={11} />
                </div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: C.ink }}>Instagram</span>
              </div>
              <StatusBadge status="disconnected" label="Bientôt" />
            </div>
          </div>

          {/* Facebook */}
          <div style={{ background: C.cardBg, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: `1px solid ${C.borderLight}`, borderRadius: '16px', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '10px', boxShadow: '0 2px 12px rgba(13,27,46,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '18px', height: '18px', borderRadius: '5px', background: '#1877f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FbIcon size={11} />
                </div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: C.ink }}>Facebook</span>
              </div>
              <StatusBadge status="disconnected" label="Bientôt" />
            </div>
          </div>

          {/* Bot Status */}
          <div style={{ background: C.cardBg, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: `1px solid ${C.borderLight}`, borderRadius: '16px', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '10px', boxShadow: '0 2px 12px rgba(13,27,46,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bot size={18} color={C.blue} />
                <span style={{ fontSize: '13px', fontWeight: 600, color: C.ink }}>Agent IA</span>
              </div>
              <StatusBadge status={botStatus} label={botStatus === 'active' ? 'Actif' : 'En pause'} />
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={() => setBotStatus('active')} disabled={botStatus === 'active'} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', padding: '6px', borderRadius: '7px', border: 'none', background: botStatus === 'active' ? C.greenBg : C.blueLight, color: botStatus === 'active' ? C.green : C.blue, fontSize: '11.5px', fontWeight: 600, cursor: botStatus === 'active' ? 'default' : 'pointer' }}>
                <PlayCircle size={13} /> Activer
              </button>
              <button onClick={() => setBotStatus('paused')} disabled={botStatus === 'paused'} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', padding: '6px', borderRadius: '7px', border: 'none', background: botStatus === 'paused' ? C.amberBg : '#f5f7fa', color: botStatus === 'paused' ? C.amber : C.mid, fontSize: '11.5px', fontWeight: 600, cursor: botStatus === 'paused' ? 'default' : 'pointer' }}>
                <PauseCircle size={13} /> Pause
              </button>
            </div>
          </div>
        </div>

        {/* Quick Actions Row */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={() => setActivePage('inbox')} style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 16px', borderRadius: '10px', background: C.blue, color: '#fff', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 3px 12px rgba(26,107,255,0.25)' }}>
            <Inbox size={15} /> Ouvrir la messagerie
          </button>
          <button onClick={() => {}} style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 16px', borderRadius: '10px', background: C.cardBgSolid, color: C.ink, border: `1px solid ${C.borderLight}`, fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
            <FlaskConical size={15} /> Tester le bot
          </button>
          <button onClick={() => setBotStatus(botStatus === 'active' ? 'paused' : 'active')} style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 16px', borderRadius: '10px', background: C.cardBgSolid, color: botStatus === 'active' ? C.amber : C.green, border: `1px solid ${C.borderLight}`, fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
            {botStatus === 'active' ? <><PauseCircle size={15} /> Pause bot</> : <><PlayCircle size={15} /> Activer bot</>}
          </button>
        </div>
      </section>

      {/* ── SECTION 2 — Conversations needing attention ── */}
      <section style={{ display: 'grid', gridTemplateColumns: failedAutomations.length > 0 ? '1fr 1fr' : '1fr', gap: '16px' }}>

        {/* Waiting conversations */}
        <div style={{ background: C.cardBg, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: `1px solid ${C.borderLight}`, borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(13,27,46,0.05)' }}>
          <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.borderLight}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={15} color={C.amber} />
              <span style={{ fontSize: '13.5px', fontWeight: 700, color: C.ink }}>En attente de réponse</span>
              {waitingConversations.length > 0 && (
                <span style={{ background: C.amberBg, color: C.amber, fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '100px' }}>{waitingConversations.length}</span>
              )}
            </div>
            <button onClick={() => setActivePage('inbox')} style={{ fontSize: '12px', color: C.blue, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Voir tout →</button>
          </div>
          <div>
            {waitingConversations.length === 0 ? (
              <div style={{ padding: '28px', textAlign: 'center', color: C.muted, fontSize: '13px' }}>
                <CheckCircle2 size={24} color={C.green} style={{ marginBottom: '8px', display: 'block', margin: '0 auto 8px' }} />
                Tout est traité ✓
              </div>
            ) : (
              waitingConversations.map((c, i) => (
                <div key={c.id} onClick={() => setActivePage('inbox')} style={{ padding: '12px 18px', borderBottom: i < waitingConversations.length - 1 ? `1px solid ${C.borderLight}` : 'none', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#f7f9ff'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                >
                  <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: C.blueLight, color: C.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, flexShrink: 0 }}>
                    {c.contact.charAt(0)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: C.ink }}>{c.contact}</span>
                      <span style={{ fontSize: '11px', color: C.muted }}>{c.time}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: C.mid, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.preview}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Failed automations — only shown if any */}
        {failedAutomations.length > 0 && (
          <div style={{ background: C.cardBg, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: `1px solid rgba(239,68,68,0.15)`, borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.borderLight}`, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={15} color={C.red} />
              <span style={{ fontSize: '13.5px', fontWeight: 700, color: C.ink }}>Automatisations échouées</span>
              <span style={{ background: C.redBg, color: C.red, fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '100px' }}>{failedAutomations.length}</span>
            </div>
            {failedAutomations.map((f, i) => (
              <div key={f.id} style={{ padding: '12px 18px', borderBottom: i < failedAutomations.length - 1 ? `1px solid ${C.borderLight}` : 'none' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: C.ink }}>{f.name}</div>
                <div style={{ fontSize: '12px', color: C.red }}>{f.error}</div>
                <div style={{ fontSize: '11px', color: C.muted, marginTop: '2px' }}>{f.time}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── SECTION 3 — Stats Today ── */}
      <section>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
          <StatCard label="Messages aujourd'hui" value={waConnected ? 24 : 0} sub={waConnected ? '+12% vs hier' : 'WhatsApp non connecté'} />
          <StatCard label="Conversations traitées" value={waConnected ? 18 : 0} sub={waConnected ? 'par le bot IA' : '—'} accent={C.blue} />
          <StatCard label="Taux de succès" value={waConnected ? '94%' : '—'} sub={waConnected ? '1 échec ce matin' : '—'} accent={C.green} />
          <StatCard label="Temps moy. de réponse" value={waConnected ? '< 1s' : '—'} sub={waConnected ? 'réponse automatique' : '—'} />
        </div>
      </section>

      {/* ── SETUP PROGRESS (if not done) ── */}
      <AnimatePresence>
        {progress < 100 && (
          <motion.section
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ background: C.cardBg, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: `1px solid ${C.borderLight}`, borderRadius: '16px', padding: '18px 20px', boxShadow: '0 2px 12px rgba(13,27,46,0.05)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div>
                <div style={{ fontSize: '13.5px', fontWeight: 700, color: C.ink }}>Configuration ({progress}%)</div>
                <div style={{ fontSize: '12px', color: C.muted, marginTop: '2px' }}>Finalisez ces étapes pour activer pleinement votre agent.</div>
              </div>
              <div style={{ width: '120px', height: '5px', background: C.borderLight, borderRadius: '3px', overflow: 'hidden' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.6 }} style={{ height: '100%', background: `linear-gradient(90deg, ${C.blue}, ${C.skyBlue})`, borderRadius: '3px' }} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
              {[
                { done: waConnected, label: 'Connecter WhatsApp', action: 'Connecter', onClick: handleSignup, color: '#25D366' },
                { done: hasAcceptedDPA, label: 'Valider le DPA', action: 'Compléter', onClick: () => setShowDPAModal(true), color: C.blue },
                { done: hasConfiguredBot, label: 'Configurer le bot', action: 'Configurer', onClick: () => setShowPersonaModal(true), color: C.blue },
              ].map((step, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '10px', background: step.done ? 'rgba(0,200,83,0.07)' : '#f8f9fb', border: `1px solid ${step.done ? 'rgba(0,200,83,0.2)' : C.borderLight}` }}>
                  {step.done ? <CheckCircle2 size={16} color={C.green} /> : <Circle size={16} color={C.muted} />}
                  <span style={{ flex: 1, fontSize: '12.5px', fontWeight: 500, color: step.done ? C.mid : C.ink }}>{step.label}</span>
                  {!step.done && activeStep === i + 1 && (
                    <button onClick={step.onClick} style={{ fontSize: '11.5px', fontWeight: 700, color: step.color, background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
                      {step.action} →
                    </button>
                  )}
                </div>
              ))}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* bottom spacer */}
      <div style={{ height: '4px', flexShrink: 0 }} />
    </div>
  )

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(26,107,255,0.18); border-radius: 10px; }
      `}</style>

      <div style={{ display: 'flex', height: '100dvh', width: '100vw', overflow: 'hidden', fontFamily: "'Inter', -apple-system, sans-serif", background: C.mainBg }}>

        {/* ═══ SIDEBAR ═════════════════════════════════════════════════════════ */}
        <aside style={{
          width: '224px', flexShrink: 0,
          background: C.sidebarBg,
          display: 'flex', flexDirection: 'column',
          borderRight: `1px solid ${C.sideBorder}`,
          position: 'relative', zIndex: 20,
          boxShadow: '4px 0 24px rgba(0,0,0,0.15)',
        }}>
          {/* Logo */}
          <div style={{ height: '64px', display: 'flex', alignItems: 'center', padding: '0 20px', borderBottom: `1px solid ${C.sideBorder}`, flexShrink: 0 }}>
            <img src="/logo.png" alt="" style={{ width: '26px', height: '26px', objectFit: 'contain', marginRight: '10px' }} />
            <span style={{ fontSize: '18px', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>
              Répondly<span style={{ color: C.skyBlue }}>.</span>
            </span>
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '3px', overflowY: 'auto' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.3)', paddingLeft: '10px', marginBottom: '8px' }}>Principal</div>
            {NAV.map(item => {
              const isActive = activePage === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setActivePage(item.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '9px 12px', borderRadius: '10px', border: 'none',
                    background: isActive ? 'rgba(77,184,255,0.14)' : 'transparent',
                    color: isActive ? '#fff' : C.sideText,
                    fontSize: '13.5px', fontWeight: isActive ? 600 : 400,
                    cursor: 'pointer', width: '100%', textAlign: 'left',
                    transition: 'all 0.15s',
                    borderLeft: isActive ? `2px solid ${C.skyBlue}` : '2px solid transparent',
                  }}
                  onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)' }}
                  onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                >
                  <span style={{ opacity: isActive ? 1 : 0.7 }}>{item.icon}</span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {item.badge && (
                    <span style={{ background: C.blue, color: '#fff', fontSize: '10px', fontWeight: 700, padding: '1px 6px', borderRadius: '100px', minWidth: '18px', textAlign: 'center' }}>{item.badge}</span>
                  )}
                </button>
              )
            })}
          </nav>

          {/* Bottom user info */}
          <div style={{ padding: '16px 12px', borderTop: `1px solid ${C.sideBorder}`, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: `linear-gradient(135deg, ${C.blue}, ${C.skyBlue})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                {userInitial}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userName}</div>
                <div style={{ fontSize: '11px', color: C.sideText }}>Administrateur</div>
              </div>
            </div>
          </div>
        </aside>

        {/* ═══ MAIN AREA ═══════════════════════════════════════════════════════ */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

          {/* TOPBAR */}
          <header style={{
            height: '64px', flexShrink: 0,
            background: C.topbarBg,
            backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            borderBottom: `1px solid ${C.borderLight}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 24px', zIndex: 10,
          }}>
            {/* Page title */}
            <div>
              <h1 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: C.ink, letterSpacing: '-0.02em' }}>
                {NAV.find(n => n.id === activePage)?.label || 'Tableau de bord'}
              </h1>
              {activePage === 'home' && (
                <p style={{ margin: 0, fontSize: '12px', color: C.muted }}>
                  {waConnected && botStatus === 'active' ? '✓ Tout fonctionne' : 'Action requise'}
                </p>
              )}
            </div>

            {/* Right actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <a href="https://inbox.repondly.com" target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '9px', background: C.blue, color: '#fff', fontSize: '13px', fontWeight: 600, textDecoration: 'none', boxShadow: '0 2px 10px rgba(26,107,255,0.3)' }}>
                <MessageSquare size={14} /> Messagerie <ExternalLink size={12} style={{ opacity: 0.7 }} />
              </a>

              {/* Profile */}
              <div ref={profileRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  style={{ width: '36px', height: '36px', borderRadius: '50%', background: `linear-gradient(135deg, ${C.blue}, ${C.skyBlue})`, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, color: '#fff', boxShadow: '0 2px 8px rgba(26,107,255,0.3)' }}
                >
                  {userInitial}
                </button>
                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.13 }}
                      style={{ position: 'absolute', top: '44px', right: 0, width: '210px', background: '#fff', border: `1px solid ${C.borderLight}`, borderRadius: '14px', padding: '8px', boxShadow: '0 12px 36px rgba(13,27,46,0.12)', zIndex: 100 }}
                    >
                      <div style={{ padding: '8px 12px 10px', borderBottom: `1px solid ${C.borderLight}`, marginBottom: '4px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: C.ink }}>{userName}</div>
                        <div style={{ fontSize: '11.5px', color: C.muted }}>{session.user?.email}</div>
                      </div>
                      {[
                        { icon: <User size={14} />, label: 'Profil', onClick: () => {} },
                        { icon: <SlidersHorizontal size={14} />, label: 'Préférences', onClick: () => setActivePage('settings') },
                      ].map((item, i) => (
                        <button key={i} onClick={() => { item.onClick(); setProfileOpen(false) }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '9px', padding: '8px 12px', borderRadius: '8px', background: 'none', border: 'none', fontSize: '13px', color: C.ink, cursor: 'pointer', textAlign: 'left', fontWeight: 500, transition: 'background 0.12s' }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.mainBg}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                        >
                          <span style={{ color: C.muted }}>{item.icon}</span>{item.label}
                        </button>
                      ))}
                      <div style={{ height: '1px', background: C.borderLight, margin: '4px 0' }} />
                      <button onClick={() => signOut({ callbackUrl: '/auth/signin' })} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '9px', padding: '8px 12px', borderRadius: '8px', background: 'none', border: 'none', fontSize: '13px', color: C.red, cursor: 'pointer', textAlign: 'left', fontWeight: 500, transition: 'background 0.12s' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#fff5f5'}
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

          {/* PAGE CONTENT */}
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {activePage === 'home' && <HomeContent />}
            {activePage === 'inbox' && <Messagerie />}
            {activePage === 'automations' && (
              <PlaceholderPage
                title="Automatisations"
                icon={<Zap size={28} />}
                description="Créez des règles pour déclencher des réponses automatiques, des notifications et des workflows selon les messages reçus."
              />
            )}
            {activePage === 'bot' && (
              <PlaceholderPage
                title="Configuration du Bot"
                icon={<Bot size={28} />}
                description="Personnalisez la personnalité, le ton, la langue et la base de connaissance de votre agent IA Répondly."
              />
            )}
            {activePage === 'settings' && (
              <PlaceholderPage
                title="Paramètres"
                icon={<Settings size={28} />}
                description="Gérez votre compte, vos abonnements, vos intégrations et les préférences de notification."
              />
            )}
          </div>
        </div>
      </div>

      {/* ═══ DPA MODAL ═══════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showDPAModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDPAModal(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(10,22,48,0.5)', backdropFilter: 'blur(6px)' }} />
            <motion.div initial={{ opacity: 0, y: 20, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
              style={{ position: 'relative', width: '100%', maxWidth: '560px', background: '#fff', borderRadius: '20px', border: `1px solid ${C.borderLight}`, boxShadow: '0 30px 60px rgba(0,0,0,0.2)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '85dvh' }}
            >
              <div style={{ padding: '20px 28px', borderBottom: `1px solid ${C.borderLight}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: C.ink }}>Données & Conformité</h2>
                  <p style={{ margin: '3px 0 0', fontSize: '12.5px', color: C.muted }}>Accord de Traitement des Données (INPDP)</p>
                </div>
                <button onClick={() => setShowDPAModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, padding: '4px' }}><X size={18} /></button>
              </div>
              <div style={{ padding: '24px 28px', overflowY: 'auto', flex: 1 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '24px' }}>
                  {['Ouverture', 'Fermeture'].map((lbl, i) => (
                    <div key={lbl}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: C.mid, marginBottom: '5px' }}>{lbl}</label>
                      <input type="time" defaultValue={i === 0 ? '09:00' : '18:00'} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: `1px solid ${C.borderLight}`, background: C.mainBg, color: C.ink, fontSize: '14px', outline: 'none' }} />
                    </div>
                  ))}
                </div>
                <div
                  onScroll={e => { const t = e.target as HTMLDivElement; if (t.scrollHeight - t.scrollTop <= t.clientHeight + 10) setDpaScrolled(true) }}
                  style={{ height: '180px', overflowY: 'auto', background: C.mainBg, border: `1px solid ${C.borderLight}`, borderRadius: '10px', padding: '14px 16px', fontSize: '12.5px', color: C.mid, lineHeight: 1.7 }}
                >
                  <strong style={{ color: C.ink }}>Accord de Traitement des Données (Loi n° 2004-63)</strong><br /><br />
                  Cet accord fait partie intégrante du contrat entre votre entreprise et Répondly.<br /><br />
                  <strong>1. Nature :</strong> Répondly traite les messages entrants via WhatsApp et réseaux sociaux dans le seul but d'automatiser le service client.<br /><br />
                  <strong>2. Souveraineté :</strong> Conformément à la loi tunisienne n° 2004-63, Répondly agit strictement en tant que sous-traitant. Votre entreprise demeure responsable du traitement.<br /><br />
                  <strong>3. Confidentialité :</strong> Toutes les transcriptions IA sont chiffrées. Le personnel de Répondly n'y accède pas sans autorisation.<br /><br />
                  <strong>4. Suppression :</strong> À la fin du contrat, les données sont purgées sous 30 jours.<br /><br />
                  <em style={{ color: C.muted }}>(Faites défiler pour accepter)</em><br /><br /><br />--- Fin du document ---
                </div>
              </div>
              <div style={{ padding: '16px 28px', borderTop: `1px solid ${C.borderLight}`, background: C.mainBg, display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={() => { setSavingDPA(true); setTimeout(() => { setSavingDPA(false); setShowDPAModal(false); setHasAcceptedDPA(true) }, 1200) }} disabled={!dpaScrolled || savingDPA}
                  style={{ background: dpaScrolled ? C.blue : C.borderLight, color: dpaScrolled ? '#fff' : C.muted, border: 'none', borderRadius: '10px', padding: '10px 22px', fontSize: '13px', fontWeight: 600, cursor: dpaScrolled ? 'pointer' : 'not-allowed', transition: 'all 0.2s', boxShadow: dpaScrolled ? '0 3px 12px rgba(26,107,255,0.3)' : 'none' }}
                >
                  {savingDPA ? 'Signature...' : 'J\'accepte et je signe'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══ PERSONA MODAL ════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showPersonaModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowPersonaModal(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(10,22,48,0.5)', backdropFilter: 'blur(6px)' }} />
            <motion.div initial={{ opacity: 0, y: 20, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
              style={{ position: 'relative', width: '100%', maxWidth: '460px', background: '#fff', borderRadius: '20px', border: `1px solid ${C.borderLight}`, boxShadow: '0 30px 60px rgba(0,0,0,0.2)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
            >
              <div style={{ padding: '20px 28px', borderBottom: `1px solid ${C.borderLight}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: C.ink }}>Configuration de l'IA</h2>
                  <p style={{ margin: '3px 0 0', fontSize: '12.5px', color: C.muted }}>Personnalité et comportement de votre agent</p>
                </div>
                <button onClick={() => setShowPersonaModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted }}><X size={18} /></button>
              </div>
              <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {[
                  { label: 'Langue principale', options: ['Détection Auto (Darija/Fr/Ar)', 'Darija Tunisien Strict', 'Français Strict'] },
                  { label: 'Ton de la voix', options: ['Professionnel & Poli (Cliniques/B2B)', 'Amical & Décontracté (E-commerce/Resto)'] },
                ].map(field => (
                  <div key={field.label}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: C.mid, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{field.label}</label>
                    <select style={{ width: '100%', padding: '10px 13px', borderRadius: '9px', border: `1px solid ${C.borderLight}`, background: C.mainBg, color: C.ink, fontSize: '13.5px', outline: 'none' }}>
                      {field.options.map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              <div style={{ padding: '16px 28px', borderTop: `1px solid ${C.borderLight}`, background: C.mainBg, display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={() => { setSavingPersona(true); setTimeout(() => { setSavingPersona(false); setShowPersonaModal(false); setHasConfiguredBot(true); setBotStatus('active') }, 1200) }}
                  style={{ background: C.blue, color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 22px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 3px 12px rgba(26,107,255,0.3)' }}
                >
                  {savingPersona ? 'Activation...' : 'Activer le Bot'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}