'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Messagerie from './messagerie/MessagerieView'
import {
  LayoutDashboard, Inbox, Zap, Bot, Settings,
  MessageSquare, CheckCircle2, PauseCircle, PlayCircle,
  LogOut, User, X, Clock, Wifi, WifiOff,
  SlidersHorizontal, Sparkles, ChevronRight,
  Bell, Search, BarChart2, Users, ArrowUpRight,
  Circle, AlertTriangle
} from 'lucide-react'

// ─── Channel SVG Icons ────────────────────────────────────────────────────────
const WaIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <path d="M16 2C8.268 2 2 8.268 2 16c0 2.4.627 4.65 1.72 6.6L2 30l7.6-1.694A13.93 13.93 0 0016 30c7.732 0 14-6.268 14-14S23.732 2 16 2z" fill="#25D366"/>
    <path d="M22.5 19.5c-.3-.15-1.8-.9-2.1-1-.3-.1-.5-.15-.7.15-.2.3-.8 1-.95 1.2-.18.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.47-.89-.79-1.48-1.76-1.66-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.7-1.68-.96-2.3-.25-.6-.5-.52-.7-.53-.18-.01-.38-.01-.58-.01-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.22 3.08.15.2 2.1 3.2 5.08 4.49.71.31 1.27.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.8-.74 2.05-1.45.25-.71.25-1.32.17-1.45-.07-.13-.27-.2-.57-.35z" fill="white"/>
  </svg>
)

const IgIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
)

const FbIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
)

// ─── Types ────────────────────────────────────────────────────────────────────
type PageId = 'home' | 'inbox' | 'automations' | 'bot' | 'settings'
type BotStatus = 'active' | 'paused'
type ConnStatus = 'connected' | 'disconnected' | 'loading'

interface ConnectedPage {
  id: string
  pageId: string
  pageName: string
  channel: 'FACEBOOK' | 'INSTAGRAM'
  chatwootInboxId: number | null
}

// ─── Nav ──────────────────────────────────────────────────────────────────────
const NAV: { id: PageId; label: string; icon: React.ReactNode }[] = [
  { id: 'home',        label: 'Accueil',        icon: <LayoutDashboard size={16} /> },
  { id: 'inbox',       label: 'Messagerie',      icon: <Inbox size={16} /> },
  { id: 'automations', label: 'Automatisations', icon: <Zap size={16} /> },
  { id: 'bot',         label: 'Agent IA',        icon: <Bot size={16} /> },
  { id: 'settings',    label: 'Paramètres',      icon: <Settings size={16} /> },
]

// ─── Pill Badge ───────────────────────────────────────────────────────────────
function Pill({ status, label }: { status: 'ok' | 'off' | 'warn'; label: string }) {
  const cfg = {
    ok:   { bg: '#f0fdf4', color: '#16a34a', dot: '#22c55e' },
    off:  { bg: '#f8fafc', color: '#94a3b8', dot: '#cbd5e1' },
    warn: { bg: '#fffbeb', color: '#d97706', dot: '#f59e0b' },
  }[status]
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 8px', borderRadius: 100, background: cfg.bg, fontSize: 11, fontWeight: 600, color: cfg.color, letterSpacing: '0.01em' }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
      {label}
    </span>
  )
}

// ─── Channel Card ─────────────────────────────────────────────────────────────
function ChannelCard({
  icon, iconBg, label, status, sublabel, onConnect, connecting, canConnect,
}: {
  icon: React.ReactNode
  iconBg: string
  label: string
  status: 'ok' | 'off' | 'warn'
  sublabel: string
  onConnect?: () => void
  connecting?: boolean
  canConnect?: boolean
}) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e2e8f0',
      borderRadius: 14,
      padding: '16px 18px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      transition: 'box-shadow 0.15s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: iconBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          {icon}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 2 }}>{label}</div>
          <Pill status={status} label={sublabel} />
        </div>
      </div>
      {onConnect && status === 'off' && (
        <button
          onClick={onConnect}
          disabled={!canConnect || connecting}
          style={{
            flexShrink: 0,
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '6px 12px', borderRadius: 8, border: '1px solid #e2e8f0',
            background: '#f8fafc', color: '#374151',
            fontSize: 12, fontWeight: 600, cursor: connecting || !canConnect ? 'not-allowed' : 'pointer',
            opacity: !canConnect || connecting ? 0.5 : 1,
            transition: 'all 0.15s',
            whiteSpace: 'nowrap',
          }}
        >
          <Wifi size={12} />
          {connecting ? 'Connexion…' : 'Connecter'}
        </button>
      )}
    </div>
  )
}

