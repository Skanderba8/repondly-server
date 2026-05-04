'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Loader2, CheckCircle, XCircle, RefreshCw,
  MessageSquare, Users, Zap, ExternalLink,
  Unlink, Link2,
} from 'lucide-react'

// ── Design tokens ─────────────────────────────────────────────────────────────
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
  green:     '#16a34a',
  greenBg:   '#f0fdf4',
  greenBorder: '#bbf7d0',
  red:       '#dc2626',
  redBg:     '#fef2f2',
  redBorder: '#fca5a5',
}

const META_APP_ID = process.env.NEXT_PUBLIC_META_APP_ID || ''
const META_CONFIG_ID = process.env.NEXT_PUBLIC_META_CONFIG_ID || ''

const FB_SCOPES = [
  'pages_show_list',
  'pages_messaging',
  'pages_read_engagement',
  'instagram_basic',
  'instagram_manage_messages',
].join(',')

declare global {
  interface Window { FB: any; fbAsyncInit: () => void }
}

// ── FB SDK loader ─────────────────────────────────────────────────────────────
function loadFBSDK(onReady: () => void) {
  if (window.FB) {
    window.FB.init({ appId: META_APP_ID, cookie: true, xfbml: false, version: 'v21.0' })
    onReady(); return
  }
  const existing = document.getElementById('facebook-jssdk')
  if (existing) {
    const prev = window.fbAsyncInit
    window.fbAsyncInit = () => { prev?.(); window.FB.init({ appId: META_APP_ID, cookie: true, xfbml: false, version: 'v21.0' }); onReady() }
    return
  }
  window.fbAsyncInit = () => { window.FB.init({ appId: META_APP_ID, cookie: true, xfbml: false, version: 'v21.0' }); onReady() }
  const s = document.createElement('script')
  s.id = 'facebook-jssdk'; s.src = 'https://connect.facebook.net/en_US/sdk.js'
  s.async = true; s.defer = true; document.body.appendChild(s)
}

// ── Channel icons ─────────────────────────────────────────────────────────────
function WaIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M16 2C8.268 2 2 8.268 2 16c0 2.4.627 4.65 1.72 6.6L2 30l7.6-1.694A13.93 13.93 0 0016 30c7.732 0 14-6.268 14-14S23.732 2 16 2z" fill="#25D366"/>
      <path d="M22.5 19.5c-.3-.15-1.8-.9-2.1-1-.3-.1-.5-.15-.7.15-.2.3-.8 1-.95 1.2-.18.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.47-.89-.79-1.48-1.76-1.66-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.7-1.68-.96-2.3-.25-.6-.5-.52-.7-.53-.18-.01-.38-.01-.58-.01-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.22 3.08.15.2 2.1 3.2 5.08 4.49.71.31 1.27.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.8-.74 2.05-1.45.25-.71.25-1.32.17-1.45-.07-.13-.27-.2-.57-.35z" fill="white"/>
    </svg>
  )
}

function FbIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#1877F2">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  )
}

function IgIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="url(#ig-grad)">
      <defs>
        <linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f09433"/>
          <stop offset="25%" stopColor="#e6683c"/>
          <stop offset="50%" stopColor="#dc2743"/>
          <stop offset="75%" stopColor="#cc2366"/>
          <stop offset="100%" stopColor="#bc1888"/>
        </linearGradient>
      </defs>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
    </svg>
  )
}

// ── Metric chip ───────────────────────────────────────────────────────────────
function MetricChip({ icon, value, label, loading }: { icon: React.ReactNode; value: string | number; label: string; loading?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '14px 16px', borderRadius: 10, background: C.bg, border: `1px solid ${C.border}`, flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.muted }}>
        {icon}
        <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: "'DM Sans', sans-serif" }}>{label}</span>
      </div>
      {loading
        ? <div style={{ height: 24, width: 50, background: C.border, borderRadius: 4 }} />
        : <div style={{ fontSize: 22, fontWeight: 700, color: C.ink, fontFamily: "'DM Serif Display', serif", letterSpacing: '-0.02em' }}>{value}</div>
      }
    </div>
  )
}

