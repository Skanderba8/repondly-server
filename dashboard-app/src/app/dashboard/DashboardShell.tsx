'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Messagerie from './messagerie/MessagerieView'
import {
  LayoutDashboard, Inbox, Zap, Bot, Settings,
  MessageSquare, CheckCircle2, PauseCircle, PlayCircle,
  LogOut, X, Wifi, Search, BarChart2,
  Circle, AlertCircle, RefreshCw, ChevronRight, Check
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

interface ConnectedPage {
  id: string
  pageId: string
  pageName: string
  channel: 'FACEBOOK' | 'INSTAGRAM'
  chatwootInboxId: number | null
}

const NAV: { id: PageId; label: string; icon: React.ReactNode }[] = [
  { id: 'home',        label: 'Accueil',        icon: <LayoutDashboard size={16} /> },
  { id: 'inbox',       label: 'Messagerie',      icon: <Inbox size={16} /> },
  { id: 'automations', label: 'Automatisations', icon: <Zap size={16} /> },
  { id: 'bot',         label: 'Agent IA',        icon: <Bot size={16} /> },
  { id: 'settings',    label: 'Paramètres',      icon: <Settings size={16} /> },
]

// ─── Helper Components ────────────────────────────────────────────────────────
function Pill({ active, label }: { active: boolean; label: string }) {
  const bg = active ? '#f0fdf4' : '#f1f5f9'
  const color = active ? '#16a34a' : '#64748b'
  const dot = active ? '#22c55e' : '#cbd5e1'
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 8px', borderRadius: 6, background: bg, fontSize: 11, fontWeight: 600, color }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: dot, flexShrink: 0 }} />
      {label}
    </span>
  )
}

function StatCard({ label, value, sub, loading }: { label: string; value: string | number; sub: string; loading?: boolean }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      {loading ? (
        <div style={{ height: 32, width: 60, background: '#f1f5f9', borderRadius: 6, animation: 'pulse 1.5s infinite' }} />
      ) : (
        <div style={{ fontSize: 32, fontWeight: 700, color: '#0f172a', lineHeight: 1 }}>{value}</div>
      )}
      <div style={{ fontSize: 12, color: '#94a3b8' }}>{sub}</div>
    </div>
  )
}

function StepRow({ done, label, cta, onClick }: { done: boolean; label: string; cta: string; onClick: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
      <div style={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0, background: done ? '#22c55e' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {done ? <Check size={12} color="#fff" strokeWidth={3} /> : <Circle size={10} color="#cbd5e1" strokeWidth={3} />}
      </div>
      <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: done ? '#64748b' : '#0f172a', textDecoration: done ? 'line-through' : 'none' }}>{label}</span>
      {!done && (
        <button onClick={onClick} style={{ fontSize: 12, fontWeight: 600, color: '#4f46e5', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}>
          {cta} <ChevronRight size={14} />
        </button>
      )}
    </div>
  )
}

function ChannelRow({ icon, name, isConnected, onConnect, loading }: { icon: React.ReactNode, name: string, isConnected: boolean, onConnect: () => void, loading: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {icon}
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{name}</div>
          <Pill active={isConnected} label={isConnected ? 'Connecté' : 'Non connecté'} />
        </div>
      </div>
      {!isConnected && (
        <button onClick={onConnect} disabled={loading} style={{
          padding: '6px 12px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', fontSize: 12, fontWeight: 600, color: '#0f172a', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: 6
        }}>
          {loading ? <RefreshCw size={12} className="spin" /> : <Wifi size={12} />}
          Lier
        </button>
      )}
    </div>
  )
}


