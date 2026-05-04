'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Messagerie from './messagerie/MessagerieView'
import FacebookInstagramConnect from '@/components/FacebookInstagramConnect'
import {
  LayoutDashboard, Inbox, Zap, Bot, Settings,
  LogOut, AlertCircle, ChevronRight, Check, Circle,
  Wifi, RefreshCw,
} from 'lucide-react'

// ─── Channel SVG Icons ────────────────────────────────────────────────────────
const WaIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <path d="M16 2C8.268 2 2 8.268 2 16c0 2.4.627 4.65 1.72 6.6L2 30l7.6-1.694A13.93 13.93 0 0016 30c7.732 0 14-6.268 14-14S23.732 2 16 2z" fill="#25D366"/>
    <path d="M22.5 19.5c-.3-.15-1.8-.9-2.1-1-.3-.1-.5-.15-.7.15-.2.3-.8 1-.95 1.2-.18.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.47-.89-.79-1.48-1.76-1.66-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.7-1.68-.96-2.3-.25-.6-.5-.52-.7-.53-.18-.01-.38-.01-.58-.01-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.22 3.08.15.2 2.1 3.2 5.08 4.49.71.31 1.27.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.8-.74 2.05-1.45.25-.71.25-1.32.17-1.45-.07-.13-.27-.2-.57-.35z" fill="white"/>
  </svg>
)

// ─── Types ────────────────────────────────────────────────────────────────────
type PageId = 'home' | 'inbox' | 'automations' | 'bot' | 'settings' | 'channels'

const NAV: { id: PageId; label: string; icon: React.ReactNode }[] = [
  { id: 'home',        label: 'Accueil',        icon: <LayoutDashboard size={16} /> },
  { id: 'inbox',       label: 'Messagerie',      icon: <Inbox size={16} /> },
  { id: 'automations', label: 'Automatisations', icon: <Zap size={16} /> },
  { id: 'bot',         label: 'Agent IA',        icon: <Bot size={16} /> },
  { id: 'settings',    label: 'Paramètres',      icon: <Settings size={16} /> },
]

// ─── Helper Components ────────────────────────────────────────────────────────
function Pill({ active, label }: { active: boolean; label: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '2px 8px', borderRadius: 6,
      background: active ? '#f0fdf4' : '#f1f5f9',
      fontSize: 11, fontWeight: 600,
      color: active ? '#16a34a' : '#64748b',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: active ? '#22c55e' : '#cbd5e1', flexShrink: 0 }} />
      {label}
    </span>
  )
}

function StatCard({ label, value, sub, loading }: { label: string; value: string | number; sub: string; loading?: boolean }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      {loading
        ? <div style={{ height: 32, width: 60, background: '#f1f5f9', borderRadius: 6 }} />
        : <div style={{ fontSize: 32, fontWeight: 700, color: '#0f172a', lineHeight: 1 }}>{value}</div>
      }
      <div style={{ fontSize: 12, color: '#94a3b8' }}>{sub}</div>
    </div>
  )
}

