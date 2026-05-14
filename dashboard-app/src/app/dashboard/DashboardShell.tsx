'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'
import {
  LayoutDashboard, Inbox, Bot, Settings, LogOut,
  AlertCircle, CheckCircle, X, TrendingUp,
  MessageSquare, Radio, Calendar, ChevronDown, ChevronRight, User,
  ArrowRight, Wifi, WifiOff, Zap, RefreshCw, Menu,
} from 'lucide-react'
import MessagerieView from './messagerie/MessagerieView'
import { FileText, CheckCheck, RotateCcw, Loader2, Link2, Unlink, ExternalLink, Smartphone } from 'lucide-react'

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  // New 2026 iOS color palette
  primary:     '#1A56DB',
  accentGreen: '#0EA472',
  accentPurple:'#7C3AED',
  // Channel colors
  whatsapp:    '#22C55E',
  facebook:    '#3B82F6',
  instagram:   '#EC4899',
  // Text colors
  textPrimary: '#0F172A',
  textSecondary:'#64748B',
  textTertiary:'#94A3B8',
  // Status colors
  success:     '#0EA472',
  error:       '#EF4444',
  warning:     '#F59E0B',
  info:        '#1A56DB',
  // Backgrounds
  pageBg:      '#F2F2F7',
  cardBg:      '#FFFFFF',
  glassLight:  'rgba(255, 255, 255, 0.7)',
  glassMedium: 'rgba(255, 255, 255, 0.85)',
  glassDark:   'rgba(255, 255, 255, 0.95)',
  // Borders
  border:      'rgba(0, 0, 0, 0.08)',
  borderLight: 'rgba(255, 255, 255, 0.2)',
  // Utilities
  white:       '#FFFFFF',
  muted:       '#94A3B8',
  mid:         '#475569',
  // Glass effects
  glassShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
  glassBorder: '1px solid rgba(255, 255, 255, 0.3)',
  // Corner radii
  radiusSurface: 24,
  radiusCard: 16,
  radiusInput: 12,
  radiusPill: 999,
  // Gradients
  gradientPrimary: 'linear-gradient(135deg, #1A56DB 0%, #0EA472 100%)',
  gradientPurple: 'linear-gradient(135deg, #7C3AED 0%, #1A56DB 100%)',
  gradientGreen: 'linear-gradient(135deg, #0EA472 0%, #1A56DB 100%)',
  // Additional colors
  bg: '#F2F2F7',
  sidebar: '#FFFFFF',
  sidebarHover: 'rgba(26, 86, 219, 0.04)',
  red: '#EF4444',
  greenLight: '#F0FDF4',
  greenText: '#16A34A',
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
  { id: 'calendrier', label: 'Calendrier', icon: <Calendar size={16} /> },
  { id: 'settings',   label: 'Paramètres', icon: <Settings size={16} /> },
]

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, icon, accent, loading, actionLabel, onAction, delay = 0 }: {
  label: string; value: string | number; sub: string
  icon: React.ReactNode; accent: string; loading?: boolean
  actionLabel?: string; onAction?: () => void; delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25, delay }}
      style={{
        background: C.glassMedium,
        backdropFilter: 'blur(20px)',
        borderRadius: C.radiusCard,
        boxShadow: C.glassShadow,
        border: C.glassBorder,
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        cursor: 'default',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement
        el.style.transform = 'translateY(-4px)'
        el.style.boxShadow = '0 12px 40px rgba(0,0,0,0.12)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement
        el.style.transform = 'translateY(0)'
        el.style.boxShadow = C.glassShadow
      }}
    >
      <div style={{ height: 4, background: accent, borderRadius: `${C.radiusCard}px ${C.radiusCard}px 0 0` }} />
      <div style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: C.textSecondary, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
          <div style={{
            color: accent,
          }}>
            {icon}
          </div>
        </div>
        {loading
          ? <div style={{ height: 48, width: 80, background: 'rgba(0,0,0,0.05)', borderRadius: C.radiusInput, marginBottom: 8 }} />
          : <div style={{ fontSize: 44, fontWeight: 700, color: C.textPrimary, lineHeight: 1, marginBottom: 4 }}>{value}</div>
        }
        <div style={{ fontSize: 13, color: C.textSecondary, marginBottom: actionLabel && onAction ? 12 : 0 }}>{sub}</div>
        {actionLabel && onAction && (
          <div>
            <button onClick={onAction} style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: 13, fontWeight: 600, color: C.primary,
              background: 'rgba(26, 86, 219, 0.1)', border: 'none',
              cursor: 'pointer', padding: '6px 14px', borderRadius: C.radiusPill,
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(26, 86, 219, 0.15)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(26, 86, 219, 0.1)' }}
            >
              {actionLabel} <ArrowRight size={12} />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ── Channel Card ──────────────────────────────────────────────────────────────
function ChannelCard({ label, desc, active, color, badgeBg, badgeText, onClick, delay = 0 }: {
  label: string; desc: string; active: boolean; color: string; badgeBg: string; badgeText: string; onClick: () => void; delay?: number
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25, delay }}
      onClick={onClick} style={{
        flex: 1, padding: '16px', borderRadius: C.radiusCard,
        background: C.glassMedium,
        backdropFilter: 'blur(20px)',
        border: `1px solid ${active ? color : C.border}`,
        boxShadow: C.glassShadow,
        display: 'flex', flexDirection: 'column', gap: 10,
        cursor: 'pointer', transition: 'all 0.2s ease', textAlign: 'left',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement
        el.style.transform = 'translateY(-4px)'
        el.style.boxShadow = '0 12px 40px rgba(0,0,0,0.12)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement
        el.style.transform = 'translateY(0)'
        el.style.boxShadow = C.glassShadow
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{
          width: 10, height: 10, borderRadius: '50%',
          background: active ? color : C.mid,
          boxShadow: active ? `0 0 8px ${color}cc` : 'none',
          transition: 'all 0.3s',
        }} />
        <span style={{
          fontSize: 10, fontWeight: 600,
          color: active ? badgeText : C.mid,
          background: active ? badgeBg : 'rgba(0,0,0,0.05)',
          padding: '2px 8px', borderRadius: C.radiusPill,
          textTransform: 'uppercase', letterSpacing: '0.08em',
        }}>
          {active ? 'ACTIF' : 'INACTIF'}
        </span>
      </div>
      <div>
        <div style={{ fontSize: 15, fontWeight: 600, color: C.textPrimary, marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 13, color: C.textSecondary }}>{desc}</div>
      </div>
    </motion.button>
  )
}

// ── Activity row ──────────────────────────────────────────────────────────────
function ActivityRow({ conv, onClick, delay = 0 }: { conv: RecentConv; onClick: () => void; delay?: number }) {
  const chColor = conv.channel.toLowerCase().includes('whatsapp') ? '#25D366'
    : conv.channel.toLowerCase().includes('facebook') ? '#1877F2'
    : conv.channel.toLowerCase().includes('instagram') ? '#E1306C'
    : C.primary
  const initials = conv.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
  const now = new Date()
  const d = new Date(conv.time * 1000)
  const diff = Math.floor((now.getTime() - d.getTime()) / 60000)
  const timeStr = diff < 60 ? `${diff}m` : diff < 1440 ? `${Math.floor(diff / 60)}h` : d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25, delay }}
    >
      <button onClick={onClick} style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 0', borderRadius: C.radiusInput, border: 'none',
        background: 'transparent', cursor: 'pointer', transition: 'background 0.15s',
      }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(26, 86, 219, 0.05)'}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
      >
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'rgba(26, 86, 219, 0.1)', color: C.primary,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 600, flexShrink: 0,
        }}>{initials}</div>
        <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.textPrimary }}>{conv.name}</div>
          <div style={{ fontSize: 12, color: C.textSecondary }}>{conv.channel}</div>
        </div>
        <div style={{ fontSize: 12, color: C.textTertiary, flexShrink: 0 }}>{timeStr}</div>
        {conv.unread > 0 && (
          <div style={{
            width: 20, height: 20, borderRadius: '50%',
            background: C.primary, color: '#fff',
            fontSize: 10, fontWeight: 600, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{conv.unread}</div>
        )}
      </button>
    </motion.div>
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
        width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
        background: done ? C.primary : 'rgba(0,0,0,0.05)',
        border: `2px solid ${done ? C.primary : C.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 600, color: done ? '#fff' : C.textSecondary,
        transition: 'all 0.25s',
      }}>
        {done ? <CheckCircle size={12} /> : step}
      </div>
      <span style={{
        flex: 1, fontSize: 13, fontWeight: 500,
        color: done ? C.textSecondary : C.textPrimary,
        textDecoration: done ? 'line-through' : 'none',
      }}>{label}</span>
      {!done && (
        <button onClick={onClick} style={{
          display: 'flex', alignItems: 'center', gap: 4,
          fontSize: 13, fontWeight: 600, color: C.primary,
          background: 'none', border: `1px solid ${C.primary}`,
          cursor: 'pointer', padding: '4px 12px', borderRadius: C.radiusPill,
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(26, 86, 219, 0.1)'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}
        >{cta} <ArrowRight size={12} /></button>
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
        width: 64, height: 64, borderRadius: 20,
        background: C.gradientPrimary,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', boxShadow: '0 8px 32px rgba(26, 86, 219, 0.2)',
      }}>
        {icon}
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: C.textPrimary, marginBottom: 6 }}>{label}</div>
        <div style={{ fontSize: 13, color: C.textSecondary, maxWidth: 320, lineHeight: 1.7 }}>{sublabel}</div>
      </div>
    </div>
  )
}

// ── Quick Actions Bar ───────────────────────────────────────────────────────────
function QuickActionsBar({ onNavigate }: { onNavigate: (p: PageId) => void }) {
  const actions = [
    { label: 'Nouvelle conversation', icon: <MessageSquare size={16} />, route: 'inbox' as PageId, exists: true },
    { label: 'Ajouter un canal', icon: <Radio size={16} />, route: 'settings' as PageId, exists: true },
    { label: 'Voir rapports', icon: <TrendingUp size={16} />, route: 'calendrier' as PageId, exists: false }, // TODO: wire route
    { label: 'Configurer Agent IA', icon: <Bot size={16} />, route: 'settings' as PageId, exists: true },
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
      style={{
        background: C.glassMedium,
        backdropFilter: 'blur(20px)',
        borderRadius: C.radiusCard,
        boxShadow: C.glassShadow,
        border: C.glassBorder,
        padding: '16px 24px',
        display: 'flex',
        gap: 16,
        marginBottom: 24,
      }}
    >
      {actions.map((action) => (
        <button
          key={action.label}
          onClick={() => action.exists ? onNavigate(action.route) : null}
          disabled={!action.exists}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 20px',
            borderRadius: C.radiusPill,
            background: 'rgba(26, 86, 219, 0.1)',
            color: C.primary,
            border: 'none',
            fontSize: 14,
            fontWeight: 600,
            cursor: action.exists ? 'pointer' : 'not-allowed',
            opacity: action.exists ? 1 : 0.5,
            transition: 'background 0.15s ease',
          }}
          onMouseEnter={e => { if (action.exists) (e.currentTarget as HTMLElement).style.background = 'rgba(26, 86, 219, 0.15)' }}
          onMouseLeave={e => { if (action.exists) (e.currentTarget as HTMLElement).style.background = 'rgba(26, 86, 219, 0.1)' }}
        >
          {action.icon}
          {action.label}
        </button>
      ))}
    </motion.div>
  )
}

// ── Performance Card ───────────────────────────────────────────────────────────
function PerformanceCard() {
  // TODO: wire to real API
  const metrics = [
    { label: 'Taux de résolution', value: '87%', color: C.accentGreen },
    { label: 'Temps de réponse moyen', value: '1m 24s', color: C.primary },
    { label: 'Satisfaction client', value: '4.6/5', color: C.accentGreen },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.2 }}
      style={{
        background: C.glassMedium,
        backdropFilter: 'blur(20px)',
        borderRadius: C.radiusCard,
        boxShadow: C.glassShadow,
        border: C.glassBorder,
        padding: '20px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: C.textPrimary }}>Performance</div>
        <div style={{ fontSize: 13, color: C.textSecondary }}>7 derniers jours</div>
      </div>
      <div style={{ display: 'flex', gap: 24, marginBottom: 20 }}>
        {metrics.map((metric) => (
          <div key={metric.label} style={{ flex: 1 }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: metric.color }}>{metric.value}</div>
            <div style={{ fontSize: 12, color: C.textSecondary, marginTop: 4 }}>{metric.label}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {metrics.map((metric, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 12, color: C.textSecondary, width: 140, flexShrink: 0 }}>{metric.label}</span>
            <div style={{ flex: 1, height: 6, background: 'rgba(0,0,0,0.05)', borderRadius: 3, overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: metric.value.includes('87') ? '87%' : metric.value.includes('4.6') ? '92%' : '75%' }}
                transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                style={{ height: '100%', background: metric.color, borderRadius: 3 }}
              />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

// ── AI Bot Activity Widget ─────────────────────────────────────────────────────
function BotActivityWidget() {
  // TODO: wire to real API
  const sparklineData = [12, 18, 15, 24, 20, 28, 22]
  const max = Math.max(...sparklineData)
  const width = 200
  const height = 60
  const points = sparklineData.map((val, i) => {
    const x = (i / (sparklineData.length - 1)) * width
    const y = height - (val / max) * height
    return `${x},${y}`
  }).join(' ')

  const areaPoints = `0,${height} ${points} ${width},${height}`

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.3 }}
      style={{
        background: C.glassMedium,
        backdropFilter: 'blur(20px)',
        borderRadius: C.radiusCard,
        boxShadow: C.glassShadow,
        border: C.glassBorder,
        padding: '20px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: C.textPrimary }}>Activité du Bot IA</div>
        <div style={{ fontSize: 13, color: C.textSecondary }}>
          {new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 32, marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 32, fontWeight: 700, color: C.textPrimary }}>156</div>
          <div style={{ fontSize: 12, color: C.textSecondary, marginTop: 2 }}>Messages IA</div>
          <div style={{ fontSize: 11, color: C.textSecondary }}>Traités automatiquement</div>
        </div>
        <div>
          <div style={{ fontSize: 32, fontWeight: 700, color: C.textPrimary }}>23</div>
          <div style={{ fontSize: 12, color: C.textSecondary, marginTop: 2 }}>Intervention humaine</div>
          <div style={{ fontSize: 11, color: C.textSecondary }}>Transferts aujourd'hui</div>
        </div>
      </div>
      <div style={{ position: 'relative' }}>
        <svg width={width} height={height} style={{ overflow: 'visible' }}>
          <motion.polygon
            points={areaPoints}
            fill="rgba(26, 86, 219, 0.1)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
          />
          <motion.polyline
            points={points}
            fill="none"
            stroke={C.primary}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
          />
        </svg>
      </div>
    </motion.div>
  )
}

// ── Main shell ────────────────────────────────────────────────────────────────
export default function DashboardShell() {
  const { data: session, status } = useSession()
  const [activePage, setActivePage] = useState<PageId>('home')
  const [initialPageSet, setInitialPageSet] = useState(false)
  const [toast, setToast] = useState<{ type: 'error' | 'success'; msg: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [waConnected, setWaConnected] = useState(false)
  const [fbConnected, setFbConnected] = useState(false)
  const [igConnected, setIgConnected] = useState(false)
  const [hasAcceptedDPA, setHasAcceptedDPA] = useState(false)
  const [hasConfiguredBot, setHasConfiguredBot] = useState(false)
  const [stats, setStats] = useState({ messages: 0, conversations: 0, openCount: 0 })
  const [recentConvs, setRecentConvs] = useState<RecentConv[]>([])
  const [activeConversation, setActiveConversation] = useState<{ id: number | null; status: 'EN_ATTENTE' | 'RESOLUE' | null }>({ id: null, status: null })
  const [messagerieNotesOpen, setMessagerieNotesOpen] = useState(false)

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
        
        // Fetch conversation views to calculate actual unread counts
        const viewsRes = await fetch('/api/chatwoot/conversation-view')
        const viewsData = await viewsRes.json()
        const viewsMap = new Map<number, Date>()
        viewsData?.forEach((v: any) => {
          viewsMap.set(v.conversationId, new Date(v.lastViewedAt))
        })

        // Calculate actual unread counts based on last viewed timestamp
        const conversationsWithUnread = await Promise.all(
          payload.map(async (conv: any) => {
            const lastViewedAt = viewsMap.get(conv.id)
            if (!lastViewedAt) {
              // Never viewed, use Chatwoot's unread_count
              return { ...conv, unread_count: conv.unread_count || 0 }
            }

            // Only fetch if there are potential unread messages (Chatwoot shows > 0)
            if (conv.unread_count === 0) {
              return { ...conv, unread_count: 0 }
            }

            // Fetch only recent messages to count unread incoming messages
            try {
              const msgsRes = await fetch(`/api/chatwoot/messages/${conv.id}`)
              const msgsData = await msgsRes.json()
              const messages: any[] = msgsData.payload || []
              
              // Only check last 20 messages for efficiency
              const recentMessages = messages.slice(-20)
              
              // Count incoming messages (message_type = 0) created after last viewed timestamp
              const unreadCount = recentMessages.filter(
                (msg: any) => msg.message_type === 0 && msg.created_at > Math.floor(lastViewedAt.getTime() / 1000)
              ).length

              return { ...conv, unread_count: unreadCount }
            } catch {
              // On error, use Chatwoot's unread_count
              return { ...conv, unread_count: conv.unread_count || 0 }
            }
          })
        )

        const totalUnread = conversationsWithUnread.reduce((sum, c) => sum + (c.unread_count || 0), 0)
        setStats({ conversations: openCount, messages: openCount * 4, openCount: totalUnread })
        setRecentConvs(conversationsWithUnread.slice(0, 6).map((c: any) => ({
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
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      // On mobile, default to messagerie
      if (mobile && !initialPageSet) {
        setActivePage('inbox')
        setInitialPageSet(true)
      }
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [initialPageSet])

  useEffect(() => {
    // Check for hash to set initial page
    if (!initialPageSet && typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '') as PageId
      if (hash && ['home', 'inbox', 'channels', 'calendrier', 'bot', 'settings'].includes(hash)) {
        setActivePage(hash)
        setInitialPageSet(true)
      }
    }
  }, [initialPageSet])

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
        body {
          font-family: 'Inter', system-ui, sans-serif;
          background: #FFFFFF;
          overflow: hidden;
          padding-top: env(safe-area-inset-top);
        }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: ${C.textSecondary}; }
        button { font-family: inherit; }
        @supports (padding: env(safe-area-inset-top)) {
          body {
            padding-top: env(safe-area-inset-top);
          }
        }
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
              ? <AlertCircle size={16} color={C.error} />
              : <CheckCircle size={16} color={C.success} />}
            <span style={{ fontSize: 13, fontWeight: 500, color: C.textPrimary }}>{toast.msg}</span>
            <button onClick={() => setToast(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textSecondary, padding: 0, marginLeft: 4, display: 'flex' }}>
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: 'flex', height: '100dvh', width: '100vw', overflow: 'hidden', background: '#FFFFFF', position: 'relative' }}>
        {/* Gradient status bar background for iOS PWA - blends with header */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 'env(safe-area-inset-top)',
          background: C.gradientPrimary,
          zIndex: 9999,
        }} />
        {/* Main content with solid background */}
        <div style={{
          display: 'flex',
          height: '100%',
          width: '100%',
          background: C.pageBg,
          position: 'relative',
        }}>

        {/* ══ Mobile Sidebar Overlay ══════════════════════════════════════════════ */}
        <AnimatePresence>
          {mobileSidebarOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                onClick={() => setMobileSidebarOpen(false)}
                style={{
                  position: 'fixed', inset: 0,
                  background: 'rgba(0, 0, 0, 0.4)',
                  backdropFilter: 'blur(4px)',
                  zIndex: 1000,
                }}
              />
              {/* Sidebar */}
              <motion.aside
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                style={{
                  position: 'fixed', left: 0, top: 0, bottom: 0,
                  width: 280, maxWidth: '85vw',
                  background: C.glassDark,
                  backdropFilter: 'blur(20px)',
                  zIndex: 1001,
                  display: 'flex', flexDirection: 'column',
                  boxShadow: '8px 0 32px rgba(0,0,0,0.12)',
                  borderRight: C.glassBorder,
                }}
              >
                {/* Logo */}
                <div style={{ height: 64, display: 'flex', alignItems: 'center', padding: '0 20px', borderBottom: C.glassBorder, flexShrink: 0 }}>
                  <a href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
                    <Image src="/logo.png" alt="Répondly" width={28} height={28} style={{ objectFit: 'contain' }} priority />
                    <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: C.textPrimary, letterSpacing: '-0.02em' }}>
                      Répondly<span style={{ color: C.primary }}>.</span>
                    </span>
                  </a>
                </div>

                {/* Nav */}
                <nav style={{ flex: 1, padding: '8px 0', display: 'flex', flexDirection: 'column', gap: 0, overflowY: 'auto' }}>
                  {NAV.map(item => {
                    const active = activePage === item.id
                    return (
                      <button
                        key={item.id}
                        onClick={() => { setActivePage(item.id); setMobileSidebarOpen(false) }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 14,
                          width: '100%', padding: '14px 20px',
                          background: active ? 'rgba(26, 86, 219, 0.08)' : 'transparent',
                          color: active ? C.primary : C.textSecondary,
                          fontSize: 15, fontWeight: active ? 600 : 500,
                          border: 'none', cursor: 'pointer', transition: 'background 0.2s ease', textAlign: 'left',
                          position: 'relative',
                        }}
                        onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.03)' }}
                        onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                      >
                        <span style={{ color: active ? C.primary : 'inherit' }}>{item.icon}</span>
                        <span style={{ flex: 1 }}>{item.label}</span>
                        {item.id === 'inbox' && stats.openCount > 0 && (
                          <span style={{ background: C.primary, color: '#fff', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: C.radiusPill }}>
                            {stats.openCount}
                          </span>
                        )}
                        {active && (
                          <div style={{
                            position: 'absolute', left: 0, top: 0, bottom: 0,
                            width: 3, background: C.primary,
                          }} />
                        )}
                      </button>
                    )
                  })}
                </nav>

                {/* User */}
                <div style={{ padding: '16px 20px', borderTop: C.glassBorder, background: 'transparent', flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                      background: C.primary,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 15, fontWeight: 600, color: '#fff',
                    }}>{initial}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: C.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userName}</div>
                      <div style={{ fontSize: 13, color: C.textSecondary }}>Compte actif</div>
                    </div>
                    <button onClick={() => { signOut(); setMobileSidebarOpen(false) }} title="Déconnexion" style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textSecondary, padding: 8, display: 'flex', borderRadius: 8, transition: 'color 0.15s' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = C.error}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = C.textSecondary}
                    >
                      <LogOut size={18} />
                    </button>
                  </div>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* ══ Sidebar ══════════════════════════════════════════════════════════ */}
        {!isMobile && (
          <aside style={{
            width: 200, flexShrink: 0,
            background: C.glassDark,
            borderRight: C.glassBorder,
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
          } as React.CSSProperties}>
            {/* Logo */}
            <div style={{ height: 64, display: 'flex', alignItems: 'center', padding: '0 16px', borderBottom: C.glassBorder, flexShrink: 0 }}>
              <a href="https://repondly.com" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
                <Image src="/logo.png" alt="Répondly" width={28} height={28} style={{ objectFit: 'contain' }} priority />
                <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: C.textPrimary, letterSpacing: '-0.02em' }}>
                  Répondly<span style={{ color: C.primary }}>.</span>
                </span>
              </a>
            </div>

            {/* Nav */}
            <nav style={{ flex: 1, padding: '16px 0', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.mid, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0 16px', marginTop: 24, marginBottom: 8 }}>
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
                      width: '100%', padding: '10px 16px', borderRadius: 8,
                      background: active ? 'rgba(0,0,0,0.05)' : 'transparent',
                      color: active ? C.textPrimary : C.textSecondary,
                      fontSize: 13, fontWeight: active ? 600 : 400,
                      border: 'none', cursor: 'pointer', transition: 'all 0.15s ease', textAlign: 'left',
                      borderLeft: active ? `3px solid ${C.primary}` : '3px solid transparent',
                    }}
                    onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.03)'; (e.currentTarget as HTMLElement).style.color = C.textPrimary } }}
                    onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = C.textSecondary } }}
                  >
                    <span style={{ color: active ? C.primary : 'inherit' }}>{item.icon}</span>
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {item.id === 'inbox' && stats.openCount > 0 && (
                      <span style={{ background: C.primary, color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20 }}>
                        {stats.openCount}
                      </span>
                    )}
                    {item.id === 'channels' && !anyChannel && (
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.warning, flexShrink: 0 }} />
                    )}
                  </button>
                )
              })}

              {/* Channel status widget */}
              <div style={{ marginTop: 24, padding: '14px 16px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.mid, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Statut des canaux</div>
                {[
                  { label: 'WhatsApp', active: waConnected, color: C.whatsapp, badgeBg: 'rgba(34, 197, 94, 0.1)', badgeText: C.success },
                  { label: 'Facebook', active: fbConnected, color: C.facebook, badgeBg: 'rgba(26, 86, 219, 0.1)', badgeText: C.primary },
                  { label: 'Instagram', active: igConnected, color: C.instagram, badgeBg: 'rgba(236, 72, 153, 0.1)', badgeText: C.instagram },
                ].map(ch => (
                  <div key={ch.label} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '5px 0' }}>
                    <span style={{
                      width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                      background: ch.active ? ch.color: C.mid,
                      boxShadow: ch.active ? `0 0 8px ${ch.color}cc` : 'none',
                      transition: 'all 0.3s',
                    }} />
                    <span style={{ fontSize: 12, color: ch.active ? C.muted : C.mid, flex: 1 }}>{ch.label}</span>
                    <span style={{ 
                      fontSize: 10, fontWeight: 700, 
                      color: ch.active ? ch.badgeText : C.mid,
                      background: ch.active ? ch.badgeBg : C.bg,
                      padding: '2px 6px', borderRadius: 4,
                    }}>
                      {ch.active ? 'ON' : 'OFF'}
                    </span>
                  </div>
                ))}
              </div>
            </nav>

            {/* User */}
            <div style={{ padding: '16px', borderTop: `1px solid ${C.sidebarHover}`, background: C.sidebar, flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                  background: C.primary,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 700, color: '#fff',
                }}>{initial}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.white, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userName}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>Compte actif</div>
                </div>
                <button onClick={() => signOut()} title="Déconnexion" style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, padding: 4, display: 'flex', borderRadius: 6, transition: 'color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = C.white}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = C.muted}
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
            background: C.gradientPrimary,
            borderBottom: 'none',
            display: 'flex', alignItems: 'center',
            padding: isMobile ? '0 12px' : '0 24px',
            gap: 12,
            position: 'relative',
          } as React.CSSProperties}>
            {isMobile ? (
              <>
                {/* Hamburger menu */}
                <button
                  onClick={() => setMobileSidebarOpen(true)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.15)', border: 'none',
                    cursor: 'pointer', padding: 10,
                    color: '#fff',
                    borderRadius: 12,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  <Menu size={22} />
                </button>

                {/* Repondly branding */}
                <a href="https://repondly.com" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', marginRight: 'auto' }}>
                  <Image src="/logo.png" alt="Répondly" width={28} height={28} style={{ objectFit: 'contain' }} priority />
                  <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: '#fff', letterSpacing: '-0.02em' }}>
                    Répondly<span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>.</span>
                  </span>
                </a>

                {/* User avatar */}
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.25)',
                    backdropFilter: 'blur(10px)',
                    border: profileOpen ? `2px solid rgba(255, 255, 255, 0.6)` : '2px solid rgba(255, 255, 255, 0.3)',
                    color: '#fff', fontSize: 15, fontWeight: 600,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s',
                  }}
                >{initial}</button>

                {/* Profile dropdown */}
                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -8 }}
                      transition={{ duration: 0.12 }}
                      style={{
                        position: 'absolute', top: 72, right: 12,
                        background: C.cardBg, border: `1px solid ${C.border}`,
                        borderRadius: 12, padding: 6,
                        minWidth: 180, boxShadow: '0 16px 40px rgba(15,23,42,0.12)',
                        zIndex: 200,
                      }}
                    >
                      <div style={{ padding: '10px 12px 8px', borderBottom: `1px solid ${C.border}`, marginBottom: 4 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: C.textPrimary }}>{userName}</div>
                        <div style={{ fontSize: 11, color: C.textSecondary, marginTop: 1 }}>{session.user?.email}</div>
                      </div>
                      <button
                        onClick={() => setProfileOpen(false)}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: 7, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, color: C.textPrimary, transition: 'background 0.12s' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.bg}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                      >
                        <User size={14} color={C.textSecondary} /> Profil
                      </button>
                      <button
                        onClick={() => signOut()}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: 7, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, color: C.red, transition: 'background 0.12s' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#FEE2E2'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                      >
                        <LogOut size={14} /> Déconnexion
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            ) : (
              <>
                <a href="https://repondly.com" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginRight: 8 }}>
                  <Image src="/logo.png" alt="Répondly" width={28} height={28} style={{ objectFit: 'contain' }} priority />
                  <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: C.textPrimary, letterSpacing: '-0.02em' }}>
                    Répondly<span style={{ color: C.primary }}>.</span>
                  </span>
                </a>
                <div>
                  <div style={{ fontSize: 12, color: C.textSecondary }}>
                    Bienvenu, <span style={{ fontWeight: 600, color: C.textPrimary }}>{userName}</span>
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: C.textPrimary, marginTop: 1 }}>
                    {NAV.find(n => n.id === activePage)?.label ?? 'Tableau de bord'}
                  </div>
                </div>

                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
                  {anyChannel && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 20, background: C.greenLight, border: `1px solid ${C.success}` }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.success }} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: C.greenText }}>{activeChannels} canaux actifs</span>
                    </div>
                  )}
                  <button onClick={() => fetchStatus()} style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 8, padding: 7, cursor: 'pointer', color: C.textSecondary, display: 'flex', transition: 'all 0.15s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = C.primary; (e.currentTarget as HTMLElement).style.color = C.primary }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.color = C.textSecondary }}
                  >
                    <Settings size={14} />
                  </button>

                  {/* Profile avatar + dropdown */}
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={() => setProfileOpen(!profileOpen)}
                      style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: C.primary,
                        border: profileOpen ? `2px solid ${C.primary}` : '2px solid transparent',
                        color: '#fff', fontSize: 14, fontWeight: 700,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'border-color 0.15s',
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
                            background: C.cardBg, border: `1px solid ${C.border}`,
                            borderRadius: 12, padding: 6,
                            minWidth: 180, boxShadow: '0 16px 40px rgba(15,23,42,0.12)',
                            zIndex: 200,
                          }}
                        >
                          <div style={{ padding: '10px 12px 8px', borderBottom: `1px solid ${C.border}`, marginBottom: 4 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: C.textPrimary }}>{userName}</div>
                            <div style={{ fontSize: 11, color: C.textSecondary, marginTop: 1 }}>{session.user?.email}</div>
                          </div>
                          <button
                            onClick={() => setProfileOpen(false)}
                            style={{ width: '100%', padding: '8px 12px', borderRadius: 7, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, color: C.textPrimary, transition: 'background 0.12s' }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.bg}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                          >
                            <User size={14} color={C.textSecondary} /> Profil
                          </button>
                          <button
                            onClick={() => signOut()}
                            style={{ width: '100%', padding: '8px 12px', borderRadius: 7, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, color: C.red, transition: 'background 0.12s' }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#FEE2E2'}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                          >
                            <LogOut size={14} /> Déconnexion
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </>
            )}
          </header>

          {/* ── Content area ── */}
          <main style={{
            flex: 1, overflowY: activePage === 'inbox' ? 'hidden' : 'auto',
            position: 'relative',
            paddingBottom: isMobile ? 66 : 0,
            background: C.pageBg,
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
                {activePage === 'inbox' && (
                  <MessagerieView
                    onConversationChange={(id, status) => setActiveConversation({ id, status })}
                    externalNotesOpen={messagerieNotesOpen}
                    onNotesOpenChange={setMessagerieNotesOpen}
                  />
                )}
                {activePage === 'channels' && (
                  <div style={{ padding: isMobile ? '16px' : '28px 32px' }}>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    >
                      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                        <div style={{
                          width: 64, height: 64, borderRadius: 20,
                          background: C.gradientPrimary,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#fff', boxShadow: '0 8px 32px rgba(26, 86, 219, 0.2)', marginBottom: 20,
                        }}>
                          <Radio size={28} />
                        </div>
                        <h2 style={{ fontSize: 20, fontWeight: 600, color: C.textPrimary, marginBottom: 8 }}>Canaux déplacés</h2>
                        <p style={{ fontSize: 14, color: C.textSecondary, marginBottom: 24, maxWidth: 320, margin: '0 auto 24px' }}>
                          La gestion des canaux est maintenant disponible dans les Paramètres.
                        </p>
                        <button
                          onClick={() => setActivePage('settings')}
                          style={{
                            padding: '12px 24px',
                            borderRadius: C.radiusPill,
                            background: C.primary,
                            color: '#fff',
                            border: 'none',
                            fontSize: 14,
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Aller aux Paramètres
                        </button>
                      </div>
                    </motion.div>
                  </div>
                )}
                {activePage === 'home' && (
                  <HomeView
                    loading={loading} stats={stats} recentConvs={recentConvs}
                    waConnected={waConnected} fbConnected={fbConnected} igConnected={igConnected}
                    hasAcceptedDPA={hasAcceptedDPA} hasConfiguredBot={hasConfiguredBot}
                    setupCount={setupCount}
                    onNavigate={setActivePage}
                    onSignDPA={() => setHasAcceptedDPA(true)}
                    isMobile={isMobile}
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
                  <div style={{ padding: isMobile ? '16px' : '28px 32px' }}>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    >
                      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                        <div style={{
                          width: 64, height: 64, borderRadius: 20,
                          background: C.gradientPurple,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#fff', boxShadow: '0 8px 32px rgba(124, 58, 237, 0.2)', marginBottom: 20,
                        }}>
                          <Bot size={28} />
                        </div>
                        <h2 style={{ fontSize: 20, fontWeight: 600, color: C.textPrimary, marginBottom: 8 }}>Agent IA déplacé</h2>
                        <p style={{ fontSize: 14, color: C.textSecondary, marginBottom: 24, maxWidth: 320, margin: '0 auto 24px' }}>
                          La configuration de l'agent IA est maintenant disponible dans les Paramètres.
                        </p>
                        <button
                          onClick={() => setActivePage('settings')}
                          style={{
                            padding: '12px 24px',
                            borderRadius: C.radiusPill,
                            background: C.accentPurple,
                            color: '#fff',
                            border: 'none',
                            fontSize: 14,
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Aller aux Paramètres
                        </button>
                      </div>
                    </motion.div>
                  </div>
                )}
                {activePage === 'settings' && (
                  <SettingsView
                    onNavigate={setActivePage}
                    waConnected={waConnected}
                    fbConnected={fbConnected}
                    igConnected={igConnected}
                    onStatusChange={fetchStatus}
                    isMobile={isMobile}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </main>

          {/* ── Mobile bottom navigation - Floating pill ── */}
          {isMobile && (
            <div style={{
              position: 'fixed', bottom: 20, left: 16, right: 16,
              height: 64,
              background: C.glassMedium,
              backdropFilter: 'blur(20px)',
              borderRadius: 32,
              border: C.glassBorder,
              boxShadow: C.glassShadow,
              display: 'flex', alignItems: 'center',
              padding: '0 8px',
              zIndex: 1000,
              paddingBottom: 0,
            }}>
              {NAV.map((item, index) => {
                const active = activePage === item.id
                return (
                  <motion.button
                    key={item.id}
                    onClick={() => setActivePage(item.id)}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      gap: 4, padding: '8px 4px', background: 'none', border: 'none', cursor: 'pointer',
                      position: 'relative',
                    }}
                  >
                    {/* Active indicator pill */}
                    {active && (
                      <motion.div
                        layoutId="activeNavPill"
                        initial={false}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        style={{
                          position: 'absolute',
                          inset: 4,
                          background: 'rgba(26, 86, 219, 0.1)',
                          borderRadius: 20,
                          zIndex: -1,
                        }}
                      />
                    )}
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: active ? C.primary : C.textSecondary,
                      transition: 'color 0.2s',
                      position: 'relative',
                    }}>
                      {item.icon}
                      {item.id === 'inbox' && stats.openCount > 0 && (
                        <span style={{
                          position: 'absolute', top: -4, right: -4,
                          width: 16, height: 16, borderRadius: '50%',
                          background: C.error, border: '2px solid #fff',
                          fontSize: 9, fontWeight: 600, color: '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {stats.openCount}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: 10, fontWeight: active ? 600 : 500, color: active ? C.primary : C.textSecondary }}>
                      {item.label}
                    </span>
                  </motion.button>
                )
              })}
            </div>
          )}
        </div>
        </div>
      </div>
    </>
  )
}

// ── Settings View ────────────────────────────────────────────────────────────────
function SettingsView({
  onNavigate, waConnected, fbConnected, igConnected, onStatusChange, isMobile,
}: {
  onNavigate: (p: PageId) => void
  waConnected: boolean
  fbConnected: boolean
  igConnected: boolean
  onStatusChange: () => void
  isMobile: boolean
}) {
  const settingsSections = [
    {
      id: 'channels',
      title: 'Canaux',
      description: 'Gérez vos canaux de communication',
      icon: <Radio size={20} />,
      color: C.primary,
      onClick: () => {/* Navigate to channels - for now, could be inline */},
      connected: waConnected || fbConnected || igConnected,
    },
    {
      id: 'bot',
      title: 'Agent IA',
      description: 'Configurez votre assistant intelligent',
      icon: <Bot size={20} />,
      color: C.accentPurple,
      onClick: () => {/* Navigate to bot config - for now, could be inline */},
      connected: false,
    },
    {
      id: 'account',
      title: 'Compte',
      description: 'Informations du compte et sécurité',
      icon: <User size={20} />,
      color: C.accentGreen,
      onClick: () => {},
      connected: true,
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Préférences de notification',
      icon: <MessageSquare size={20} />,
      color: C.warning,
      onClick: () => {},
      connected: true,
    },
  ]

  return (
    <div style={{
      padding: isMobile ? '16px' : '28px 32px',
      minHeight: '100%',
      background: C.pageBg,
    }}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 28, fontWeight: 600, color: C.textPrimary, marginBottom: 8 }}>Paramètres</h1>
          <p style={{ fontSize: 14, color: C.textSecondary }}>Gérez vos préférences et configurations</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {settingsSections.map((section, index) => (
            <motion.button
              key={section.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25, delay: index * 0.05 }}
              onClick={section.onClick}
              style={{
                width: '100%',
                padding: '20px',
                borderRadius: C.radiusCard,
                background: C.glassMedium,
                backdropFilter: 'blur(20px)',
                border: C.glassBorder,
                boxShadow: C.glassShadow,
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'left',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement
                el.style.transform = 'translateY(-2px)'
                el.style.boxShadow = '0 12px 40px rgba(0,0,0,0.12)'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement
                el.style.transform = 'translateY(0)'
                el.style.boxShadow = C.glassShadow
              }}
            >
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: `${section.color}15`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: section.color,
              }}>
                {section.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: C.textPrimary, marginBottom: 4 }}>{section.title}</div>
                <div style={{ fontSize: 13, color: C.textSecondary }}>{section.description}</div>
              </div>
              {section.connected !== undefined && (
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: section.connected ? C.success : C.mid,
                  boxShadow: section.connected ? `0 0 8px ${C.success}cc` : 'none',
                }} />
              )}
              <ChevronRight size={18} color={C.textSecondary} />
            </motion.button>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{ marginTop: 32, padding: '20px', borderRadius: C.radiusCard, background: C.glassMedium, backdropFilter: 'blur(20px)', border: C.glassBorder }}
        >
          <div style={{ fontSize: 14, fontWeight: 600, color: C.textPrimary, marginBottom: 12 }}>Statut des canaux</div>
          <div style={{ display: 'flex', gap: 24 }}>
            {[
              { label: 'WhatsApp', connected: waConnected, color: C.whatsapp },
              { label: 'Facebook', connected: fbConnected, color: C.facebook },
              { label: 'Instagram', connected: igConnected, color: C.instagram },
            ].map(ch => (
              <div key={ch.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: ch.connected ? ch.color : C.mid,
                  boxShadow: ch.connected ? `0 0 8px ${ch.color}cc` : 'none',
                }} />
                <span style={{ fontSize: 13, color: ch.connected ? C.textPrimary : C.textSecondary }}>{ch.label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

// ── Home view ─────────────────────────────────────────────────────────────────
function HomeView({
  loading, stats, recentConvs, waConnected, fbConnected, igConnected,
  hasAcceptedDPA, hasConfiguredBot, setupCount, onNavigate, onSignDPA, isMobile,
}: {
  loading: boolean
  stats: { messages: number; conversations: number; openCount: number }
  recentConvs: RecentConv[]
  waConnected: boolean; fbConnected: boolean; igConnected: boolean
  hasAcceptedDPA: boolean; hasConfiguredBot: boolean; setupCount: number
  onNavigate: (p: PageId) => void
  onSignDPA: () => void
  isMobile: boolean
}) {
  const anyChannel = waConnected || fbConnected || igConnected
  const activeChannels = [waConnected, fbConnected, igConnected].filter(Boolean).length
  const [filterTab, setFilterTab] = useState<'all' | 'unread' | 'pending' | 'resolved'>('all')

  const filteredConvs = recentConvs.filter(conv => {
    if (filterTab === 'all') return true
    if (filterTab === 'unread') return conv.unread > 0
    if (filterTab === 'pending') return conv.unread === 0
    if (filterTab === 'resolved') return false // TODO: implement when status field available
    return true
  })

  return (
    <div style={{
      padding: isMobile ? '16px' : '28px 32px',
      minHeight: '100%',
      background: C.pageBg,
    }}>

      {/* ── Quick Actions Bar ── */}
      {!isMobile && <QuickActionsBar onNavigate={onNavigate} />}

      {/* ── KPI row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <KpiCard
          label="Conversations ouvertes"
          value={loading ? '—' : stats.openCount}
          sub="En attente de réponse"
          icon={<MessageSquare size={18} />}
          accent={C.primary}
          loading={loading}
          actionLabel="Messagerie →"
          onAction={() => onNavigate('inbox')}
          delay={0}
        />
        <KpiCard
          label="Messages traités"
          value={loading ? '—' : stats.messages}
          sub="Estimation totale"
          icon={<TrendingUp size={18} />}
          accent={C.accentGreen}
          loading={loading}
          actionLabel="Paramètres →"
          onAction={() => onNavigate('settings')}
          delay={0.05}
        />
        <KpiCard
          label="Canaux actifs"
          value={loading ? '—' : activeChannels}
          sub="Sur 3 disponibles"
          icon={<Wifi size={18} />}
          accent={C.success}
          loading={loading}
          actionLabel="Paramètres →"
          onAction={() => onNavigate('settings')}
          delay={0.1}
        />
        <KpiCard
          label="Automatisation IA"
          value="—"
          sub="Bientôt disponible"
          icon={<Zap size={18} />}
          accent={C.accentPurple}
          loading={loading}
          actionLabel="Paramètres →"
          onAction={() => onNavigate('settings')}
          delay={0.15}
        />
      </div>

      {/* ── Performance | Mise en Service ── */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.5fr 1fr', gap: 20, marginBottom: 24 }}>
        <PerformanceCard />
        <div style={{ background: C.glassMedium, backdropFilter: 'blur(20px)', borderRadius: C.radiusCard, boxShadow: C.glassShadow, border: C.glassBorder, padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: C.textPrimary }}>Mise en service</div>
            <div style={{ fontSize: 13, color: C.textSecondary }}>{setupCount}/3 étapes</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <SetupStep
              done={anyChannel}
              step={1}
              label="Connecter un canal"
              cta="Connecter →"
              onClick={() => onNavigate('settings')}
            />
            <SetupStep
              done={hasAcceptedDPA}
              step={2}
              label="Accepter les CGU"
              cta="Accepter →"
              onClick={onSignDPA}
            />
            <SetupStep
              done={hasConfiguredBot}
              step={3}
              label="Configurer l'agent IA"
              cta="Configurer →"
              onClick={() => onNavigate('settings')}
            />
          </div>
        </div>
      </div>

      {/* ── Activité Récente | Statut Système ── */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.5fr 1fr', gap: 20, marginBottom: 24 }}>
        <div style={{ background: C.glassMedium, backdropFilter: 'blur(20px)', borderRadius: C.radiusCard, boxShadow: C.glassShadow, border: C.glassBorder, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: C.glassBorder, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: C.textPrimary }}>Activité récente</div>
              <div style={{ fontSize: 12, color: C.textSecondary, marginTop: 2 }}>Dernières conversations ouvertes</div>
            </div>
            <button onClick={() => onNavigate('inbox')} style={{ fontSize: 13, fontWeight: 600, color: C.primary, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              Voir tout <ArrowRight size={12} />
            </button>
          </div>
          <div style={{ padding: '12px 20px', display: 'flex', gap: 8, overflowX: 'auto' }}>
            {['all', 'unread', 'pending', 'resolved'].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilterTab(tab as any)}
                style={{
                  padding: '4px 14px',
                  borderRadius: C.radiusPill,
                  fontSize: 13,
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  background: filterTab === tab ? C.primary : 'rgba(0,0,0,0.03)',
                  color: filterTab === tab ? '#fff' : C.textSecondary,
                  transition: 'background 0.15s',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => { if (filterTab !== tab) (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.06)' }}
                onMouseLeave={e => { if (filterTab !== tab) (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.03)' }}
              >
                {tab === 'all' ? 'Tous' : tab === 'unread' ? 'Non lus' : tab === 'pending' ? 'En attente' : 'Résolus'}
              </button>
            ))}
          </div>
          <div style={{ padding: '0 20px 16px' }}>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: i < 3 ? `1px solid ${C.border}` : 'none' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,0,0,0.05)', flexShrink: 0 }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center' }}>
                    <div style={{ height: 14, width: '40%', background: 'rgba(0,0,0,0.05)', borderRadius: C.radiusInput }} />
                    <div style={{ height: 12, width: '70%', background: 'rgba(0,0,0,0.05)', borderRadius: C.radiusInput }} />
                  </div>
                </div>
              ))
            ) : filteredConvs.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: C.textSecondary, fontSize: 13 }}>
                <MessageSquare size={32} style={{ margin: '0 auto 12px', opacity: 0.4, display: 'block' }} />
                Aucune conversation ouverte
              </div>
            ) : (
              filteredConvs.map((conv, i) => (
                <div key={conv.id} style={{ borderBottom: i < filteredConvs.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                  <ActivityRow conv={conv} onClick={() => onNavigate('inbox')} delay={i * 0.03} />
                </div>
              ))
            )}
          </div>
        </div>

        <div style={{ background: C.glassMedium, backdropFilter: 'blur(20px)', borderRadius: C.radiusCard, boxShadow: C.glassShadow, border: C.glassBorder, padding: '20px' }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: C.textPrimary, marginBottom: 16 }}>Statut système</div>
          {[
            { label: 'Plateforme Répondly', ok: true },
            { label: 'Chatwoot', ok: stats.openCount >= 0 },
            { label: 'Canaux connectés', ok: anyChannel },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: C.glassBorder }}>
              <span style={{ fontSize: 13, color: C.textPrimary }}>{item.label}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <motion.span
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ width: 8, height: 8, borderRadius: '50%', background: item.ok ? C.success : C.textSecondary }}
                />
                <span style={{ fontSize: 12, fontWeight: 600, color: item.ok ? C.success : C.textSecondary, background: item.ok ? 'rgba(14, 164, 114, 0.1)' : 'rgba(0,0,0,0.03)', padding: '2px 10px', borderRadius: C.radiusPill }}>
                  {item.ok ? 'Opérationnel' : 'Inactif'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Canaux de Messagerie ── */}
      <div style={{ background: C.glassMedium, backdropFilter: 'blur(20px)', borderRadius: C.radiusCard, boxShadow: C.glassShadow, border: C.glassBorder, overflow: 'hidden', marginBottom: 24 }}>
        <div style={{ padding: '16px 20px', borderBottom: C.glassBorder, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: C.textPrimary }}>Canaux de messagerie</div>
          <button onClick={() => onNavigate('settings')} style={{ fontSize: 13, fontWeight: 600, color: C.primary, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
            Gérer <ArrowRight size={12} />
          </button>
        </div>
        <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 16 }}>
          <ChannelCard label="WhatsApp" desc="Messages & automatisation" active={waConnected} color={C.whatsapp} badgeBg="rgba(34, 197, 94, 0.1)" badgeText={C.success} onClick={() => onNavigate('settings')} delay={0} />
          <ChannelCard label="Facebook" desc="Page & discussions" active={fbConnected} color={C.facebook} badgeBg="rgba(59, 130, 246, 0.1)" badgeText={C.primary} onClick={() => onNavigate('settings')} delay={0.04} />
          <ChannelCard label="Instagram" desc="DMs & réponses auto" active={igConnected} color={C.instagram} badgeBg="rgba(236, 72, 153, 0.1)" badgeText={C.instagram} onClick={() => onNavigate('settings')} delay={0.08} />
        </div>
      </div>

      {/* ── AI Bot Activity Widget ── */}
      <BotActivityWidget />
    </div>
  )
}

// ── Channels view ────────────────────────────────────────────────────────────────
function ChannelsView({
  waConnected, fbConnected, igConnected, onStatusChange, onToast, isMobile,
}: {
  waConnected: boolean; fbConnected: boolean; igConnected: boolean
  onStatusChange: () => void; onToast: (type: 'error' | 'success', msg: string) => void
  isMobile: boolean
}) {
  const [connectingFb, setConnectingFb] = useState(false)
  const [connectingWa, setConnectingWa] = useState(false)
  const [showDisconnectModal, setShowDisconnectModal] = useState<{ channel: string; onConfirm: () => void } | null>(null)
  const [disconnecting, setDisconnecting] = useState(false)

  const META_APP_ID = process.env.NEXT_PUBLIC_META_APP_ID || ''
  const META_CONFIG_ID = process.env.NEXT_PUBLIC_META_CONFIG_ID || ''

  // Load FB SDK
  useEffect(() => {
    const loadFBSDK = () => {
      if (typeof window !== 'undefined' && !(window as any).FB) {
        const script = document.createElement('script')
        script.id = 'facebook-jssdk'
        script.src = 'https://connect.facebook.net/en_US/sdk.js'
        script.async = true
        script.defer = true
        document.body.appendChild(script)
        ;(window as any).fbAsyncInit = () => {
          ;(window as any).FB.init({ appId: META_APP_ID, cookie: true, xfbml: false, version: 'v21.0' })
        }
      }
    }
    loadFBSDK()
  }, [META_APP_ID])

  // Handle Facebook/Instagram connect
  const handleFbConnect = () => {
    if (!META_APP_ID) {
      onToast('error', 'NEXT_PUBLIC_META_APP_ID non configuré')
      return
    }
    const FB = (window as any).FB
    if (!FB) {
      onToast('error', 'SDK Facebook pas prêt')
      return
    }
    setConnectingFb(true)
    FB.login(
      (response: any) => {
        if (response.status !== 'connected' || !response.authResponse?.accessToken) {
          setConnectingFb(false)
          return
        }
        connectFbWithToken(response.authResponse.accessToken)
      },
      { scope: 'pages_show_list,pages_messaging,pages_read_engagement,instagram_basic,instagram_manage_messages', return_scopes: true, auth_type: 'rerequest' }
    )
  }

  const connectFbWithToken = async (token: string) => {
    try {
      const res = await fetch('/api/auth/meta/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fbAccessToken: token }),
      })
      const d = await res.json()
      if (!res.ok || !d.success) throw new Error(d.error || 'Échec connexion')
      onToast('success', 'Facebook & Instagram connectés !')
      onStatusChange()
    } catch (err: any) {
      onToast('error', err.message)
    } finally {
      setConnectingFb(false)
    }
  }

  // Handle WhatsApp connect
  const handleWaConnect = () => {
    if (!META_CONFIG_ID) {
      onToast('error', 'NEXT_PUBLIC_META_CONFIG_ID non configuré')
      return
    }
    const FB = (window as any).FB
    if (!FB) {
      onToast('error', 'SDK pas prêt')
      return
    }
    setConnectingWa(true)
    FB.login(
      () => {},
      { config_id: META_CONFIG_ID, response_type: 'code', override_default_response_type: true, extras: { setup: {}, featureType: '', sessionInfoVersion: '3' } }
    )
  }

  // Listen for WA Embedded Signup
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
        if (!res.ok) throw new Error(d.error || 'Échec')
        onToast('success', 'WhatsApp connecté !')
        onStatusChange()
      } catch (err: any) {
        onToast('error', err.message)
      } finally {
        setConnectingWa(false)
      }
    }
    window.addEventListener('message', handle)
    return () => window.removeEventListener('message', handle)
  }, [onToast, onStatusChange])

  // Disconnect handlers
  const handleDisconnectFb = () => {
    setShowDisconnectModal({
      channel: 'Facebook & Instagram',
      onConfirm: async () => {
        setDisconnecting(true)
        try {
          const res = await fetch('/api/meta/pages')
          if (!res.ok) throw new Error('Erreur')
          const data = await res.json()
          await Promise.all((data.pages || []).map((p: any) =>
            fetch(`/api/meta/pages?pageId=${p.pageId}&channel=${p.channel}`, { method: 'DELETE' })
          ))
          onToast('success', 'Déconnecté')
          onStatusChange()
        } catch (err: any) {
          onToast('error', err.message)
        } finally {
          setDisconnecting(false)
          setShowDisconnectModal(null)
        }
      },
    })
  }

  const handleDisconnectWa = () => {
    setShowDisconnectModal({
      channel: 'WhatsApp',
      onConfirm: async () => {
        setDisconnecting(true)
        try {
          const res = await fetch('/api/whatsapp/disconnect', { method: 'POST' })
          if (!res.ok) throw new Error('Erreur')
          onToast('success', 'WhatsApp déconnecté')
          onStatusChange()
        } catch (err: any) {
          onToast('error', err.message)
        } finally {
          setDisconnecting(false)
          setShowDisconnectModal(null)
        }
      },
    })
  }

  return (
    <>
      <AnimatePresence>
        {showDisconnectModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}
            onClick={() => setShowDisconnectModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ background: C.cardBg, borderRadius: 16, padding: '24px', width: isMobile ? '90%' : 360, boxShadow: '0 20px 60px rgba(0,0,0,0.15)', border: `1px solid ${C.border}` }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 12, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Unlink size={18} color={C.red} />
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: C.textPrimary, marginBottom: 8 }}>Déconnecter {showDisconnectModal.channel} ?</h3>
              <p style={{ fontSize: 13, color: C.textSecondary, lineHeight: 1.6, marginBottom: 20 }}>
                Cela supprimera l'inbox dans Chatwoot. Vous pourrez reconnecter à tout moment.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setShowDisconnectModal(null)} style={{ flex: 1, padding: '10px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.cardBg, color: C.textPrimary, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  Annuler
                </button>
                <button onClick={showDisconnectModal.onConfirm} disabled={disconnecting} style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', background: C.red, color: '#fff', fontSize: 13, fontWeight: 600, cursor: disconnecting ? 'not-allowed' : 'pointer', opacity: disconnecting ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  {disconnecting ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Unlink size={13} />}
                  Déconnecter
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{
        padding: isMobile ? '16px' : '28px 32px',
        minHeight: '100%',
        background: C.pageBg,
      }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: C.textPrimary, marginBottom: 8 }}>
            Canaux de messagerie
          </h2>
          <p style={{ fontSize: 13, color: C.textSecondary, lineHeight: 1.6 }}>
            Connectez vos canaux pour recevoir et répondre aux messages automatiquement.
          </p>
        </div>

        {/* Status summary */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          {[
            { label: 'WhatsApp', active: waConnected, color: C.whatsapp, icon: <Smartphone size={14} /> },
            { label: 'Facebook', active: fbConnected, color: C.facebook, icon: <MessageSquare size={14} /> },
            { label: 'Instagram', active: igConnected, color: C.instagram, icon: <Radio size={14} /> },
          ].map(ch => (
            <div key={ch.label} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 16px', borderRadius: 12,
              background: ch.active ? `${ch.color}0d` : C.cardBg,
              border: `1px solid ${ch.active ? `${ch.color}2a` : C.border}`,
              flex: isMobile ? '1 1 100%' : '1',
              minWidth: isMobile ? '100%' : 0,
            }}>
              <span style={{ color: ch.active ? ch.color : C.muted }}>{ch.icon}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: ch.active ? C.textPrimary : C.textSecondary }}>{ch.label}</span>
              <span style={{
                marginLeft: 'auto',
                width: 8, height: 8, borderRadius: '50%',
                background: ch.active ? ch.color : C.border,
                boxShadow: ch.active ? `0 0 8px ${ch.color}cc` : 'none',
              }} />
            </div>
          ))}
        </div>

        {/* Channel cards */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 20, marginBottom: 24 }}>
          {/* WhatsApp */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}
            style={{
              background: C.cardBg, borderRadius: 16, border: `1px solid ${waConnected ? `${C.whatsapp}33` : C.border}`,
              overflow: 'hidden', boxShadow: waConnected ? `0 4px 24px ${C.whatsapp}12` : '0 1px 3px rgba(0,0,0,0.08)',
            }}
          >
            {waConnected && <div style={{ height: 3, background: C.whatsapp }} />}
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `${C.whatsapp}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.whatsapp }}>
                  <Smartphone size={20} />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.textPrimary }}>WhatsApp Business</div>
                  <div style={{ fontSize: 12, color: C.textSecondary, marginTop: 2 }}>
                    {waConnected ? 'Connecté et opérationnel' : 'Non connecté'}
                  </div>
                </div>
              </div>
              {!waConnected && (
                <button
                  onClick={handleWaConnect} disabled={connectingWa}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '10px', borderRadius: 8, border: 'none',
                    background: connectingWa ? C.muted : C.whatsapp, color: '#fff',
                    fontSize: 13, fontWeight: 600, cursor: connectingWa ? 'not-allowed' : 'pointer',
                  }}
                >
                  {connectingWa ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Link2 size={14} />}
                  {connectingWa ? 'Connexion...' : 'Connecter WhatsApp'}
                </button>
              )}
              {waConnected && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={handleDisconnectWa}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      padding: '9px', borderRadius: 8, border: `1px solid ${C.red}`,
                      background: '#fef2f2', color: C.red, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    <Unlink size={13} /> Déconnecter
                  </button>
                  <button
                    onClick={() => window.open('https://inbox.repondly.com', '_blank')}
                    style={{ padding: '9px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.cardBg, cursor: 'pointer' }}
                    title="Ouvrir dans Chatwoot"
                  >
                    <ExternalLink size={13} color={C.textSecondary} />
                  </button>
                </div>
              )}
            </div>
          </motion.div>

          {/* Facebook */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            style={{
              background: C.cardBg, borderRadius: 16, border: `1px solid ${fbConnected ? `${C.facebook}33` : C.border}`,
              overflow: 'hidden', boxShadow: fbConnected ? `0 4px 24px ${C.facebook}12` : '0 1px 3px rgba(0,0,0,0.08)',
            }}
          >
            {fbConnected && <div style={{ height: 3, background: C.facebook }} />}
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `${C.facebook}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.facebook }}>
                  <MessageSquare size={20} />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.textPrimary }}>Facebook Messenger</div>
                  <div style={{ fontSize: 12, color: C.textSecondary, marginTop: 2 }}>
                    {fbConnected ? 'Connecté et opérationnel' : 'Non connecté'}
                  </div>
                </div>
              </div>
              {!fbConnected && (
                <button
                  onClick={handleFbConnect} disabled={connectingFb}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '10px', borderRadius: 8, border: 'none',
                    background: connectingFb ? C.muted : C.facebook, color: '#fff',
                    fontSize: 13, fontWeight: 600, cursor: connectingFb ? 'not-allowed' : 'pointer',
                  }}
                >
                  {connectingFb ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Link2 size={14} />}
                  {connectingFb ? 'Connexion...' : 'Connecter Facebook'}
                </button>
              )}
              {fbConnected && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={handleDisconnectFb}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      padding: '9px', borderRadius: 8, border: `1px solid ${C.red}`,
                      background: '#fef2f2', color: C.red, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    <Unlink size={13} /> Déconnecter
                  </button>
                  <button
                    onClick={() => window.open('https://inbox.repondly.com', '_blank')}
                    style={{ padding: '9px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.cardBg, cursor: 'pointer' }}
                    title="Ouvrir dans Chatwoot"
                  >
                    <ExternalLink size={13} color={C.textSecondary} />
                  </button>
                </div>
              )}
            </div>
          </motion.div>

          {/* Instagram */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            style={{
              background: C.cardBg, borderRadius: 16, border: `1px solid ${igConnected ? `${C.instagram}33` : C.border}`,
              overflow: 'hidden', boxShadow: igConnected ? `0 4px 24px ${C.instagram}12` : '0 1px 3px rgba(0,0,0,0.08)',
            }}
          >
            {igConnected && <div style={{ height: 3, background: C.instagram }} />}
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `${C.instagram}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.instagram }}>
                  <Radio size={20} />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.textPrimary }}>Instagram Direct</div>
                  <div style={{ fontSize: 12, color: C.textSecondary, marginTop: 2 }}>
                    {igConnected ? 'Connecté et opérationnel' : 'Non connecté'}
                  </div>
                </div>
              </div>
              {!igConnected && (
                <button
                  onClick={handleFbConnect} disabled={connectingFb}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '10px', borderRadius: 8, border: 'none',
                    background: connectingFb ? C.muted : C.instagram, color: '#fff',
                    fontSize: 13, fontWeight: 600, cursor: connectingFb ? 'not-allowed' : 'pointer',
                  }}
                >
                  {connectingFb ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Link2 size={14} />}
                  {connectingFb ? 'Connexion...' : 'Connecter Instagram'}
                </button>
              )}
              {igConnected && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={handleDisconnectFb}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      padding: '9px', borderRadius: 8, border: `1px solid ${C.red}`,
                      background: '#fef2f2', color: C.red, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    <Unlink size={13} /> Déconnecter
                  </button>
                  <button
                    onClick={() => window.open('https://inbox.repondly.com', '_blank')}
                    style={{ padding: '9px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.cardBg, cursor: 'pointer' }}
                    title="Ouvrir dans Chatwoot"
                  >
                    <ExternalLink size={13} color={C.textSecondary} />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Info note */}
        <div style={{ background: C.cardBg, borderRadius: 12, padding: '16px', border: `1px solid ${C.border}`, fontSize: 12, color: C.textSecondary, lineHeight: 1.6 }}>
          <strong>Note :</strong> Répondly accède uniquement aux messages de vos pages et comptes connectés. Aucune publication n'est effectuée en votre nom.
        </div>
      </div>
    </>
  )
}