// ─── Main Application Component ───────────────────────────────────────────────
export default function DashboardClient() {
  const { data: session, status } = useSession()

  const [activePage, setActivePage] = useState<PageId>('home')
  const [botStatus, setBotStatus]   = useState<BotStatus>('paused')
  const [fbLoaded, setFbLoaded]     = useState(false)

  // System States & Errors
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [loadingData, setLoadingData] = useState(true)

  // Channels
  const [waConnected, setWaConnected]     = useState(false)
  const [waLoading, setWaLoading]         = useState(false)
  const [fbPages, setFbPages]             = useState<ConnectedPage[]>([])
  const [fbConnecting, setFbConnecting]   = useState(false)

  // Onboarding
  const [hasAcceptedDPA, setHasAcceptedDPA]       = useState(false)
  const [hasConfiguredBot, setHasConfiguredBot]   = useState(false)

  // Helper to show real-time errors
  const triggerError = useCallback((msg: string) => {
    setErrorMsg(msg)
    setTimeout(() => setErrorMsg(null), 6000)
  }, [])

  // ── Fetch Initial Real Data ────────────────────────────────────────────────
  const fetchConnections = useCallback(async () => {
    setLoadingData(true)
    try {
      // 1. Fetch FB/IG
      const resFb = await fetch('/api/meta/pages')
      if (!resFb.ok) throw new Error(`Erreur Meta: ${resFb.statusText}`)
      const dataFb = await resFb.json()
      if (dataFb.pages) setFbPages(dataFb.pages)

      // 2. Fetch WA Status
      const resWa = await fetch('/api/whatsapp/status')
      if (!resWa.ok) throw new Error(`Erreur WhatsApp: ${resWa.statusText}`)
      const dataWa = await resWa.json()
      if (dataWa.whatsappConnected) setWaConnected(true)

      // 3. Fetch specific business settings (DPA/Bot) if you have an endpoint for it
      // For now, we mock the retrieval success
    } catch (err: any) {
      triggerError(err.message || 'Échec du chargement des données. Veuillez rafraîchir.')
    } finally {
      setLoadingData(false)
    }
  }, [triggerError])

  // ── Boot ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    function initFB() {
      ;(window as any).FB.init({
        appId: process.env.NEXT_PUBLIC_META_APP_ID,
        cookie: true, xfbml: false, version: 'v21.0',
      })
      setFbLoaded(true)
    }

    if ((window as any).FB) {
      initFB()
    } else {
      ;(window as any).fbAsyncInit = initFB
      if (!document.getElementById('fb-sdk')) {
        const s = document.createElement('script')
        s.id = 'fb-sdk'
        s.src = 'https://connect.facebook.net/en_US/sdk.js'
        s.async = true
        s.onerror = () => triggerError("Impossible de charger le SDK Facebook. Vérifiez votre bloqueur de publicités.")
        document.body.appendChild(s)
      }
    }

    fetchConnections()
  }, [fetchConnections, triggerError])

  // ── WhatsApp Embedded Signup Listener ───────────────────────────────────────
  useEffect(() => {
    const handle = async (e: MessageEvent) => {
      if (e.origin !== 'https://www.facebook.com') return
      try {
        const data = JSON.parse(e.data)
        if (data.type === 'WA_EMBEDDED_SIGNUP') {
          setWaLoading(true)
          const res = await fetch('/api/auth/meta/connect', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phoneNumberId: data.data.phone_number_id, wabaId: data.data.waba_id }),
          })
          const d = await res.json()
          if (!res.ok) throw new Error(d.error || 'Erreur lors de la connexion au serveur.')
          if (d.success) setWaConnected(true)
        }
      } catch (err: any) {
        triggerError(`Échec de la connexion WhatsApp: ${err.message}`)
      } finally {
        setWaLoading(false)
      }
    }
    window.addEventListener('message', handle)
    return () => window.removeEventListener('message', handle)
  }, [triggerError])

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleWaConnect = () => {
    if (!fbLoaded) return triggerError("Le SDK Facebook n'est pas encore prêt.")
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
    if (!fbLoaded) return triggerError("Le SDK Facebook n'est pas encore prêt.")
    setFbConnecting(true)
    ;(window as any).FB.login(async (resp: any) => {
      if (!resp.authResponse?.accessToken) { setFbConnecting(false); return }
      try {
        const res = await fetch('/api/auth/meta/connect', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fbAccessToken: resp.authResponse.accessToken }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Erreur de liaison serveur.')
        if (data.success) fetchConnections() // Refresh data
      } catch (err: any) {
        triggerError(`Échec de la liaison Meta: ${err.message}`)
      } finally {
        setFbConnecting(false)
      }
    }, {
      scope: 'pages_show_list,pages_messaging,pages_read_engagement,instagram_basic,instagram_manage_messages',
      return_scopes: true, auth_type: 'rerequest',
    })
  }

  const completeAction = async (action: 'dpa' | 'bot') => {
    try {
      // Future API Call here: await fetch('/api/business/update', { method: 'POST', body: JSON.stringify({ [action]: true }) })
      if (action === 'dpa') setHasAcceptedDPA(true)
      if (action === 'bot') setHasConfiguredBot(true)
    } catch (err: any) {
      triggerError(`Impossible de sauvegarder la configuration: ${err.message}`)
    }
  }


  if (status === 'loading' || !session) return null

  const userName    = session.user?.name || 'Administrateur'
  const userInitial = userName.charAt(0).toUpperCase()
  const igPages     = fbPages.filter(p => p.channel === 'INSTAGRAM')
  const fbConnected = fbPages.filter(p => p.channel === 'FACEBOOK')
  const isFbConn    = fbConnected.length > 0
  const isIgConn    = igPages.length > 0

  const setupCount = [waConnected, hasAcceptedDPA, hasConfiguredBot].filter(Boolean).length
  const setupDone = setupCount === 3

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', -apple-system, sans-serif; background: #f8fafc; overflow: hidden; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        button { font-family: inherit; }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
      `}</style>

      {/* Global Toast for Errors */}
      <AnimatePresence>
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }} exit={{ opacity: 0, y: -20, x: '-50%' }}
            style={{ position: 'fixed', top: 24, left: '50%', zIndex: 9999, background: '#fee2e2', border: '1px solid #fca5a5', padding: '12px 20px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 10px 25px rgba(220,38,38,0.15)' }}
          >
            <AlertCircle size={16} color="#dc2626" />
            <span style={{ fontSize: 13, fontWeight: 500, color: '#991b1b' }}>{errorMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: 'flex', height: '100dvh', width: '100vw' }}>
        
        {/* ══ LEFT SIDEBAR ═════════════════════════════════════════════════════ */}
        <aside style={{ width: 240, background: '#020617', borderRight: '1px solid #1e293b', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div style={{ height: 70, display: 'flex', alignItems: 'center', padding: '0 24px', borderBottom: '1px solid #1e293b' }}>
            <Image src="/logo.png" alt="Répondly" width={110} height={28} style={{ objectFit: 'contain' }} priority />
          </div>

          <nav style={{ flex: 1, padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 12px', marginBottom: 8 }}>Plateforme</div>
            {NAV.map(item => {
              const active = activePage === item.id
              return (
                <button key={item.id} onClick={() => setActivePage(item.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                  padding: '10px 12px', borderRadius: 8, background: active ? '#1e293b' : 'transparent',
                  color: active ? '#f8fafc' : '#94a3b8', fontSize: 13.5, fontWeight: active ? 600 : 500,
                  border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                }}>
                  {item.icon} {item.label}
                </button>
              )
            })}
          </nav>

          <div style={{ padding: '20px', borderTop: '1px solid #1e293b' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f8fafc', fontSize: 13, fontWeight: 600 }}>{userInitial}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userName}</div>
                <button onClick={() => signOut()} style={{ background: 'none', border: 'none', padding: 0, color: '#94a3b8', fontSize: 11, cursor: 'pointer', marginTop: 2 }}>Se déconnecter</button>
              </div>
            </div>
          </div>
        </aside>

        {/* ══ CENTER COLUMN (MAIN CONTENT) ═════════════════════════════════════ */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: '#f8fafc' }}>
          {/* Topbar */}
          <header style={{ height: 70, borderBottom: '1px solid #e2e8f0', background: '#fff', display: 'flex', alignItems: 'center', padding: '0 32px', flexShrink: 0 }}>
            <h1 style={{ fontSize: 16, fontWeight: 600, color: '#0f172a' }}>{NAV.find(n => n.id === activePage)?.label}</h1>
          </header>

          {/* Dynamic Content */}
          <main style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
            {activePage === 'home' && (
              <div style={{ maxWidth: 800 }}>
                <h2 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', marginBottom: 24 }}>Vue d'ensemble</h2>
                
                {/* Stats Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
                  <StatCard label="Messages Traités" value={loadingData ? 0 : 1240} sub="7 derniers jours" loading={loadingData} />
                  <StatCard label="Taux d'automatisation" value={loadingData ? 0 : '86%'} sub="Géré par l'IA" loading={loadingData} />
                  <StatCard label="RDV Planifiés" value={loadingData ? 0 : 42} sub="Synchronisés à l'agenda" loading={loadingData} />
                </div>

                {/* Dashboard Action Area */}
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', marginBottom: 16 }}>Accès Rapide</h3>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={() => setActivePage('inbox')} style={{ background: '#0f172a', color: '#fff', padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 500, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Inbox size={16} /> Accéder à la messagerie unifiée
                    </button>
                    <button onClick={() => completeAction('bot')} style={{ background: '#fff', color: '#0f172a', padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 500, border: '1px solid #cbd5e1', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Bot size={16} /> Entraîner l'Agent IA
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {activePage === 'inbox' && <Messagerie />}
            {activePage === 'automations' && <div style={{ textAlign: 'center', padding: '100px 0', color: '#64748b' }}><Zap size={32} style={{ opacity: 0.5, marginBottom: 16 }}/><br/>Module Automatisations en développement</div>}
            {activePage === 'bot' && <div style={{ textAlign: 'center', padding: '100px 0', color: '#64748b' }}><Bot size={32} style={{ opacity: 0.5, marginBottom: 16 }}/><br/>Configuration de l'IA experte</div>}
            {activePage === 'settings' && <div style={{ textAlign: 'center', padding: '100px 0', color: '#64748b' }}><Settings size={32} style={{ opacity: 0.5, marginBottom: 16 }}/><br/>Paramètres du compte</div>}
          </main>
        </div>

        {/* ══ RIGHT PANEL (INTEGRATIONS & ACTIONS) ═════════════════════════════ */}
        {activePage === 'home' && (
          <aside style={{ width: 340, background: '#fff', borderLeft: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', flexShrink: 0, overflowY: 'auto' }}>
            
            {/* Onboarding Checklist */}
            <div style={{ padding: '24px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>Mise en service</h3>
                <span style={{ fontSize: 12, fontWeight: 600, color: setupDone ? '#16a34a' : '#64748b', background: setupDone ? '#f0fdf4' : '#f1f5f9', padding: '2px 8px', borderRadius: 10 }}>{setupCount}/3</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <StepRow done={waConnected} label="Lier WhatsApp API" cta="Lier" onClick={handleWaConnect} />
                <StepRow done={hasAcceptedDPA} label="Accord de conformité" cta="Signer" onClick={() => completeAction('dpa')} />
                <StepRow done={hasConfiguredBot} label="Comportement de l'IA" cta="Régler" onClick={() => completeAction('bot')} />
              </div>
            </div>

            {/* Channels Management */}
            <div style={{ padding: '24px' }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 16 }}>Canaux de communication</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                
                {/* WhatsApp */}
                <ChannelRow icon={<div style={{ width: 32, height: 32, background: '#dcfce7', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><WaIcon size={16} /></div>} 
                  name="WhatsApp API" isConnected={waConnected} onConnect={handleWaConnect} loading={waLoading} />

                {/* Facebook */}
                <ChannelRow icon={<div style={{ width: 32, height: 32, background: '#eff6ff', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1877F2' }}><FbIcon size={16} /></div>} 
                  name="Facebook Messenger" isConnected={isFbConn} onConnect={handleFbConnect} loading={fbConnecting} />

                {/* Instagram */}
                <ChannelRow icon={<div style={{ width: 32, height: 32, background: '#fdf2f8', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ background: 'linear-gradient(135deg,#f09433,#dc2743,#bc1888)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}><IgIcon size={16} /></span></div>} 
                  name="Instagram Direct" isConnected={isIgConn} onConnect={handleFbConnect} loading={fbConnecting} />

              </div>
            </div>

            {/* AI Control Box */}
            <div style={{ margin: 'auto 24px 24px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <Bot size={20} color={botStatus === 'active' ? '#16a34a' : '#64748b'} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Agent Répondly</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>{botStatus === 'active' ? 'Traitement auto activé' : 'En veille'}</div>
                </div>
              </div>
              <button 
                onClick={() => {
                  if (!setupDone) return triggerError("Veuillez terminer la mise en service avant d'activer l'IA.")
                  setBotStatus(s => s === 'active' ? 'paused' : 'active')
                }} 
                style={{ width: '100%', padding: '8px', borderRadius: 6, border: `1px solid ${botStatus === 'active' ? '#fca5a5' : '#e2e8f0'}`, background: botStatus === 'active' ? '#fef2f2' : '#fff', color: botStatus === 'active' ? '#dc2626' : '#0f172a', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
                {botStatus === 'active' ? 'Désactiver l\'IA' : 'Activer l\'IA'}
              </button>
            </div>

          </aside>
        )}
      </div>
    </>
  )
}