function StepRow({ done, label, cta, onClick }: { done: boolean; label: string; cta: string; onClick: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
      <div style={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0, background: done ? '#22c55e' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {done
          ? <Check size={12} color="#fff" strokeWidth={3} />
          : <Circle size={10} color="#cbd5e1" strokeWidth={3} />
        }
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

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DashboardShell() {
  const { data: session, status } = useSession()

  const [activePage, setActivePage] = useState<PageId>('home')
  const [errorMsg, setErrorMsg]     = useState<string | null>(null)
  const [loadingData, setLoadingData] = useState(true)

  // Channel status (read from DB via API)
  const [waConnected, setWaConnected] = useState(false)
  const [fbConnected, setFbConnected] = useState(false)
  const [igConnected, setIgConnected] = useState(false)
  const [waLoading, setWaLoading]     = useState(false)

  // Onboarding milestones (read from DB)
  const [hasAcceptedDPA, setHasAcceptedDPA]       = useState(false)
  const [hasConfiguredBot, setHasConfiguredBot]   = useState(false)
  const [botActive, setBotActive]                 = useState(false)

  // ── FB SDK init (single place) ─────────────────────────────────────────────
  // NOTE: FacebookInstagramConnect also calls loadFBSDK() — it's idempotent,
  //       so calling it here is only needed if we want WA Embedded Signup too.
  useEffect(() => {
    const appId = process.env.NEXT_PUBLIC_META_APP_ID
    if (!appId) return

    function init() {
      window.FB.init({ appId, cookie: true, xfbml: false, version: 'v21.0' })
    }

    if (window.FB) { init(); return }

    const prev = window.fbAsyncInit
    window.fbAsyncInit = () => { prev?.(); init() }

    if (!document.getElementById('fb-sdk')) {
      const s = document.createElement('script')
      s.id = 'fb-sdk'
      s.src = 'https://connect.facebook.net/en_US/sdk.js'
      s.async = true
      document.body.appendChild(s)
    }
  }, [])

  // ── WhatsApp Embedded Signup message listener ──────────────────────────────
  useEffect(() => {
    const handle = async (e: MessageEvent) => {
      if (e.origin !== 'https://www.facebook.com') return
      try {
        const data = JSON.parse(e.data)
        if (data.type !== 'WA_EMBEDDED_SIGNUP') return
        setWaLoading(true)
        const res = await fetch('/api/auth/meta/connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phoneNumberId: data.data.phone_number_id,
            wabaId: data.data.waba_id,
          }),
        })
        const d = await res.json()
        if (!res.ok) throw new Error(d.error || 'Connection failed')
        if (d.success) {
          setWaConnected(true)
          triggerSuccess('WhatsApp connected successfully!')
        }
      } catch (err: any) {
        triggerError(`WhatsApp connection failed: ${err.message}`)
      } finally {
        setWaLoading(false)
      }
    }
    window.addEventListener('message', handle)
    return () => window.removeEventListener('message', handle)
  }, [])

  // ── Fetch all connection states from DB ────────────────────────────────────
  const fetchStatus = useCallback(async () => {
    setLoadingData(true)
    try {
      const [resFb, resWa] = await Promise.all([
        fetch('/api/meta/pages'),
        fetch('/api/whatsapp/status'),
      ])

      if (resFb.ok) {
        const dataFb = await resFb.json()
        const pages: any[] = dataFb.pages || []
        setFbConnected(pages.some((p: any) => p.channel === 'FACEBOOK'))
        setIgConnected(pages.some((p: any) => p.channel === 'INSTAGRAM'))
      }

      if (resWa.ok) {
        const dataWa = await resWa.json()
        setWaConnected(!!dataWa.whatsappConnected)
      }
    } catch (err: any) {
      triggerError(err.message || 'Failed to load connection status')
    } finally {
      setLoadingData(false)
    }
  }, [])

  useEffect(() => { fetchStatus() }, [fetchStatus])

  // ── Helpers ────────────────────────────────────────────────────────────────
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  function triggerError(msg: string) {
    setErrorMsg(msg)
    setTimeout(() => setErrorMsg(null), 6000)
  }
  function triggerSuccess(msg: string) {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(null), 5000)
  }

  // ── WA connect ─────────────────────────────────────────────────────────────
  function handleWaConnect() {
    if (!window.FB) return triggerError("Facebook SDK not ready. Try again in a moment.")
    setWaLoading(true)
    ;(window as any).FB.login(
      (resp: any) => { if (!resp.authResponse) setWaLoading(false) },
      {
        config_id: process.env.NEXT_PUBLIC_META_CONFIG_ID,
        response_type: 'code',
        override_default_response_type: true,
        extras: { setup: {}, featureType: '', sessionInfoVersion: '3' },
      }
    )
  }

  if (status === 'loading' || !session) return null

  const userName    = session.user?.name || 'Administrateur'
  const userInitial = userName.charAt(0).toUpperCase()

  const setupCount = [waConnected, hasAcceptedDPA, hasConfiguredBot].filter(Boolean).length
  const setupDone  = setupCount === 3

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', -apple-system, sans-serif; background: #f8fafc; overflow: hidden; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        button { font-family: inherit; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
        @keyframes toast-in { from{opacity:0;transform:translate(-50%,-10px)} to{opacity:1;transform:translate(-50%,0)} }
      `}</style>

      {/* ── Toast notifications ── */}
      <AnimatePresence>
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -16, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -16, x: '-50%' }}
            style={{ position: 'fixed', top: 20, left: '50%', zIndex: 9999, background: '#fee2e2', border: '1px solid #fca5a5', padding: '11px 18px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 8px 20px rgba(220,38,38,0.15)' }}
          >
            <AlertCircle size={15} color="#dc2626" />
            <span style={{ fontSize: 13, fontWeight: 500, color: '#991b1b' }}>{errorMsg}</span>
          </motion.div>
        )}
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -16, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -16, x: '-50%' }}
            style={{ position: 'fixed', top: 20, left: '50%', zIndex: 9999, background: '#f0fdf4', border: '1px solid #86efac', padding: '11px 18px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 8px 20px rgba(22,163,74,0.12)' }}
          >
            <Check size={15} color="#16a34a" />
            <span style={{ fontSize: 13, fontWeight: 500, color: '#166534' }}>{successMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: 'flex', height: '100dvh', width: '100vw' }}>

        {/* ══ Sidebar ══════════════════════════════════════════════════════════ */}
        <aside style={{ width: 240, background: '#020617', borderRight: '1px solid #1e293b', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div style={{ height: 70, display: 'flex', alignItems: 'center', padding: '0 24px', borderBottom: '1px solid #1e293b' }}>
            <Image src="/logo.png" alt="Répondly" width={110} height={28} style={{ objectFit: 'contain' }} priority />
          </div>

          <nav style={{ flex: 1, padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 12px', marginBottom: 8 }}>Plateforme</div>
            {NAV.map(item => {
              const active = activePage === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setActivePage(item.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '10px 12px', borderRadius: 8, background: active ? '#1e293b' : 'transparent', color: active ? '#f8fafc' : '#94a3b8', fontSize: 13.5, fontWeight: active ? 600 : 500, border: 'none', cursor: 'pointer', transition: 'all 0.15s' }}
                >
                  {item.icon} {item.label}
                </button>
              )
            })}
          </nav>

          <div style={{ padding: '20px', borderTop: '1px solid #1e293b' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f8fafc', fontSize: 13, fontWeight: 600 }}>{userInitial}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userName}</div>
                <button onClick={() => signOut()} style={{ background: 'none', border: 'none', padding: 0, color: '#94a3b8', fontSize: 11, cursor: 'pointer', marginTop: 2 }}>
                  Se déconnecter
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* ══ Main content ═════════════════════════════════════════════════════ */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: '#f8fafc' }}>
          {/* Topbar */}
          <header style={{ height: 70, borderBottom: '1px solid #e2e8f0', background: '#fff', display: 'flex', alignItems: 'center', padding: '0 32px', flexShrink: 0 }}>
            <h1 style={{ fontSize: 16, fontWeight: 600, color: '#0f172a' }}>
              {NAV.find(n => n.id === activePage)?.label ?? 'Canaux'}
            </h1>
          </header>

          {/* Page content */}
          <main style={{ flex: 1, overflowY: 'auto', padding: activePage === 'inbox' ? 0 : '32px' }}>

            {activePage === 'home' && (
              <div style={{ maxWidth: 800 }}>
                <h2 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', marginBottom: 24 }}>Vue d'ensemble</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
                  <StatCard label="Messages Traités"      value={loadingData ? '—' : 1240} sub="7 derniers jours"   loading={loadingData} />
                  <StatCard label="Taux d'automatisation" value={loadingData ? '—' : '86%'} sub="Géré par l'IA"    loading={loadingData} />
                  <StatCard label="RDV Planifiés"         value={loadingData ? '—' : 42}   sub="Synchronisés"       loading={loadingData} />
                </div>

                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', marginBottom: 16 }}>Accès Rapide</h3>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button
                      onClick={() => setActivePage('inbox')}
                      style={{ background: '#0f172a', color: '#fff', padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 500, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                    >
                      <Inbox size={16} /> Messagerie unifiée
                    </button>
                    <button
                      onClick={() => setActivePage('channels' as PageId)}
                      style={{ background: '#fff', color: '#0f172a', padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 500, border: '1px solid #cbd5e1', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                    >
                      <Wifi size={16} /> Gérer les canaux
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activePage === 'inbox'       && <Messagerie />}
            {activePage === 'automations' && <EmptyPage icon={<Zap size={32} />} label="Automatisations en développement" />}
            {activePage === 'bot'         && <EmptyPage icon={<Bot size={32} />} label="Configuration de l'Agent IA" />}
            {activePage === 'settings'    && <EmptyPage icon={<Settings size={32} />} label="Paramètres du compte" />}

            {/* ── Channels page: wraps the FacebookInstagramConnect component ── */}
            {(activePage as string) === 'channels' && (
              <div style={{ maxWidth: 640 }}>
                <FacebookInstagramConnect />

                {/* WhatsApp section */}
                <div style={{ marginTop: 32, padding: '20px 24px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 32, height: 32, background: '#dcfce7', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <WaIcon size={16} />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>WhatsApp API</div>
                        <Pill active={waConnected} label={waConnected ? 'Connecté' : 'Non connecté'} />
                      </div>
                    </div>
                    {!waConnected && (
                      <button
                        onClick={handleWaConnect}
                        disabled={waLoading}
                        style={{ padding: '7px 14px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', fontSize: 12, fontWeight: 600, color: '#0f172a', cursor: waLoading ? 'not-allowed' : 'pointer', opacity: waLoading ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: 6 }}
                      >
                        {waLoading ? <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Wifi size={12} />}
                        Lier via Embedded Signup
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>

        {/* ══ Right panel (home only) ═══════════════════════════════════════════ */}
        {activePage === 'home' && (
          <aside style={{ width: 320, background: '#fff', borderLeft: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', flexShrink: 0, overflowY: 'auto' }}>

            {/* Setup checklist */}
            <div style={{ padding: 24, borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>Mise en service</h3>
                <span style={{ fontSize: 12, fontWeight: 600, color: setupDone ? '#16a34a' : '#64748b', background: setupDone ? '#f0fdf4' : '#f1f5f9', padding: '2px 8px', borderRadius: 10 }}>
                  {setupCount}/3
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <StepRow done={waConnected}      label="Lier WhatsApp API"        cta="Lier"    onClick={() => setActivePage('channels' as PageId)} />
                <StepRow done={hasAcceptedDPA}   label="Accord de conformité"     cta="Signer"  onClick={() => {}} />
                <StepRow done={hasConfiguredBot} label="Comportement de l'IA"     cta="Régler"  onClick={() => setActivePage('bot')} />
              </div>
            </div>

            {/* Channel status summary */}
            <div style={{ padding: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 14 }}>Canaux actifs</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'WhatsApp',           active: waConnected },
                  { label: 'Facebook Messenger', active: fbConnected },
                  { label: 'Instagram Direct',   active: igConnected },
                ].map(ch => (
                  <div key={ch.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#0f172a' }}>{ch.label}</span>
                    <Pill active={ch.active} label={ch.active ? 'Connecté' : 'Inactif'} />
                  </div>
                ))}
              </div>
              <button
                onClick={() => setActivePage('channels' as PageId)}
                style={{ marginTop: 14, width: '100%', padding: '9px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', fontSize: 12, fontWeight: 600, color: '#0f172a', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                <Wifi size={13} /> Gérer les canaux
              </button>
            </div>

            {/* AI Agent toggle */}
            <div style={{ margin: 'auto 24px 24px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <Bot size={20} color={botActive ? '#16a34a' : '#64748b'} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Agent Répondly</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>{botActive ? 'Traitement auto activé' : 'En veille'}</div>
                </div>
              </div>
              <button
                onClick={() => {
                  if (!setupDone) return triggerError("Terminez la mise en service avant d'activer l'IA.")
                  setBotActive(b => !b)
                }}
                style={{ width: '100%', padding: '8px', borderRadius: 6, border: `1px solid ${botActive ? '#fca5a5' : '#e2e8f0'}`, background: botActive ? '#fef2f2' : '#fff', color: botActive ? '#dc2626' : '#0f172a', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
              >
                {botActive ? "Désactiver l'IA" : "Activer l'IA"}
              </button>
            </div>
          </aside>
        )}
      </div>
    </>
  )
}

function EmptyPage({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '100px 0', color: '#94a3b8' }}>
      <div style={{ opacity: 0.4, marginBottom: 14, display: 'flex', justifyContent: 'center' }}>{icon}</div>
      {label}
    </div>
  )
}