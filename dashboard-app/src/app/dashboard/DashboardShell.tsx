'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'

interface WhatsAppStatus {
  whatsappConnected: boolean
  whatsappPhoneNumberId: string | null
  wabaId: string | null
  whatsappInboxId: number | null
}

const s = {
  page: { minHeight: '100vh', background: '#0a0a0a', color: '#fff', fontFamily: 'Inter, sans-serif' },
  inner: { maxWidth: 720, margin: '0 auto', padding: '48px 24px' },
  header: { marginBottom: 40 },
  h1: { fontSize: 22, fontWeight: 700, margin: 0 },
  sub: { color: '#666', fontSize: 13, marginTop: 4 },
  card: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 24, marginBottom: 16 },
  cardDim: { background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 16, padding: 24, marginBottom: 16, opacity: 0.5 },
  row: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  iconBox: { width: 48, height: 48, borderRadius: 12, background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 },
  iconBoxDim: { width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 },
  left: { display: 'flex', alignItems: 'center', gap: 16 },
  name: { fontWeight: 600, fontSize: 15 },
  statusRow: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 },
  dot: (on: boolean) => ({ width: 8, height: 8, borderRadius: '50%', background: on ? '#25D366' : '#444' }),
  statusTxt: { fontSize: 12, color: '#666' },
  btnGreen: { background: '#25D366', color: '#000', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' },
  btnGhost: { background: 'transparent', color: '#666', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px 14px', fontSize: 12, cursor: 'pointer' },
  btnComingSoon: { background: 'transparent', color: '#555', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px 14px', fontSize: 12, cursor: 'default' },
  meta: { marginTop: 20, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.05)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  metaLabel: { color: '#555', fontSize: 11, marginBottom: 4 },
  metaVal: { fontSize: 12, fontFamily: 'monospace', color: '#aaa' },
  toast: (type: 'success' | 'error') => ({
    position: 'fixed' as const, top: 20, right: 20, zIndex: 50,
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '12px 18px', borderRadius: 12, fontSize: 13, fontWeight: 500,
    background: type === 'success' ? 'rgba(37,211,102,0.1)' : 'rgba(239,68,68,0.1)',
    border: type === 'success' ? '1px solid rgba(37,211,102,0.3)' : '1px solid rgba(239,68,68,0.3)',
    color: type === 'success' ? '#25D366' : '#ef4444',
  }),
}

const WaIcon = () => (
  <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
    <path d="M16 2C8.268 2 2 8.268 2 16c0 2.4.627 4.65 1.72 6.6L2 30l7.6-1.694A13.93 13.93 0 0016 30c7.732 0 14-6.268 14-14S23.732 2 16 2z" fill="#25D366"/>
    <path d="M22.5 19.5c-.3-.15-1.8-.9-2.1-1-.3-.1-.5-.15-.7.15-.2.3-.8 1-.95 1.2-.18.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.47-.89-.79-1.48-1.76-1.66-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.7-1.68-.96-2.3-.25-.6-.5-.52-.7-.53-.18-.01-.38-.01-.58-.01-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.22 3.08.15.2 2.1 3.2 5.08 4.49.71.31 1.27.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.8-.74 2.05-1.45.25-.71.25-1.32.17-1.45-.07-.13-.27-.2-.57-.35z" fill="white"/>
  </svg>
)

export default function DashboardShell() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [waStatus, setWaStatus] = useState<WhatsAppStatus | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [disconnecting, setDisconnecting] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin')
  }, [status, router])

  useEffect(() => {
    const success = searchParams.get('success')
    const error = searchParams.get('error')
    if (success === 'whatsapp_connected') {
      setToast({ msg: 'WhatsApp connecté avec succès !', type: 'success' })
      setTimeout(() => setToast(null), 4000)
    }
    if (error) {
      setToast({ msg: 'Erreur lors de la connexion WhatsApp.', type: 'error' })
      setTimeout(() => setToast(null), 4000)
    }
  }, [searchParams])

  useEffect(() => {
    fetch('/api/whatsapp/status').then(r => r.json()).then(setWaStatus)
  }, [])

  const handleDisconnect = async () => {
    if (!confirm('Déconnecter WhatsApp ? Votre inbox sera supprimée.')) return
    setDisconnecting(true)
    const res = await fetch('/api/whatsapp/disconnect', { method: 'POST' })
    if (res.ok) {
      setWaStatus(prev => prev ? { ...prev, whatsappConnected: false, whatsappInboxId: null } : prev)
      setToast({ msg: 'WhatsApp déconnecté.', type: 'success' })
    } else {
      setToast({ msg: 'Erreur lors de la déconnexion.', type: 'error' })
    }
    setDisconnecting(false)
    setTimeout(() => setToast(null), 3000)
  }

  if (status === 'loading' || !session) return null

  const connected = waStatus?.whatsappConnected ?? false

  return (
    <div style={s.page}>
      {toast && <div style={s.toast(toast.type)}>{toast.type === 'success' ? '✓' : '✕'} {toast.msg}</div>}
      <div style={s.inner}>
        <div style={s.header}>
          <h1 style={s.h1}>Bonjour, {session.user?.name ?? session.user?.email} 👋</h1>
          <p style={s.sub}>Gérez vos canaux et automatisations depuis ici.</p>
        </div>

        {/* WhatsApp card */}
        <div style={s.card}>
          <div style={s.row}>
            <div style={s.left}>
              <div style={s.iconBox}><WaIcon /></div>
              <div>
                <div style={s.name}>WhatsApp Business</div>
                <div style={s.statusRow}>
                  <span style={s.dot(connected)} />
                  <span style={s.statusTxt}>
                    {waStatus === null ? 'Chargement...' : connected ? `Connecté · Inbox #${waStatus.whatsappInboxId}` : 'Non connecté'}
                  </span>
                </div>
              </div>
            </div>
            <div>
              {connected ? (
                <button style={s.btnGhost} onClick={handleDisconnect} disabled={disconnecting}>
                  {disconnecting ? 'Déconnexion...' : 'Déconnecter'}
                </button>
              ) : (
                <button style={s.btnGreen} onClick={() => router.push('/onboarding')}>
                  Connecter
                </button>
              )}
            </div>
          </div>
          {connected && waStatus?.wabaId && (
            <div style={s.meta}>
              <div><div style={s.metaLabel}>WABA ID</div><div style={s.metaVal}>{waStatus.wabaId}</div></div>
              <div><div style={s.metaLabel}>Phone Number ID</div><div style={s.metaVal}>{waStatus.whatsappPhoneNumberId}</div></div>
            </div>
          )}
        </div>

        {/* Coming soon */}
        {[{ label: 'Instagram', icon: '📸' }, { label: 'Facebook', icon: '👥' }].map(ch => (
          <div key={ch.label} style={s.cardDim}>
            <div style={s.row}>
              <div style={s.left}>
                <div style={s.iconBoxDim}>{ch.icon}</div>
                <div>
                  <div style={s.name}>{ch.label}</div>
                  <div style={{ ...s.statusTxt, marginTop: 4 }}>Bientôt disponible</div>
                </div>
              </div>
              <button style={s.btnComingSoon}>Coming soon</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