// ─── Step Card ────────────────────────────────────────────────────────────────
function StepCard({ done, label, cta, onClick }: { done: boolean; label: string; cta: string; onClick: () => void }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 16px', borderRadius: 12,
      background: done ? '#f0fdf4' : '#f8fafc',
      border: `1px solid ${done ? '#bbf7d0' : '#e2e8f0'}`,
    }}>
      <div style={{
        width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
        background: done ? '#22c55e' : '#e2e8f0',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {done
          ? <CheckCircle2 size={13} color="#fff" strokeWidth={2.5} />
          : <Circle size={13} color="#94a3b8" strokeWidth={2} />}
      </div>
      <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: done ? '#15803d' : '#374151' }}>{label}</span>
      {!done && (
        <button onClick={onClick} style={{
          fontSize: 12, fontWeight: 700, color: '#6366f1',
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0,
        }}>
          {cta} <ChevronRight size={13} />
        </button>
      )}
    </div>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon }: { label: string; value: string | number; sub: string; icon: React.ReactNode }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14,
      padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
        <span style={{ color: '#94a3b8' }}>{icon}</span>
      </div>
      <div>
        <div style={{ fontSize: 28, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.03em', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{sub}</div>
      </div>
    </div>
  )
}

// ─── Placeholder ──────────────────────────────────────────────────────────────
function ComingSoon({ title, description, icon }: { title: string; description: string; icon: React.ReactNode }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 48 }}>
      <div style={{ width: 60, height: 60, borderRadius: 16, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
        {icon}
      </div>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 700, color: '#0f172a' }}>{title}</h2>
        <p style={{ margin: 0, fontSize: 13.5, color: '#64748b', maxWidth: 320, lineHeight: 1.6 }}>{description}</p>
      </div>
      <div style={{ padding: '6px 16px', background: '#f1f5f9', borderRadius: 100, fontSize: 11.5, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        Bientôt disponible
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DashboardShell() {
  const { data: session, status } = useSession()

  const [activePage, setActivePage] = useState<PageId>('home')
  const [botStatus, setBotStatus]   = useState<BotStatus>('paused')
  const [fbLoaded, setFbLoaded]     = useState(false)

  // WhatsApp
  const [waConnected, setWaConnected]     = useState(false)
  const [waPhone, setWaPhone]             = useState<string | null>(null)
  const [waLoading, setWaLoading]         = useState(false)

  // Facebook / Instagram
  const [fbPages, setFbPages]             = useState<ConnectedPage[]>([])
  const [fbConnecting, setFbConnecting]   = useState(false)

  // Onboarding
  const [hasAcceptedDPA, setHasAcceptedDPA]       = useState(false)
  const [hasConfiguredBot, setHasConfiguredBot]   = useState(false)
  const [showDPAModal, setShowDPAModal]           = useState(false)
  const [dpaScrolled, setDpaScrolled]             = useState(false)
  const [savingDPA, setSavingDPA]                 = useState(false)
  const [showBotModal, setShowBotModal]           = useState(false)
  const [savingBot, setSavingBot]                 = useState(false)

  // Profile dropdown
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  // ── Fetch FB/IG pages ──────────────────────────────────────────────────────
  const fetchFbPages = useCallback(async () => {
    try {
      const res = await fetch('/api/meta/pages')
      const data = await res.json()
      if (data.pages) setFbPages(data.pages)
    } catch {}
  }, [])

  // ── Boot ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    // Load Meta JS SDK
    if (!document.getElementById('fb-sdk')) {
      ;(window as any).fbAsyncInit = () => {
        ;(window as any).FB.init({
          appId: process.env.NEXT_PUBLIC_META_APP_ID,
          cookie: true, xfbml: false, version: 'v21.0',
        })
        setFbLoaded(true)
      }
      const s = document.createElement('script')
      s.id = 'fb-sdk'
      s.src = 'https://connect.facebook.net/en_US/sdk.js'
      s.async = true
      document.body.appendChild(s)
    } else {
      setFbLoaded(true)
    }

    // WA status
    fetch('/api/whatsapp/status')
      .then(r => r.json())
      .then(d => {
        if (d.whatsappConnected) { setWaConnected(true); if (d.phoneNumber) setWaPhone(d.phoneNumber) }
      }).catch(() => {})

    // FB/IG pages
    fetchFbPages()
  }, [fetchFbPages])

  // ── WA embedded signup message listener ───────────────────────────────────
  useEffect(() => {
    const handle = (e: MessageEvent) => {
      if (e.origin !== 'https://www.facebook.com') return
      const sendPayload = (payload: any) => {
        fetch('/api/auth/meta/connect', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }).then(r => r.json()).then(d => {
          if (d.success) { setWaConnected(true); setWaLoading(false) }
        })
      }
      try {
        const data = JSON.parse(e.data)
        if (data.type === 'WA_EMBEDDED_SIGNUP')
          sendPayload({ phoneNumberId: data.data.phone_number_id, wabaId: data.data.waba_id })
      } catch {
        if (typeof e.data === 'string' && e.data.includes('code=')) {
          const code = new URLSearchParams(e.data.split('?')[1] || e.data).get('code')
          if (code) sendPayload({ code })
        }
      }
    }
    window.addEventListener('message', handle)
    return () => window.removeEventListener('message', handle)
  }, [])

  // ── Close profile on outside click ────────────────────────────────────────
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleWaConnect = () => {
    if (!(window as any).FB) return
    setWaLoading(true)
    ;(window as any).FB.login(
      (resp: any) => { if (!resp.authResponse) setWaLoading(false) },
      {
        config_id: process.env.NEXT_PUBLIC_META_CONFIG_ID,
        response_type: 'code', override_default_response_type: true,
        extras: { setup: {}, featureType: '', sessionInfoVersion: '3' },
      }
    )
  }

  const handleFbConnect = () => {
    if (!(window as any).FB) return
    setFbConnecting(true)
    ;(window as any).FB.login(async (resp: any) => {
      if (!resp.authResponse?.accessToken) { setFbConnecting(false); return }
      try {
        const res = await fetch('/api/auth/meta/connect', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fbAccessToken: resp.authResponse.accessToken }),
        })
        const data = await res.json()
        if (data.success) await fetchFbPages()
      } finally {
        setFbConnecting(false)
      }
    }, {
      scope: 'pages_show_list,pages_messaging,pages_read_engagement,instagram_basic,instagram_manage_messages',
      return_scopes: true, auth_type: 'rerequest',
    })
  }

  if (status === 'loading' || !session) return null

  const userName    = session.user?.name || 'Utilisateur'
  const userEmail   = session.user?.email || ''
  const userInitial = userName.charAt(0).toUpperCase()

  const igPages  = fbPages.filter(p => p.channel === 'INSTAGRAM')
  const fbConnected = fbPages.filter(p => p.channel === 'FACEBOOK')
  const igConnected = igPages.length > 0
  const fbIsConn    = fbConnected.length > 0

  const setupDone = waConnected && hasAcceptedDPA && hasConfiguredBot
  const setupCount = [waConnected, hasAcceptedDPA, hasConfiguredBot].filter(Boolean).length

  // ─── Home ──────────────────────────────────────────────────────────────────
  const HomeContent = () => (
    <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Header */}
      <div>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.025em' }}>
          Bonjour, {userName.split(' ')[0]} 👋
        </h2>
        <p style={{ margin: '4px 0 0', fontSize: 13.5, color: '#64748b' }}>
          {setupDone
            ? botStatus === 'active' ? 'Votre agent IA est actif et répond à vos clients.' : 'Agent IA en pause — activez-le pour reprendre les réponses automatiques.'
            : `Configuration ${setupCount}/3 — quelques étapes restantes pour démarrer.`}
        </p>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <StatCard label="Conversations" value="—" sub="ce mois-ci" icon={<MessageSquare size={16} />} />
        <StatCard label="Réponses auto" value="—" sub="par le bot" icon={<Bot size={16} />} />
        <StatCard label="Canaux actifs" value={[waConnected, fbIsConn, igConnected].filter(Boolean).length} sub="sur 3 disponibles" icon={<Wifi size={16} />} />
        <StatCard label="Taux de réponse" value="—" sub="automatisé" icon={<BarChart2 size={16} />} />
      </div>

      {/* Channels */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
          Canaux connectés
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          <ChannelCard
            icon={<WaIcon size={18} />}
            iconBg="#dcfce7"
            label="WhatsApp"
            status={waConnected ? 'ok' : 'off'}
            sublabel={waConnected ? (waPhone || 'Connecté') : 'Non connecté'}
            onConnect={handleWaConnect}
            connecting={waLoading}
            canConnect={fbLoaded}
          />
          <ChannelCard
            icon={<span style={{ color: '#1877F2' }}><FbIcon size={16} /></span>}
            iconBg="#eff6ff"
            label="Facebook"
            status={fbIsConn ? 'ok' : 'off'}
            sublabel={fbIsConn ? fbConnected[0].pageName : 'Non connecté'}
            onConnect={handleFbConnect}
            connecting={fbConnecting}
            canConnect={fbLoaded}
          />
          <ChannelCard
            icon={<span style={{ background: 'linear-gradient(135deg,#f09433,#dc2743,#bc1888)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}><IgIcon size={16} /></span>}
            iconBg="#fdf2f8"
            label="Instagram"
            status={igConnected ? 'ok' : 'off'}
            sublabel={igConnected ? igPages[0].pageName : 'Non connecté'}
            onConnect={handleFbConnect}
            connecting={fbConnecting}
            canConnect={fbLoaded}
          />
        </div>
      </div>

      {/* Setup checklist — hidden once done */}
      <AnimatePresence>
        {!setupDone && (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Mise en service</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{setupCount} / 3 étapes complétées</div>
              </div>
              {/* Progress bar */}
              <div style={{ width: 80, height: 4, borderRadius: 100, background: '#f1f5f9', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(setupCount / 3) * 100}%`, background: '#22c55e', borderRadius: 100, transition: 'width 0.4s' }} />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <StepCard done={waConnected}      label="Connecter WhatsApp Business"        cta="Connecter"   onClick={handleWaConnect} />
              <StepCard done={hasAcceptedDPA}   label="Valider l'accord de conformité DPA" cta="Signer"      onClick={() => setShowDPAModal(true)} />
              <StepCard done={hasConfiguredBot} label="Configurer votre agent IA"          cta="Configurer"  onClick={() => setShowBotModal(true)} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick actions */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
          Actions rapides
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[
            { label: 'Ouvrir la messagerie', icon: <Inbox size={14} />, primary: true,  onClick: () => setActivePage('inbox') },
            { label: 'Configurer le bot',    icon: <Bot size={14} />,   primary: false, onClick: () => setShowBotModal(true) },
            { label: botStatus === 'active' ? 'Mettre en pause' : 'Activer le bot', icon: botStatus === 'active' ? <PauseCircle size={14} /> : <PlayCircle size={14} />, primary: false, onClick: () => setBotStatus(s => s === 'active' ? 'paused' : 'active') },
          ].map((a, i) => (
            <button key={i} onClick={a.onClick} style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '9px 16px', borderRadius: 10,
              background: a.primary ? '#6366f1' : '#fff',
              color: a.primary ? '#fff' : '#374151',
              border: a.primary ? 'none' : '1px solid #e2e8f0',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              boxShadow: a.primary ? '0 2px 12px rgba(99,102,241,0.25)' : 'none',
              transition: 'all 0.15s',
            }}>
              {a.icon}{a.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bot status card */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '18px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            background: botStatus === 'active' ? '#f0fdf4' : '#f8fafc',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: botStatus === 'active' ? '#22c55e' : '#94a3b8',
          }}>
            <Bot size={20} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Agent IA Répondly</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
              {botStatus === 'active' ? 'Répond automatiquement en Darija, Français et Arabe' : 'En pause — les messages ne reçoivent pas de réponse automatique'}
            </div>
          </div>
        </div>
        <button
          onClick={() => setBotStatus(s => s === 'active' ? 'paused' : 'active')}
          style={{
            padding: '8px 18px', borderRadius: 10, cursor: 'pointer',
            background: botStatus === 'active' ? '#fff7ed' : '#f0fdf4',
            color: botStatus === 'active' ? '#c2410c' : '#16a34a',
            fontSize: 12.5, fontWeight: 700,
            border: `1px solid ${botStatus === 'active' ? '#fed7aa' : '#bbf7d0'}`,
            display: 'flex', alignItems: 'center', gap: 6,
          } as any}>
          {botStatus === 'active' ? <><PauseCircle size={14} /> Mettre en pause</> : <><PlayCircle size={14} /> Activer</>}
        </button>
      </div>

      <div style={{ height: 8 }} />
    </div>
  )

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', -apple-system, sans-serif; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        button { font-family: inherit; }
      `}</style>

      <div style={{ display: 'flex', height: '100dvh', width: '100vw', overflow: 'hidden', background: '#f8fafc', fontFamily: "'DM Sans', sans-serif" }}>

        {/* ══ SIDEBAR ══════════════════════════════════════════════════════════ */}
        <aside style={{
          width: 230, flexShrink: 0,
          background: '#0f172a',
          display: 'flex', flexDirection: 'column',
          borderRight: '1px solid rgba(255,255,255,0.05)',
        }}>
          {/* Logo */}
          <div style={{ height: 64, display: 'flex', alignItems: 'center', padding: '0 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
            <Image
              src="/logo.png"
              alt="Répondly"
              width={120}
              height={32}
              style={{ objectFit: 'contain', objectPosition: 'left' }}
              priority
            />
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, padding: '16px 10px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0 10px', marginBottom: 8 }}>
              Navigation
            </div>
            {NAV.map(item => {
              const active = activePage === item.id
              return (
                <button key={item.id} onClick={() => setActivePage(item.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 12px', borderRadius: 10, border: 'none',
                  background: active ? 'rgba(99,102,241,0.15)' : 'transparent',
                  color: active ? '#fff' : 'rgba(255,255,255,0.45)',
                  fontSize: 13.5, fontWeight: active ? 600 : 400,
                  cursor: 'pointer', width: '100%', textAlign: 'left',
                  transition: 'all 0.12s',
                  borderLeft: active ? '2px solid #6366f1' : '2px solid transparent',
                }}>
                  <span style={{ opacity: active ? 1 : 0.7, flexShrink: 0 }}>{item.icon}</span>
                  <span>{item.label}</span>
                  {item.id === 'inbox' && (
                    <span style={{ marginLeft: 'auto', background: '#6366f1', color: '#fff', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 100 }}>
                      Nouveau
                    </span>
                  )}
                </button>
              )
            })}
          </nav>

          {/* Bot status indicator in sidebar */}
          <div style={{ padding: '10px 12px', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 10,
              background: 'rgba(255,255,255,0.04)',
            }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                background: botStatus === 'active' ? '#22c55e' : '#f59e0b',
                boxShadow: botStatus === 'active' ? '0 0 6px #22c55e' : '0 0 6px #f59e0b',
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>Agent IA</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
                  {botStatus === 'active' ? 'Actif' : 'En pause'}
                </div>
              </div>
            </div>
          </div>

          {/* User footer */}
          <div style={{ padding: '10px 12px 16px', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.04)' }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, color: '#fff',
              }}>
                {userInitial}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userName}</div>
                <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userEmail}</div>
              </div>
              <button onClick={() => signOut({ callbackUrl: '/auth/signin' })} title="Déconnexion" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.25)', padding: 4, display: 'flex', flexShrink: 0 }}>
                <LogOut size={14} />
              </button>
            </div>
          </div>
        </aside>

        {/* ══ MAIN ═════════════════════════════════════════════════════════════ */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

          {/* Topbar */}
          <header style={{
            height: 60, flexShrink: 0,
            background: '#fff',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 28px',
          }}>
            <div>
              <h1 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.01em' }}>
                {NAV.find(n => n.id === activePage)?.label}
              </h1>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Channels quick status */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 100, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: waConnected ? '#22c55e' : '#e2e8f0', flexShrink: 0 }} />
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: fbIsConn ? '#22c55e' : '#e2e8f0', flexShrink: 0 }} />
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: igConnected ? '#22c55e' : '#e2e8f0', flexShrink: 0 }} />
                <span style={{ fontSize: 11.5, color: '#94a3b8', marginLeft: 2 }}>canaux</span>
              </div>

              {/* Profile */}
              <div ref={profileRef} style={{ position: 'relative' }}>
                <button onClick={() => setProfileOpen(v => !v)} style={{
                  width: 34, height: 34, borderRadius: '50%', border: 'none', cursor: 'pointer',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  fontSize: 13, fontWeight: 700, color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {userInitial}
                </button>

                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.96 }}
                      transition={{ duration: 0.12 }}
                      style={{
                        position: 'absolute', top: 42, right: 0, width: 200,
                        background: '#fff', border: '1px solid #e2e8f0',
                        borderRadius: 14, padding: 6,
                        boxShadow: '0 8px 30px rgba(0,0,0,0.08)', zIndex: 100,
                      }}>
                      <div style={{ padding: '8px 10px 10px', borderBottom: '1px solid #f1f5f9', marginBottom: 4 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{userName}</div>
                        <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 1 }}>{userEmail}</div>
                      </div>
                      {[
                        { icon: <SlidersHorizontal size={13} />, label: 'Paramètres', onClick: () => { setActivePage('settings'); setProfileOpen(false) } },
                        { icon: <LogOut size={13} />, label: 'Déconnexion', danger: true, onClick: () => signOut({ callbackUrl: '/auth/signin' }) },
                      ].map((item, i) => (
                        <button key={i} onClick={item.onClick} style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                          padding: '8px 10px', borderRadius: 8, background: 'none', border: 'none',
                          fontSize: 13, fontWeight: 500, cursor: 'pointer', textAlign: 'left',
                          color: (item as any).danger ? '#ef4444' : '#374151',
                          transition: 'background 0.1s',
                        }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = (item as any).danger ? '#fef2f2' : '#f8fafc'}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                        >
                          <span style={{ color: (item as any).danger ? '#ef4444' : '#94a3b8' }}>{item.icon}</span>
                          {item.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </header>

          {/* Page content */}
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {activePage === 'home'        && <HomeContent />}
            {activePage === 'inbox'       && <Messagerie />}
            {activePage === 'automations' && <ComingSoon title="Automatisations" description="Créez des règles pour déclencher des réponses automatiques selon le canal, le mot-clé, ou l'heure." icon={<Zap size={26} />} />}
            {activePage === 'bot'         && <ComingSoon title="Configuration de l'Agent IA" description="Personnalisez la langue, le ton, la base de connaissances et le comportement de votre agent." icon={<Bot size={26} />} />}
            {activePage === 'settings'    && <ComingSoon title="Paramètres" description="Gérez votre compte, votre abonnement et vos préférences de notification." icon={<Settings size={26} />} />}
          </div>
        </div>
      </div>

      {/* ══ DPA MODAL ════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showDPAModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowDPAModal(false)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)' }} />
            <motion.div initial={{ opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
              style={{
                position: 'relative', width: '100%', maxWidth: 520,
                background: '#fff', borderRadius: 20, border: '1px solid #e2e8f0',
                boxShadow: '0 24px 60px rgba(0,0,0,0.12)',
                display: 'flex', flexDirection: 'column', maxHeight: '85dvh', overflow: 'hidden',
              }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0 }}>Accord de Traitement des Données</h2>
                  <p style={{ margin: '4px 0 0', fontSize: 12.5, color: '#94a3b8' }}>Conformité INPDP — Loi n° 2004-63</p>
                </div>
                <button onClick={() => setShowDPAModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4 }}><X size={18} /></button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
                <div
                  onScroll={e => {
                    const t = e.target as HTMLDivElement
                    if (t.scrollHeight - t.scrollTop <= t.clientHeight + 20) setDpaScrolled(true)
                  }}
                  style={{ height: 200, overflowY: 'auto', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 16px', fontSize: 13, color: '#374151', lineHeight: 1.75 }}>
                  <strong style={{ color: '#0f172a' }}>1. Objet</strong><br />
                  Cet accord définit les conditions dans lesquelles Répondly traite les données de vos clients au nom de votre entreprise.<br /><br />
                  <strong style={{ color: '#0f172a' }}>2. Rôles</strong><br />
                  Votre entreprise est responsable du traitement. Répondly agit exclusivement en tant que sous-traitant, conformément à la loi tunisienne n° 2004-63 relative à la protection des données personnelles.<br /><br />
                  <strong style={{ color: '#0f172a' }}>3. Nature des données traitées</strong><br />
                  Messages entrants WhatsApp, Instagram, Facebook. Numéros de téléphone et identifiants utilisateurs fournis par les plateformes.<br /><br />
                  <strong style={{ color: '#0f172a' }}>4. Sécurité</strong><br />
                  Toutes les données sont chiffrées en transit (TLS 1.3) et au repos. L'accès est restreint au personnel autorisé uniquement.<br /><br />
                  <strong style={{ color: '#0f172a' }}>5. Durée et suppression</strong><br />
                  Les données sont conservées pendant la durée du contrat et purgées sous 30 jours après résiliation.<br /><br />
                  <em style={{ color: '#94a3b8', fontSize: 12 }}>Faites défiler jusqu'en bas pour activer la signature.</em>
                </div>
              </div>

              <div style={{ padding: '16px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc' }}>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>
                  {dpaScrolled ? '✓ Document lu' : 'Lisez le document pour continuer'}
                </span>
                <button
                  onClick={() => {
                    setSavingDPA(true)
                    setTimeout(() => { setSavingDPA(false); setShowDPAModal(false); setHasAcceptedDPA(true) }, 1000)
                  }}
                  disabled={!dpaScrolled || savingDPA}
                  style={{
                    padding: '9px 20px', borderRadius: 10, border: 'none', cursor: dpaScrolled ? 'pointer' : 'not-allowed',
                    background: dpaScrolled ? '#6366f1' : '#e2e8f0',
                    color: dpaScrolled ? '#fff' : '#94a3b8',
                    fontSize: 13, fontWeight: 600,
                    transition: 'all 0.2s',
                  }}>
                  {savingDPA ? 'Signature…' : 'Accepter et signer'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══ BOT MODAL ════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showBotModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowBotModal(false)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)' }} />
            <motion.div initial={{ opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
              style={{
                position: 'relative', width: '100%', maxWidth: 440,
                background: '#fff', borderRadius: 20, border: '1px solid #e2e8f0',
                boxShadow: '0 24px 60px rgba(0,0,0,0.12)', overflow: 'hidden',
              }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0 }}>Configuration de l'Agent IA</h2>
                  <p style={{ margin: '4px 0 0', fontSize: 12.5, color: '#94a3b8' }}>Personnalité et comportement</p>
                </div>
                <button onClick={() => setShowBotModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4 }}><X size={18} /></button>
              </div>

              <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
                {[
                  {
                    label: 'Langue principale',
                    options: ['Détection auto (Darija / Français / Arabe)', 'Darija Tunisien uniquement', 'Français uniquement', 'Arabe littéraire uniquement'],
                  },
                  {
                    label: 'Ton de réponse',
                    options: ['Professionnel et courtois', 'Amical et décontracté', 'Formel (cliniques, cabinets, B2B)'],
                  },
                  {
                    label: 'Secteur d\'activité',
                    options: ['Salon de beauté / Coiffure', 'Clinique / Cabinet médical', 'Restaurant / Café', 'Salle de sport / Fitness', 'E-commerce', 'Autre'],
                  },
                ].map(field => (
                  <div key={field.label}>
                    <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 7 }}>
                      {field.label}
                    </label>
                    <select style={{
                      width: '100%', padding: '10px 12px', borderRadius: 10,
                      border: '1px solid #e2e8f0', background: '#f8fafc',
                      color: '#0f172a', fontSize: 13.5, outline: 'none',
                      fontFamily: 'inherit',
                    }}>
                      {field.options.map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
              </div>

              <div style={{ padding: '16px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', background: '#f8fafc' }}>
                <button
                  onClick={() => {
                    setSavingBot(true)
                    setTimeout(() => { setSavingBot(false); setShowBotModal(false); setHasConfiguredBot(true); setBotStatus('active') }, 1000)
                  }}
                  style={{
                    padding: '9px 22px', borderRadius: 10, border: 'none', cursor: 'pointer',
                    background: '#6366f1', color: '#fff', fontSize: 13, fontWeight: 600,
                    boxShadow: '0 2px 12px rgba(99,102,241,0.3)',
                  }}>
                  {savingBot ? 'Activation…' : 'Activer l\'agent'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}