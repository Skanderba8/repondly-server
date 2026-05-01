'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import Messagerie from './messagerie/MessagerieView'
import {
  LayoutDashboard, Inbox, Zap, Bot, Settings,
  MessageSquare, Activity, AlertCircle, CheckCircle2,
  PauseCircle, PlayCircle, ExternalLink, LogOut, User,
  ChevronDown, X, Circle, Clock, TrendingUp,
  Wifi, WifiOff, FlaskConical, TriangleAlert,
  Menu, SlidersHorizontal, Sparkles
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
  sidebarBg:    'rgba(15, 23, 42, 0.97)',
  mainBg:       '#f8fafc',
  cardBg:       'rgba(255,255,255,0.9)',
  cardBgSolid:  '#ffffff',
  topbarBg:     'rgba(255,255,255,0.85)',

  // Primary Palette
  primary:      '#6366f1',
  primaryDark:  '#4f46e5',
  primaryLight: '#e0e7ff',
  secondary:    '#8b5cf6',
  accent:       '#06b6d4',

  // Text
  ink:          '#0f172a',
  inkSoft:      '#1e293b',
  mid:          '#64748b',
  muted:        '#94a3b8',
  sideText:     'rgba(255,255,255,0.55)',
  sideTextActive:'#ffffff',

  // Status (subtle, consistent)
  statusActive:   '#10b981',
  statusInactive: '#94a3b8',
  statusPaused:   '#f59e0b',

  // Borders
  border:       'rgba(99,102,241,0.1)',
  borderLight:  'rgba(0,0,0,0.06)',
  sideBorder:   'rgba(255,255,255,0.08)',
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
  { id: 'inbox',       label: 'Messagerie',       icon: <Inbox size={17} /> },
  { id: 'automations', label: 'Automatisations',  icon: <Zap size={17} /> },
  { id: 'bot',         label: 'Config. Bot',      icon: <Bot size={17} /> },
  { id: 'settings',    label: 'Paramètres',       icon: <Settings size={17} /> },
]

// ─── Placeholder Page ──────────────────────────────────────────────────────────
function PlaceholderPage({ title, icon, description }: { title: string; icon: React.ReactNode; description: string }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '40px' }}>
      <div style={{ width: '64px', height: '64px', borderRadius: '18px', background: C.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.primary }}>
        {icon}
      </div>
      <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: C.ink, letterSpacing: '-0.02em' }}>{title}</h2>
      <p style={{ margin: 0, fontSize: '14px', color: C.mid, textAlign: 'center', maxWidth: '320px', lineHeight: 1.6 }}>{description}</p>
      <div style={{ marginTop: '8px', padding: '8px 20px', background: C.primaryLight, color: C.primary, borderRadius: '100px', fontSize: '12px', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        Bientôt disponible
      </div>
    </div>
  )
}