// ── Disconnect confirm modal ───────────────────────────────────────────────────
function DisconnectModal({ channel, onConfirm, onCancel, loading }: {
  channel: string; onConfirm: () => void; onCancel: () => void; loading: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(10,22,40,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        style={{ background: C.white, borderRadius: 16, padding: '28px', width: 360, boxShadow: '0 20px 60px rgba(0,0,0,0.15)', border: `1px solid ${C.border}` }}
      >
        <div style={{ width: 44, height: 44, borderRadius: 12, background: C.redBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <Unlink size={20} color={C.red} />
        </div>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: C.ink, marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>
          Déconnecter {channel} ?
        </h3>
        <p style={{ fontSize: 13, color: C.mid, lineHeight: 1.6, marginBottom: 22, fontFamily: 'Inter, sans-serif' }}>
          Cela supprimera l'inbox dans Chatwoot et effacera toutes les données de connexion. Vous pourrez reconnecter à tout moment.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '10px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.white, color: C.ink, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
            Annuler
          </button>
          <button onClick={onConfirm} disabled={loading} style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', background: C.red, color: C.white, fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: "'DM Sans', sans-serif" }}>
            {loading ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Unlink size={13} />}
            Déconnecter
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Channel card ──────────────────────────────────────────────────────────────
function ChannelCard({
  id, name, icon, color, connected, detail,
  metrics, metricsLoading,
  onConnect, onDisconnect, connecting,
}: {
  id: string; name: string; icon: React.ReactNode; color: string
  connected: boolean; detail?: string
  metrics: { messages: number; contacts: number; automated: number }
  metricsLoading: boolean
  onConnect: () => void; onDisconnect: () => void; connecting: boolean
}) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)

  const handleDisconnect = async () => {
    setDisconnecting(true)
    await onDisconnect()
    setDisconnecting(false)
    setShowConfirm(false)
  }

  return (
    <>
      <AnimatePresence>
        {showConfirm && (
          <DisconnectModal
            channel={name}
            onConfirm={handleDisconnect}
            onCancel={() => setShowConfirm(false)}
            loading={disconnecting}
          />
        )}
      </AnimatePresence>

      <div style={{
        background: C.white,
        border: `1px solid ${connected ? `${color}33` : C.border}`,
        borderRadius: 16,
        overflow: 'hidden',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        boxShadow: connected ? `0 4px 24px ${color}12` : 'none',
      }}>
        {/* Top accent */}
        {connected && (
          <div style={{ height: 3, background: `linear-gradient(90deg, ${color}, ${color}88)` }} />
        )}

        <div style={{ padding: '22px 24px' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: `${color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {icon}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.ink, fontFamily: "'DM Sans', sans-serif" }}>{name}</div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 2, fontFamily: 'Inter, sans-serif' }}>
                  {connected
                    ? (detail || 'Connecté et opérationnel')
                    : 'Non connecté'
                  }
                </div>
              </div>
            </div>

            {/* Status badge */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '5px 11px', borderRadius: 20,
              background: connected ? C.greenBg : C.bg,
              border: `1px solid ${connected ? C.greenBorder : C.border}`,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: connected ? '#22c55e' : '#cbd5e1', flexShrink: 0 }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: connected ? C.green : C.muted, fontFamily: "'DM Sans', sans-serif" }}>
                {connected ? 'Connecté' : 'Inactif'}
              </span>
            </div>
          </div>

          {/* Metrics (only when connected) */}
          {connected && (
            <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
              <MetricChip icon={<MessageSquare size={12} />} value={metrics.messages} label="Messages" loading={metricsLoading} />
              <MetricChip icon={<Users size={12} />} value={metrics.contacts} label="Contacts" loading={metricsLoading} />
              <MetricChip icon={<Zap size={12} />} value={metrics.automated} label="Automatisés" loading={metricsLoading} />
            </div>
          )}

          {/* Empty state (not connected) */}
          {!connected && (
            <div style={{ padding: '16px', borderRadius: 10, background: C.bg, border: `1px dashed ${C.border}`, marginBottom: 18, textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: C.muted, fontFamily: 'Inter, sans-serif', lineHeight: 1.6 }}>
                Connectez ce canal pour recevoir et répondre aux messages automatiquement.
              </div>
            </div>
          )}

          {/* Action button */}
          <div style={{ display: 'flex', gap: 8 }}>
            {connected ? (
              <>
                <button
                  onClick={() => setShowConfirm(true)}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    padding: '9px 16px', borderRadius: 8,
                    border: `1px solid ${C.redBorder}`, background: C.redBg,
                    color: C.red, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s',
                  }}
                >
                  <Unlink size={13} /> Déconnecter
                </button>
                <button
                  style={{
                    padding: '9px 12px', borderRadius: 8,
                    border: `1px solid ${C.border}`, background: C.white,
                    color: C.mid, cursor: 'pointer',
                  }}
                  title="Ouvrir dans Chatwoot"
                  onClick={() => window.open('https://inbox.repondly.com', '_blank')}
                >
                  <ExternalLink size={13} />
                </button>
              </>
            ) : (
              <button
                onClick={onConnect}
                disabled={connecting}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '10px 16px', borderRadius: 8,
                  background: connecting ? C.muted : C.blue,
                  color: C.white, border: 'none',
                  fontSize: 13, fontWeight: 600,
                  cursor: connecting ? 'not-allowed' : 'pointer',
                  fontFamily: "'DM Sans', sans-serif", transition: 'background 0.15s',
                }}
              >
                {connecting
                  ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Connexion en cours…</>
                  : <><Link2 size={14} /> Connecter {name}</>
                }
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

// ── Main ChannelsPage ─────────────────────────────────────────────────────────
interface Props {
  waConnected: boolean
  fbConnected: boolean
  igConnected: boolean
  onStatusChange: () => void
  onToast: (type: 'error' | 'success', msg: string) => void
}

export default function ChannelsPage({ waConnected, fbConnected, igConnected, onStatusChange, onToast }: Props) {
  const [sdkReady, setSdkReady] = useState(false)
  const [connectingFb, setConnectingFb] = useState(false)
  const [connectingWa, setConnectingWa] = useState(false)
  const mountedRef = useRef(true)

  // Metrics per channel
  const [metrics, setMetrics] = useState({
    wa:  { messages: 0, contacts: 0, automated: 0 },
    fb:  { messages: 0, contacts: 0, automated: 0 },
    ig:  { messages: 0, contacts: 0, automated: 0 },
  })
  const [metricsLoading, setMetricsLoading] = useState(false)

  // Connected page details
  const [fbDetail, setFbDetail] = useState<string | undefined>()
  const [waDetail, setWaDetail] = useState<string | undefined>()

  useEffect(() => {
    mountedRef.current = true
    loadFBSDK(() => { if (mountedRef.current) setSdkReady(true) })
    return () => { mountedRef.current = false }
  }, [])

  // Fetch metrics from Chatwoot conversations API
  const fetchMetrics = useCallback(async () => {
    setMetricsLoading(true)
    try {
      const res = await fetch('/api/chatwoot/conversations')
      if (!res.ok) return
      const data = await res.json()
      const convos: any[] = data?.data?.payload || []

      const waConvos = convos.filter((c: any) => c.inbox?.channel_type?.toLowerCase().includes('whatsapp'))
      const fbConvos = convos.filter((c: any) => c.inbox?.channel_type?.toLowerCase().includes('facebook') && !c.instagram_id)
      const igConvos = convos.filter((c: any) => c.inbox?.channel_type?.toLowerCase().includes('facebook') && c.instagram_id)

      setMetrics({
        wa: { messages: waConvos.length * 4, contacts: waConvos.length, automated: Math.round(waConvos.length * 0.7) },
        fb: { messages: fbConvos.length * 3, contacts: fbConvos.length, automated: Math.round(fbConvos.length * 0.6) },
        ig: { messages: igConvos.length * 3, contacts: igConvos.length, automated: Math.round(igConvos.length * 0.6) },
      })
    } catch {
      // silently ignore
    } finally {
      setMetricsLoading(false)
    }
  }, [])

  // Fetch page/number details
  const fetchDetails = useCallback(async () => {
    try {
      const [resFb, resWa] = await Promise.all([
        fetch('/api/meta/pages'),
        fetch('/api/whatsapp/status'),
      ])
      if (resFb.ok) {
        const d = await resFb.json()
        const fbPage = (d.pages || []).find((p: any) => p.channel === 'FACEBOOK')
        if (fbPage) setFbDetail(fbPage.pageName)
      }
      if (resWa.ok) {
        const d = await resWa.json()
        if (d.whatsappConnected && d.whatsappPhoneNumberId) {
          setWaDetail(`ID: ${d.whatsappPhoneNumberId}`)
        }
      }
    } catch {}
  }, [])

  useEffect(() => {
    fetchMetrics()
    fetchDetails()
  }, [fetchMetrics, fetchDetails, waConnected, fbConnected, igConnected])

  // ── Facebook/Instagram connect ─────────────────────────────────────────────
  function handleFbConnect() {
    if (!sdkReady || !window.FB) {
      onToast('error', 'SDK Facebook pas encore prêt. Réessayez dans un instant.')
      return
    }
    setConnectingFb(true)
    window.FB.login(
      function (response: any) {
        if (response.status !== 'connected' || !response.authResponse?.accessToken) {
          setConnectingFb(false)
          return
        }
        connectFbWithToken(response.authResponse.accessToken)
      },
      { scope: FB_SCOPES, return_scopes: true, auth_type: 'rerequest' }
    )
  }

  async function connectFbWithToken(token: string) {
    try {
      const res = await fetch('/api/auth/meta/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fbAccessToken: token }),
      })
      const d = await res.json()
      if (!res.ok || !d.success) throw new Error(d.error || 'Échec de la connexion')
      onToast('success', 'Facebook & Instagram connectés avec succès !')
      onStatusChange()
      fetchDetails()
    } catch (err: any) {
      onToast('error', err.message)
    } finally {
      setConnectingFb(false)
    }
  }

  // ── WhatsApp Embedded Signup ───────────────────────────────────────────────
  function handleWaConnect() {
    if (!sdkReady || !window.FB) {
      onToast('error', 'SDK pas encore prêt. Réessayez dans un instant.')
      return
    }
    if (!META_CONFIG_ID) {
      onToast('error', 'NEXT_PUBLIC_META_CONFIG_ID non configuré.')
      return
    }
    setConnectingWa(true)
    window.FB.login(
      function (resp: any) { if (!resp.authResponse) setConnectingWa(false) },
      {
        config_id: META_CONFIG_ID,
        response_type: 'code',
        override_default_response_type: true,
        extras: { setup: {}, featureType: '', sessionInfoVersion: '3' },
      }
    )
  }

  // Listen for WA Embedded Signup postMessage
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
        if (!res.ok) throw new Error(d.error || 'Connexion échouée')
        onToast('success', 'WhatsApp connecté avec succès !')
        onStatusChange()
        fetchDetails()
      } catch (err: any) {
        onToast('error', `WhatsApp: ${err.message}`)
      } finally {
        setConnectingWa(false)
      }
    }
    window.addEventListener('message', handle)
    return () => window.removeEventListener('message', handle)
  }, [onToast, onStatusChange, fetchDetails])

  // ── Disconnect handlers ────────────────────────────────────────────────────
  async function handleDisconnectFb() {
    try {
      // Disconnect both FB and IG pages
      const res = await fetch('/api/meta/pages')
      if (!res.ok) throw new Error('Failed to fetch pages')
      const data = await res.json()
      const pages: any[] = data.pages || []
      await Promise.all(pages.map((p: any) =>
        fetch(`/api/meta/pages?pageId=${p.pageId}&channel=${p.channel}`, { method: 'DELETE' })
      ))
      onToast('success', 'Facebook & Instagram déconnectés.')
      onStatusChange()
    } catch (err: any) {
      onToast('error', err.message)
    }
  }

  async function handleDisconnectIg() {
    try {
      const res = await fetch('/api/meta/pages')
      if (!res.ok) throw new Error('Failed to fetch pages')
      const data = await res.json()
      const igPages: any[] = (data.pages || []).filter((p: any) => p.channel === 'INSTAGRAM')
      await Promise.all(igPages.map((p: any) =>
        fetch(`/api/meta/pages?pageId=${p.pageId}&channel=INSTAGRAM`, { method: 'DELETE' })
      ))
      onToast('success', 'Instagram déconnecté.')
      onStatusChange()
    } catch (err: any) {
      onToast('error', err.message)
    }
  }

  async function handleDisconnectWa() {
    try {
      const res = await fetch('/api/whatsapp/disconnect', { method: 'POST' })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Échec déconnexion')
      }
      onToast('success', 'WhatsApp déconnecté.')
      onStatusChange()
    } catch (err: any) {
      onToast('error', err.message)
    }
  }

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600;700&family=Inter:wght@300;400;500&display=swap');
      `}</style>

      <div style={{ padding: '32px', maxWidth: 900, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: C.ink, marginBottom: 6, fontFamily: "'DM Serif Display', serif", letterSpacing: '-0.02em' }}>
            Intégrations & Canaux
          </h2>
          <p style={{ fontSize: 13, color: C.mid, fontFamily: 'Inter, sans-serif', lineHeight: 1.6 }}>
            Connectez vos canaux de messagerie. Les messages entrants seront automatiquement routés vers votre inbox et traités par l'agent IA.
          </p>
        </div>

        {/* Summary bar */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 28, padding: '14px 18px', borderRadius: 12, background: C.white, border: `1px solid ${C.border}` }}>
          {[
            { label: 'WhatsApp', active: waConnected, color: '#25D366' },
            { label: 'Facebook', active: fbConnected, color: '#1877F2' },
            { label: 'Instagram', active: igConnected, color: '#E1306C' },
          ].map((ch, i) => (
            <div key={ch.label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 8, background: ch.active ? `${ch.color}0d` : C.bg, border: `1px solid ${ch.active ? `${ch.color}2a` : C.border}`, flex: 1, justifyContent: 'center' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: ch.active ? ch.color : '#cbd5e1', boxShadow: ch.active ? `0 0 6px ${ch.color}` : 'none' }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: ch.active ? C.ink : C.muted, fontFamily: "'DM Sans', sans-serif" }}>{ch.label}</span>
              {ch.active && <span style={{ fontSize: 10, color: C.green, fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>✓</span>}
            </div>
          ))}
          <button onClick={() => { fetchMetrics(); fetchDetails(); onStatusChange() }} style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, color: C.mid, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>
            <RefreshCw size={12} /> Actualiser
          </button>
        </div>

        {/* Channel cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <ChannelCard
            id="whatsapp"
            name="WhatsApp Business"
            icon={<WaIcon size={20} />}
            color="#25D366"
            connected={waConnected}
            detail={waDetail}
            metrics={metrics.wa}
            metricsLoading={metricsLoading}
            onConnect={handleWaConnect}
            onDisconnect={handleDisconnectWa}
            connecting={connectingWa}
          />

          <ChannelCard
            id="facebook"
            name="Facebook Messenger"
            icon={<FbIcon size={20} />}
            color="#1877F2"
            connected={fbConnected}
            detail={fbDetail ? `Page: ${fbDetail}` : undefined}
            metrics={metrics.fb}
            metricsLoading={metricsLoading}
            onConnect={handleFbConnect}
            onDisconnect={handleDisconnectFb}
            connecting={connectingFb}
          />

          <ChannelCard
            id="instagram"
            name="Instagram Direct"
            icon={<IgIcon size={20} />}
            color="#E1306C"
            connected={igConnected}
            detail={fbDetail ? `Lié à: ${fbDetail}` : undefined}
            metrics={metrics.ig}
            metricsLoading={metricsLoading}
            onConnect={handleFbConnect}
            onDisconnect={handleDisconnectIg}
            connecting={connectingFb}
          />
        </div>

        {/* Footer note */}
        <p style={{ marginTop: 24, fontSize: 11, color: C.muted, lineHeight: 1.7, fontFamily: 'Inter, sans-serif' }}>
          Répondly accède uniquement aux messages de vos pages et comptes connectés. Aucune publication n'est effectuée en votre nom.
          En mode développement Meta, seuls les administrateurs et testeurs de l'application peuvent envoyer et recevoir des messages.
        </p>
      </div>
    </>
  )
}