// ─── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status, label }: { status: 'active' | 'paused' | 'disconnected'; label: string }) {
  const map = {
    active:       { bg: 'rgba(16,185,129,0.1)',  color: C.statusActive },
    paused:       { bg: 'rgba(245,158,11,0.1)',  color: C.statusPaused },
    disconnected: { bg: 'rgba(148,163,184,0.1)', color: C.statusInactive },
  }
  const s = map[status]
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '2px 8px', borderRadius: '100px', background: s.bg, fontSize: '11px', fontWeight: 600, color: s.color }}>
      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: s.color, display: 'inline-block' }} />
      {label}
    </span>
  )
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function DashboardShell() {
  const { data: session, status } = useSession()

  // Navigation
  const [activePage, setActivePage] = useState<string>('home')

  // WhatsApp / bot state (from real API)
  const [waConnected, setWaConnected]           = useState(false)
  const [waPhoneNumber, setWaPhoneNumber]       = useState<string | null>(null)
  const [botStatus, setBotStatus]               = useState<'active' | 'paused'>('paused')
  const [fbLoaded, setFbLoaded]                 = useState(false)
  const [waLoading, setWaLoading]               = useState(false)

  // Onboarding state
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
      config_id: process.env.NEXT_PUBLIC_META_CONFIG_ID,
      response_type: 'code', override_default_response_type: true,
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

      {/* Welcome Message */}
      <div style={{ marginBottom: '4px' }}>
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: C.ink, letterSpacing: '-0.02em' }}>
          Bienvenue, {userName.split(' ')[0]} <Sparkles size={20} style={{ display: 'inline', color: C.primary }} />
        </h2>
        <p style={{ margin: '2px 0 0', fontSize: '13px', color: C.muted }}>
          Votre tableau de bord Répondly —{' '}
          {waConnected ? (botStatus === 'active' ? 'tout est opérationnel' : 'bot en pause') : 'connectez un canal pour démarrer'}
        </p>
      </div>

      {/* Channel Status Cards - Compact Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
        {/* WhatsApp */}
        <div style={{ background: C.cardBg, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: `1px solid ${C.borderLight}`, borderRadius: '14px', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <WaIcon size={15} />
            </div>
            <div>
              <span style={{ fontSize: '12px', fontWeight: 600, color: C.ink, display: 'block' }}>WhatsApp</span>
              <StatusBadge status={waConnected ? 'active' : 'disconnected'} label={waConnected ? (waPhoneNumber || 'Connecté') : 'Déconnecté'} />
            </div>
          </div>
          {!waConnected && (
            <button onClick={handleSignup} disabled={!fbLoaded || waLoading}
              style={{ background: C.primary, color: '#fff', border: 'none', borderRadius: '8px', padding: '6px 10px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Wifi size={12} /> {waLoading ? '...' : 'Connecter'}
            </button>
          )}
        </div>

        {/* Instagram */}
        <div style={{ background: C.cardBg, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: `1px solid ${C.borderLight}`, borderRadius: '14px', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IgIcon size={13} />
            </div>
            <div>
              <span style={{ fontSize: '12px', fontWeight: 600, color: C.ink, display: 'block' }}>Instagram</span>
              <StatusBadge status="disconnected" label="Bientôt" />
            </div>
          </div>
        </div>

        {/* Facebook */}
        <div style={{ background: C.cardBg, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: `1px solid ${C.borderLight}`, borderRadius: '14px', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FbIcon size={13} />
            </div>
            <div>
              <span style={{ fontSize: '12px', fontWeight: 600, color: C.ink, display: 'block' }}>Facebook</span>
              <StatusBadge status="disconnected" label="Bientôt" />
            </div>
          </div>
        </div>

        {/* Bot */}
        <div style={{ background: C.cardBg, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: `1px solid ${C.borderLight}`, borderRadius: '14px', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: C.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={17} color={C.primary} />
            </div>
            <div>
              <span style={{ fontSize: '12px', fontWeight: 600, color: C.ink, display: 'block' }}>Agent IA</span>
              <StatusBadge status={botStatus} label={botStatus === 'active' ? 'Actif' : 'En pause'} />
            </div>
          </div>
          <button
            onClick={() => setBotStatus(botStatus === 'active' ? 'paused' : 'active')}
            style={{
              width: '28px', height: '28px', borderRadius: '7px', border: 'none',
              background: botStatus === 'active' ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)',
              color: botStatus === 'active' ? C.statusPaused : C.statusActive,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
            {botStatus === 'active' ? <PauseCircle size={15} /> : <PlayCircle size={15} />}
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button onClick={() => setActivePage('inbox')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '10px', background: C.primary, color: '#fff', border: 'none', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 10px rgba(99,102,241,0.3)' }}>
          <Inbox size={14} /> Messagerie
        </button>
        <button onClick={() => {}}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '10px', background: C.cardBgSolid, color: C.ink, border: `1px solid ${C.borderLight}`, fontSize: '12.5px', fontWeight: 600, cursor: 'pointer' }}>
          <FlaskConical size={14} /> Tester le bot
        </button>
        <button onClick={() => setActivePage('bot')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '10px', background: C.cardBgSolid, color: C.ink, border: `1px solid ${C.borderLight}`, fontSize: '12.5px', fontWeight: 600, cursor: 'pointer' }}>
          <Bot size={14} /> Configurer le bot
        </button>
      </div>

      {/* Setup Progress (only if not complete) */}
      <AnimatePresence>
        {(waConnected && hasAcceptedDPA && hasConfiguredBot) ? null : (
          <motion.section
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ background: C.cardBg, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: `1px solid ${C.borderLight}`, borderRadius: '16px', padding: '18px 20px', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: C.ink }}>Configuration de votre compte</div>
              <div style={{ fontSize: '12px', color: C.muted, marginTop: '2px' }}>Suivez ces étapes pour activer votre agent IA.</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
              {[
                { done: waConnected, label: 'Connecter WhatsApp', onClick: handleSignup },
                { done: hasAcceptedDPA, label: 'Valider le DPA (conformité)', onClick: () => setShowDPAModal(true) },
                { done: hasConfiguredBot, label: 'Configurer l\'agent IA', onClick: () => setShowPersonaModal(true) },
              ].map((step, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '10px',
                  background: step.done ? 'rgba(16,185,129,0.06)' : '#f8fafc',
                  border: `1px solid ${step.done ? 'rgba(16,185,129,0.15)' : C.borderLight}`
                }}>
                  {step.done ? <CheckCircle2 size={15} color={C.statusActive} /> : <Circle size={15} color={C.muted} />}
                  <span style={{ flex: 1, fontSize: '12.5px', fontWeight: 500, color: step.done ? C.mid : C.ink }}>{step.label}</span>
                  {!step.done && (
                    <button onClick={step.onClick}
                      style={{ fontSize: '11px', fontWeight: 700, color: C.primary, background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
                      {i === 0 ? 'Connecter' : 'Compléter'} →
                    </button>
                  )}
                </div>
              ))}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Link to Messagerie */}
      <div style={{ background: C.cardBg, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: `1px solid ${C.borderLight}`, borderRadius: '16px', padding: '18px 20px', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: C.ink, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquare size={16} color={C.primary} />
              Messagerie unifiée
            </div>
            <div style={{ fontSize: '12px', color: C.muted, marginTop: '4px' }}>
              {waConnected ? 'Gérez toutes vos conversations depuis un seul endroit.' : 'Connectez WhatsApp pour commencer à recevoir des messages.'}
            </div>
          </div>
          <button onClick={() => setActivePage('inbox')}
            style={{ padding: '8px 16px', borderRadius: '10px', background: C.primary, color: '#fff', border: 'none', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 10px rgba(99,102,241,0.2)' }}>
            <ExternalLink size={13} /> Ouvrir
          </button>
        </div>
      </div>

      <div style={{ height: '4px', flexShrink: 0 }} />
    </div>
  )

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.15); border-radius: 10px; }
        
        /* Background texture */
        .dashboard-bg {
          background-color: ${C.mainBg};
          background-image: 
            radial-gradient(circle at 20% 50%, rgba(99,102,241,0.03) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(139,92,246,0.03) 0%, transparent 50%),
            radial-gradient(circle at 50% 80%, rgba(6,182,212,0.02) 0%, transparent 50%);
        }
      `}</style>

      <div style={{ display: 'flex', height: '100dvh', width: '100vw', overflow: 'hidden', fontFamily: "'Inter', -apple-system, sans-serif" }}>

        {/* ═══ SIDEBAR ═════════════════════════════════════════════════════════ */}
        <aside style={{
          width: '220px', flexShrink: 0,
          background: C.sidebarBg,
          display: 'flex', flexDirection: 'column',
          borderRight: `1px solid ${C.sideBorder}`,
          position: 'relative', zIndex: 20,
          boxShadow: '4px 0 24px rgba(0,0,0,0.08)',
        }}>
          <div style={{ height: '64px', display: 'flex', alignItems: 'center', padding: '0 20px', borderBottom: `1px solid ${C.sideBorder}`, flexShrink: 0 }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '10px' }}>
              <Sparkles size={16} color="#fff" />
            </div>
            <span style={{ fontSize: '17px', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>
              Répondly<span style={{ color: C.accent }}>.</span>
            </span>
          </div>

          <nav style={{ flex: 1, padding: '16px 10px', display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto' }}>
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
                    background: isActive ? 'rgba(99,102,241,0.15)' : 'transparent',
                    color: isActive ? '#fff' : C.sideText,
                    fontSize: '13.5px', fontWeight: isActive ? 600 : 400,
                    cursor: 'pointer', width: '100%', textAlign: 'left',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)' }}
                  onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                >
                  <span style={{ opacity: isActive ? 1 : 0.65 }}>{item.icon}</span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {item.badge && (
                    <span style={{ background: C.primary, color: '#fff', fontSize: '10px', fontWeight: 700, padding: '1px 6px', borderRadius: '100px', minWidth: '18px', textAlign: 'center' }}>{item.badge}</span>
                  )}
                </button>
              )
            })}
          </nav>

          <div style={{ padding: '14px 10px', borderTop: `1px solid ${C.sideBorder}`, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)' }}>
              <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                {userInitial}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userName}</div>
                <div style={{ fontSize: '10.5px', color: C.sideText }}>Administrateur</div>
              </div>
            </div>
          </div>
        </aside>

        {/* ═══ MAIN AREA ═══════════════════════════════════════════════════════ */}
        <div className="dashboard-bg" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

          {/* TOPBAR */}
          <header style={{
            height: '60px', flexShrink: 0,
            background: C.topbarBg,
            backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            borderBottom: `1px solid ${C.borderLight}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 24px', zIndex: 10,
          }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: C.ink, letterSpacing: '-0.02em' }}>
                {NAV.find(n => n.id === activePage)?.label || 'Tableau de bord'}
              </h1>
            </div>

            {/* Right actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {/* Profile */}
              <div ref={profileRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  style={{ width: '34px', height: '34px', borderRadius: '50%', background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})`, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: '#fff', boxShadow: '0 2px 8px rgba(99,102,241,0.2)' }}>
                  {userInitial}
                </button>
                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.13 }}
                      style={{ position: 'absolute', top: '42px', right: 0, width: '210px', background: '#fff', border: `1px solid ${C.borderLight}`, borderRadius: '14px', padding: '8px', boxShadow: '0 12px 36px rgba(0,0,0,0.1)', zIndex: 100 }}>
                      <div style={{ padding: '8px 12px 10px', borderBottom: `1px solid ${C.borderLight}`, marginBottom: '4px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: C.ink }}>{userName}</div>
                        <div style={{ fontSize: '11.5px', color: C.muted }}>{session.user?.email}</div>
                      </div>
                      {[
                        { icon: <User size={14} />, label: 'Profil', onClick: () => {} },
                        { icon: <SlidersHorizontal size={14} />, label: 'Préférences', onClick: () => setActivePage('settings') },
                      ].map((item, i) => (
                        <button key={i} onClick={() => { item.onClick(); setProfileOpen(false) }}
                          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '9px', padding: '8px 12px', borderRadius: '8px', background: 'none', border: 'none', fontSize: '13px', color: C.ink, cursor: 'pointer', textAlign: 'left', fontWeight: 500, transition: 'background 0.12s' }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#f1f5f9'}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                          <span style={{ color: C.muted }}>{item.icon}</span>{item.label}
                        </button>
                      ))}
                      <div style={{ height: '1px', background: C.borderLight, margin: '4px 0' }} />
                      <button onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '9px', padding: '8px 12px', borderRadius: '8px', background: 'none', border: 'none', fontSize: '13px', color: '#ef4444', cursor: 'pointer', textAlign: 'left', fontWeight: 500, transition: 'background 0.12s' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#fef2f2'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDPAModal(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(6px)' }} />
            <motion.div initial={{ opacity: 0, y: 20, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
              style={{ position: 'relative', width: '100%', maxWidth: '560px', background: '#fff', borderRadius: '20px', border: `1px solid ${C.borderLight}`, boxShadow: '0 30px 60px rgba(0,0,0,0.15)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '85dvh' }}>
              <div style={{ padding: '20px 28px', borderBottom: `1px solid ${C.borderLight}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: C.ink }}>Données & Conformité</h2>
                  <p style={{ margin: '3px 0 0', fontSize: '12.5px', color: C.muted }}>Accord de Traitement des Données (INPDP)</p>
                </div>
                <button onClick={() => setShowDPAModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, padding: '4px' }}><X size={18} /></button>
              </div>
              <div style={{ padding: '24px 28px', overflowY: 'auto', flex: 1 }}>
                <div
                  onScroll={e => { const t = e.target as HTMLDivElement; if (t.scrollHeight - t.scrollTop <= t.clientHeight + 10) setDpaScrolled(true) }}
                  style={{ height: '220px', overflowY: 'auto', background: '#f8fafc', border: `1px solid ${C.borderLight}`, borderRadius: '10px', padding: '14px 16px', fontSize: '12.5px', color: C.mid, lineHeight: 1.7 }}>
                  <strong style={{ color: C.ink }}>Accord de Traitement des Données (Loi n° 2004-63)</strong><br /><br />
                  Cet accord fait partie intégrante du contrat entre votre entreprise et Répondly.<br /><br />
                  <strong>1. Nature :</strong> Répondly traite les messages entrants via WhatsApp et réseaux sociaux dans le seul but d'automatiser le service client.<br /><br />
                  <strong>2. Souveraineté :</strong> Conformément à la loi tunisienne n° 2004-63, Répondly agit strictement en tant que sous-traitant. Votre entreprise demeure responsable du traitement.<br /><br />
                  <strong>3. Confidentialité :</strong> Toutes les transcriptions IA sont chiffrées. Le personnel de Répondly n'y accède pas sans autorisation.<br /><br />
                  <strong>4. Suppression :</strong> À la fin du contrat, les données sont purgées sous 30 jours.<br /><br />
                  <em style={{ color: C.muted }}>(Faites défiler pour accepter)</em><br /><br /><br />--- Fin du document ---
                </div>
              </div>
              <div style={{ padding: '16px 28px', borderTop: `1px solid ${C.borderLight}`, background: '#f8fafc', display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={() => { setSavingDPA(true); setTimeout(() => { setSavingDPA(false); setShowDPAModal(false); setHasAcceptedDPA(true) }, 1200) }} disabled={!dpaScrolled || savingDPA}
                  style={{ background: dpaScrolled ? C.primary : C.borderLight, color: dpaScrolled ? '#fff' : C.muted, border: 'none', borderRadius: '10px', padding: '10px 22px', fontSize: '13px', fontWeight: 600, cursor: dpaScrolled ? 'pointer' : 'not-allowed', transition: 'all 0.2s', boxShadow: dpaScrolled ? '0 3px 12px rgba(99,102,241,0.3)' : 'none' }}>
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowPersonaModal(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(6px)' }} />
            <motion.div initial={{ opacity: 0, y: 20, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
              style={{ position: 'relative', width: '100%', maxWidth: '460px', background: '#fff', borderRadius: '20px', border: `1px solid ${C.borderLight}`, boxShadow: '0 30px 60px rgba(0,0,0,0.15)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
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
                    <select style={{ width: '100%', padding: '10px 13px', borderRadius: '9px', border: `1px solid ${C.borderLight}`, background: '#f8fafc', color: C.ink, fontSize: '13.5px', outline: 'none' }}>
                      {field.options.map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              <div style={{ padding: '16px 28px', borderTop: `1px solid ${C.borderLight}`, background: '#f8fafc', display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={() => { setSavingPersona(true); setTimeout(() => { setSavingPersona(false); setShowPersonaModal(false); setHasConfiguredBot(true); setBotStatus('active') }, 1200) }}
                  style={{ background: C.primary, color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 22px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 3px 12px rgba(99,102,241,0.3)' }}>
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