'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'
import {
  LayoutDashboard, Inbox, Bot, Settings, LogOut,
  AlertCircle, CheckCircle, X, TrendingUp,
  MessageSquare, Radio, Calendar, ChevronDown, ChevronRight, ChevronLeft, User,
  ArrowRight, Wifi, WifiOff, Zap, RefreshCw, Menu, Store, Package,
} from 'lucide-react'
import MessagerieView from './messagerie/MessagerieView'
import dynamic from 'next/dynamic'
import { FileText, CheckCheck, RotateCcw, Loader2, Link2, Unlink, ExternalLink, Smartphone } from 'lucide-react'

const BotConfigView = dynamic(() => import('./bot-config/page'), { ssr: false })
const BotPage = dynamic(() => import('./bot/page'), { ssr: false })
const CommercePage = dynamic(() => import('./commerce/page'), { ssr: false })
const CataloguePage = dynamic(() => import('./catalogue/page'), { ssr: false })
const BotSettingsPage = dynamic(() => import('./bot-settings/page'), { ssr: false })

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
  textSecondary:'#475569',
  textTertiary:'#64748B',
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
  // Depth layering system
  depth1: 'rgba(255, 255, 255, 0.92)',
  depth2: 'rgba(255, 255, 255, 0.85)',
  depth3: 'rgba(255, 255, 255, 0.75)',
  depth4: 'rgba(255, 255, 255, 0.65)',
  innerGlow: 'inset 0 1px 0 rgba(255, 255, 255, 0.4)',
  blueShadow: '0 8px 32px rgba(30, 27, 75, 0.15)',
  recessed: 'inset 0 2px 4px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
  // Enhanced glossy liquid glass effects
  glassSuperBlur: 'blur(48px)',
  glassUltraBlur: 'blur(64px)',
  shadowLayered: 'inset 0 1px 0 rgba(255,255,255,0.5), 0 4px 16px rgba(30,27,75,0.1), 0 16px 48px rgba(30,27,75,0.08)',
  shadowGlossy: 'inset 0 2px 4px rgba(255,255,255,0.6), 0 8px 32px rgba(30,27,75,0.12), 0 0 0 1px rgba(255,255,255,0.4)',
  glossyGradient: 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0) 100%)',
  liquidGradient: 'linear-gradient(135deg, rgba(26,86,219,0.05) 0%, rgba(124,58,237,0.05) 100%)',
  borderGlossy: '1px solid rgba(255,255,255,0.5), inset 0 0 0 1px rgba(255,255,255,0.2)',
  glowPrimary: '0 0 24px rgba(26,86,219,0.3)',
  glowSuccess: '0 0 24px rgba(14,164,114,0.3)',
  // Corner radii
  radiusSurface: 24,
  radiusCard: 16,
  radiusInput: 12,
  radiusPill: 999,
  // Gradients
  gradientPrimary: 'linear-gradient(135deg, #1A56DB 0%, #3B82F6 100%)',
  gradientPurple: 'linear-gradient(135deg, #7C3AED 0%, #1A56DB 100%)',
  gradientBlue: 'linear-gradient(135deg, #1A56DB 0%, #60A5FA 100%)',
  // Additional colors
  bg: '#F2F2F7',
  sidebar: '#FFFFFF',
  sidebarHover: 'rgba(26, 86, 219, 0.04)',
  red: '#EF4444',
  greenLight: '#F0FDF4',
  greenText: '#16A34A',
}

// ── Types ─────────────────────────────────────────────────────────────────────
type PageId = 'home' | 'inbox' | 'channels' | 'calendrier' | 'bot' | 'commerce' | 'catalogue' | 'bot-settings' | 'bot-config' | 'settings'

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
  { id: 'bot',        label: 'Mon Bot',    icon: <Bot size={16} /> },
  { id: 'commerce',   label: 'Mon Commerce', icon: <Store size={16} /> },
  { id: 'catalogue',  label: 'Catalogue', icon: <Package size={16} /> },
  { id: 'bot-settings', label: 'Paramètres Bot', icon: <Settings size={16} /> },
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
        background: C.depth2,
        backdropFilter: C.glassSuperBlur,
        borderRadius: C.radiusCard,
        boxShadow: C.shadowGlossy,
        border: C.borderGlossy,
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        cursor: 'default',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement
        el.style.transform = 'translateY(-4px)'
        el.style.boxShadow = C.shadowLayered
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement
        el.style.transform = 'translateY(0)'
        el.style.boxShadow = C.shadowGlossy
      }}
    >
      {/* Glossy gradient overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: C.glossyGradient,
        pointerEvents: 'none',
        zIndex: 0,
      }} />
      <div style={{ height: 4, background: accent, borderRadius: `${C.radiusCard}px ${C.radiusCard}px 0 0`, position: 'relative', zIndex: 1 }} />
      <div style={{ padding: '20px', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <span style={{ fontSize: 11, fontWeight: 500, color: C.textSecondary, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
          <div style={{
            color: accent,
            filter: `drop-shadow(0 0 8px ${accent}40)`,
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
              background: C.liquidGradient, border: C.borderGlossy,
              cursor: 'pointer', padding: '6px 14px', borderRadius: C.radiusPill,
              transition: 'all 0.2s ease',
              backdropFilter: C.glassSuperBlur,
              boxShadow: '0 2px 8px rgba(26, 86, 219, 0.1)',
            }}
            onMouseEnter={e => { 
              const el = e.currentTarget as HTMLElement
              el.style.background = C.gradientPrimary as string
              el.style.color = '#fff'
              el.style.boxShadow = C.glowPrimary as string
            }}
            onMouseLeave={e => { 
              const el = e.currentTarget as HTMLElement
              el.style.background = C.liquidGradient as string
              el.style.color = C.primary
              el.style.boxShadow = '0 2px 8px rgba(26, 86, 219, 0.1)'
            }}
            >
              {actionLabel}
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
        background: active ? C.depth2 : C.depth3,
        backdropFilter: C.glassSuperBlur,
        border: active ? `1px solid ${color}` : C.borderGlossy,
        boxShadow: active ? C.shadowGlossy : C.blueShadow,
        display: 'flex', flexDirection: 'column', gap: 10,
        cursor: 'pointer', transition: 'all 0.2s ease', textAlign: 'left',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement
        el.style.transform = 'translateY(-4px)'
        el.style.boxShadow = active ? C.shadowLayered : C.shadowGlossy
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement
        el.style.transform = 'translateY(0)'
        el.style.boxShadow = active ? C.shadowGlossy : C.blueShadow
      }}
    >
      {/* Glossy gradient overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: C.glossyGradient,
        pointerEvents: 'none',
        zIndex: 0,
      }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
        <div style={{
          width: 10, height: 10, borderRadius: '50%',
          background: active ? color : C.mid,
          boxShadow: active ? `0 0 12px ${color}cc` : 'none',
          transition: 'all 0.3s',
        }} />
        <span style={{
          fontSize: 10, fontWeight: 600,
          color: active ? badgeText : C.mid,
          background: active ? badgeBg : 'rgba(0,0,0,0.05)',
          padding: '3px 10px', borderRadius: C.radiusPill,
          textTransform: 'uppercase', letterSpacing: '0.08em',
          backdropFilter: active ? C.glassSuperBlur : 'none',
          border: active ? `1px solid ${color}30` : 'none',
        }}>
          {active ? 'ACTIF' : 'INACTIF'}
        </span>
      </div>
      <div style={{ position: 'relative', zIndex: 1 }}>
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
        padding: '12px 16px', borderRadius: C.radiusInput, border: C.borderGlossy,
        background: C.depth3, backdropFilter: C.glassSuperBlur,
        cursor: 'pointer', transition: 'all 0.2s ease',
        boxShadow: C.blueShadow,
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement
        el.style.background = C.depth2 as string
        el.style.boxShadow = C.shadowGlossy as string
        el.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement
        el.style.background = C.depth3 as string
        el.style.boxShadow = C.blueShadow as string
        el.style.transform = 'translateY(0)'
      }}
      >
        {/* Glossy gradient overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: C.glossyGradient,
          pointerEvents: 'none',
          zIndex: 0,
        }} />
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: `linear-gradient(135deg, ${chColor}20 0%, ${chColor}10 100%)`,
          color: chColor,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 600, flexShrink: 0,
          border: `2px solid ${chColor}30`,
          boxShadow: `0 0 12px ${chColor}20`,
          position: 'relative',
          zIndex: 1,
        }}>{initials}</div>
        <div style={{ flex: 1, minWidth: 0, textAlign: 'left', position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: C.textPrimary }}>{conv.name}</div>
          <div style={{ fontSize: 12, color: C.textSecondary, fontWeight: 400 }}>{conv.channel}</div>
        </div>
        <div style={{ fontSize: 12, color: C.textTertiary, flexShrink: 0, position: 'relative', zIndex: 1 }}>{timeStr}</div>
        {conv.unread > 0 && (
          <div style={{
            width: 20, height: 20, borderRadius: '50%',
            background: C.gradientPrimary, color: '#fff',
            fontSize: 10, fontWeight: 600, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: C.glowPrimary,
            position: 'relative',
            zIndex: 1,
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
          fontSize: 13, fontWeight: 500, color: C.primary,
          background: 'none', border: `1px solid ${C.primary}`,
          cursor: 'pointer', padding: '4px 12px', borderRadius: C.radiusPill,
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(26, 86, 219, 0.1)'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}
        >{cta}</button>
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
        background: C.depth2,
        backdropFilter: C.glassSuperBlur,
        borderRadius: C.radiusCard,
        boxShadow: C.shadowGlossy,
        border: C.borderGlossy,
        padding: '16px 24px',
        display: 'flex',
        gap: 16,
        marginBottom: 24,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Glossy gradient overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: C.glossyGradient,
        pointerEvents: 'none',
        zIndex: 0,
      }} />
      {actions.map((action) => (
        <button
          key={action.label}
          onClick={() => action.exists ? onNavigate(action.route) : null}
          disabled={!action.exists}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 24px',
            borderRadius: C.radiusPill,
            background: C.depth3,
            color: C.primary,
            border: C.borderGlossy,
            fontSize: 14,
            fontWeight: 500,
            cursor: action.exists ? 'pointer' : 'not-allowed',
            opacity: action.exists ? 1 : 0.5,
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            backdropFilter: C.glassSuperBlur,
            boxShadow: C.shadowGlossy,
            position: 'relative',
            zIndex: 1,
            overflow: 'hidden',
          }}
          onMouseEnter={e => {
            if (action.exists) {
              const el = e.currentTarget as HTMLElement
              el.style.background = C.depth2 as string
              el.style.boxShadow = C.shadowLayered as string
              el.style.transform = 'translateY(-2px)'
            }
          }}
          onMouseLeave={e => {
            if (action.exists) {
              const el = e.currentTarget as HTMLElement
              el.style.background = C.depth3 as string
              el.style.boxShadow = C.shadowGlossy as string
              el.style.transform = 'translateY(0)'
            }
          }}
        >
          {/* Glossy gradient overlay */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: C.glossyGradient,
            pointerEvents: 'none',
            zIndex: 0,
          }} />
          <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
            {action.icon}
            {action.label}
          </span>
        </button>
      ))}
    </motion.div>
  )
}

// ── Performance Card ───────────────────────────────────────────────────────────
function PerformanceCard() {
  // TODO: wire to real API
  const metrics = [
    { label: 'Taux de résolution', value: '87%', color: C.primary },
    { label: 'Temps de réponse moyen', value: '1m 24s', color: C.primary },
    { label: 'Satisfaction client', value: '4.6/5', color: C.accentPurple },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.2 }}
      style={{
        background: C.depth2,
        backdropFilter: C.glassSuperBlur,
        borderRadius: C.radiusCard,
        boxShadow: C.shadowGlossy,
        border: C.borderGlossy,
        padding: '20px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Glossy gradient overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: C.glossyGradient,
        pointerEvents: 'none',
        zIndex: 0,
      }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, position: 'relative', zIndex: 1 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: C.textPrimary }}>Performance</div>
        <div style={{ fontSize: 13, color: C.textSecondary }}>7 derniers jours</div>
      </div>
      <div style={{ display: 'flex', gap: 24, marginBottom: 20, position: 'relative', zIndex: 1 }}>
        {metrics.map((metric) => (
          <div key={metric.label} style={{ flex: 1 }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: metric.color, filter: `drop-shadow(0 0 8px ${metric.color}30)` }}>{metric.value}</div>
            <div style={{ fontSize: 12, color: C.textSecondary, marginTop: 4 }}>{metric.label}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'relative', zIndex: 1 }}>
        {metrics.map((metric, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 12, color: C.textSecondary, width: 140, flexShrink: 0 }}>{metric.label}</span>
            <div style={{ flex: 1, height: 6, background: 'rgba(0,0,0,0.05)', borderRadius: 3, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.3)' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: metric.value.includes('87') ? '87%' : metric.value.includes('4.6') ? '92%' : '75%' }}
                transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                style={{ height: '100%', background: metric.color, borderRadius: 3, boxShadow: `0 0 8px ${metric.color}40` }}
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
        background: C.depth2,
        backdropFilter: C.glassSuperBlur,
        borderRadius: C.radiusCard,
        boxShadow: C.shadowGlossy,
        border: C.borderGlossy,
        padding: '20px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Glossy gradient overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: C.glossyGradient,
        pointerEvents: 'none',
        zIndex: 0,
      }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, position: 'relative', zIndex: 1 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: C.textPrimary }}>Activité du Bot IA</div>
        <div style={{ fontSize: 13, color: C.textSecondary }}>
          {new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 32, marginBottom: 20, position: 'relative', zIndex: 1 }}>
        <div>
          <div style={{ fontSize: 32, fontWeight: 700, color: C.textPrimary, filter: 'drop-shadow(0 0 8px rgba(26, 86, 219, 0.3))' }}>156</div>
          <div style={{ fontSize: 12, color: C.textSecondary, marginTop: 2 }}>Messages IA</div>
          <div style={{ fontSize: 11, color: C.textSecondary }}>Traités automatiquement</div>
        </div>
        <div>
          <div style={{ fontSize: 32, fontWeight: 700, color: C.textPrimary, filter: 'drop-shadow(0 0 8px rgba(26, 86, 219, 0.3))' }}>23</div>
          <div style={{ fontSize: 12, color: C.textSecondary, marginTop: 2 }}>Intervention humaine</div>
          <div style={{ fontSize: 11, color: C.textSecondary }}>Transferts aujourd'hui</div>
        </div>
      </div>
      <div style={{ position: 'relative', zIndex: 1 }}>
        <svg width={width} height={height} style={{ overflow: 'visible' }}>
          <motion.polygon
            points={areaPoints}
            fill="rgba(26, 86, 219, 0.15)"
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
            style={{ filter: 'drop-shadow(0 0 6px rgba(26, 86, 219, 0.4))' }}
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
  const [profileOpen, setProfileOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [initialPageSet, setInitialPageSet] = useState(false)
  const [toast, setToast] = useState<{ type: 'error' | 'success'; msg: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
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
  const eventSourceRef = useRef<EventSource | null>(null)

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

  // ── SSE subscription for real-time notifications ─────────────────────────────────
  useEffect(() => {
    const eventSource = new EventSource('/api/sse')
    eventSourceRef.current = eventSource

    // Play notification sound using Web Audio API
    const playNotificationSound = () => {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()
        
        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)
        
        oscillator.frequency.value = 440 // A4 note
        oscillator.type = 'sine'
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)
        
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.2)
      } catch (err) {
        console.error('[Notification] Failed to play sound:', err)
      }
    }

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        
        if (data.type === 'message_created' && data.data) {
          const msgConvId = data.data.conversationId
          const isIncoming = data.data.messageType === 0
          const isNotActive = msgConvId !== activeConversation.id
          
          // Only notify for incoming messages not in active conversation
          if (isIncoming && isNotActive) {
            // Update stats.openCount in real-time
            setStats(prev => ({ ...prev, openCount: prev.openCount + 1 }))
            
            // Play sound
            playNotificationSound()
            
            // Request notification permission and show
            if ('Notification' in window && Notification.permission === 'granted') {
              const senderName = data.data.sender?.name || 'Contact'
              const preview = data.data.content || 'Nouveau message'
              new Notification(senderName, { body: preview })
            } else if ('Notification' in window && Notification.permission !== 'denied') {
              Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                  const senderName = data.data.sender?.name || 'Contact'
                  const preview = data.data.content || 'Nouveau message'
                  new Notification(senderName, { body: preview })
                }
              })
            }
            
            // Refresh recent conversations list
            fetchStatus()
          }
        }
        
        if (data.type === 'conversation_created' || data.type === 'conversation_status_changed') {
          // Refresh to update conversation list
          fetchStatus()
        }
      } catch (err) {
        console.error('[SSE] Failed to parse event:', err)
      }
    }

    eventSource.onerror = (err) => {
      console.error('[SSE] Connection error:', err)
      eventSource.close()
    }

    return () => {
      eventSource.close()
      eventSourceRef.current = null
    }
  }, [activeConversation.id, fetchStatus])

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
          background: radial-gradient(ellipse at top, #F0F7FF 0%, #F8FAFC 40%, #F1F5F9 100%);
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
              background: C.depth2, borderRadius: 12,
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

      <div style={{ display: 'flex', height: '100dvh', width: '100vw', overflow: 'hidden', background: 'transparent', position: 'relative' }}>
        {/* Safe area background for iOS PWA - blends with header */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 'env(safe-area-inset-top)',
          background: C.depth1,
          zIndex: 9999,
        }} />
        {/* Main content with solid background */}
        <div style={{
          display: 'flex',
          height: '100%',
          width: '100%',
          background: 'transparent',
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
                  background: C.depth2,
                  backdropFilter: 'blur(32px)',
                  zIndex: 1001,
                  display: 'flex', flexDirection: 'column',
                  boxShadow: C.innerGlow + ', ' + C.blueShadow,
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
            width: sidebarCollapsed ? 72 : 220,
            flexShrink: 0,
            background: '#ffffff',
            borderRight: '1px solid #e2e8f2',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '4px 0 24px rgba(0, 0, 0, 0.02)',
            transition: 'width 0.3s ease',
          } as React.CSSProperties}>
            {/* Logo */}
            <div style={{ 
              height: 72, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
              padding: sidebarCollapsed ? '0 12px' : '0 20px', 
              borderBottom: '1px solid #f0f3f8',
              flexShrink: 0,
              gap: sidebarCollapsed ? 0 : 8,
            }}>
              <Image src="/logo.png" alt="Répondly" width={sidebarCollapsed ? 32 : 38} height={sidebarCollapsed ? 32 : 38} style={{ objectFit: 'contain' }} priority />
              {!sidebarCollapsed && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: '#0d1b2e', letterSpacing: '-0.02em', fontWeight: 400 }}>
                    Répondly
                  </span>
                  <span style={{ color: '#1a6bff', fontSize: 20 }}>.</span>
                </div>
              )}
            </div>

            {/* Nav */}
            <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
              {NAV.map(item => {
                const active = activePage === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => setActivePage(item.id)}
                    title={sidebarCollapsed ? item.label : ''}
                    style={{
                      display: 'flex', alignItems: 'center', gap: sidebarCollapsed ? 0 : 12,
                      width: '100%', padding: sidebarCollapsed ? '11px' : '11px 14px', borderRadius: 10,
                      background: active ? '#1a6bff' : 'transparent',
                      color: active ? '#ffffff' : '#5a6a80',
                      fontSize: 14, fontWeight: active ? 600 : 500,
                      border: 'none', cursor: 'pointer', transition: 'all 0.2s ease', textAlign: 'left',
                      position: 'relative',
                      justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                    }}
                    onMouseEnter={e => { 
                      if (!active) { 
                        const el = e.currentTarget as HTMLElement
                        el.style.background = '#f5f7fa'
                        el.style.color = '#0d1b2e'
                      }
                    }}
                    onMouseLeave={e => { 
                      if (!active) { 
                        const el = e.currentTarget as HTMLElement
                        el.style.background = 'transparent'
                        el.style.color = '#5a6a80'
                      }
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{item.icon}</span>
                    {!sidebarCollapsed && (
                      <>
                        <span style={{ flex: 1 }}>{item.label}</span>
                        {item.id === 'inbox' && stats.openCount > 0 && (
                          <span style={{ 
                            background: 'rgba(255,255,255,0.2)', 
                            color: '#ffffff',
                            fontSize: 11, 
                            fontWeight: 700, 
                            padding: '3px 9px', 
                            borderRadius: 20,
                          }}>
                            {stats.openCount}
                          </span>
                        )}
                        {item.id === 'channels' && !anyChannel && (
                          <span style={{ 
                            width: 8, 
                            height: 8, 
                            borderRadius: '50%', 
                            background: '#ff5f57', 
                            flexShrink: 0,
                          }} />
                        )}
                      </>
                    )}
                  </button>
                )
              })}

              {/* Canaux Section - Improved */}
              {!sidebarCollapsed && (
                <div style={{ marginTop: 32, padding: '0 12px' }}>
                  <div style={{ 
                    fontSize: 11, 
                    fontWeight: 700, 
                    color: '#8899aa', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.1em', 
                    marginBottom: 12,
                    paddingLeft: 14,
                  }}>
                    Canaux
                  </div>
                  <div style={{ 
                    background: '#f5f7fa',
                    borderRadius: 12,
                    padding: '16px',
                    border: '1px solid #e8f0ff',
                  }}>
                    {[
                      { label: 'WhatsApp', active: waConnected, color: '#25d366', icon: <MessageSquare size={16} /> },
                      { label: 'Facebook', active: fbConnected, color: '#1877f2', icon: <MessageSquare size={16} /> },
                      { label: 'Instagram', active: igConnected, color: '#e1306c', icon: <MessageSquare size={16} /> },
                    ].map(ch => (
                      <button
                        key={ch.label}
                        onClick={() => setActivePage('settings')}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          width: '100%', padding: '10px 12px', borderRadius: 8,
                          background: 'transparent',
                          color: ch.active ? '#0d1b2e' : '#8899aa',
                          fontSize: 13, fontWeight: ch.active ? 600 : 500,
                          border: 'none', cursor: 'pointer', transition: 'all 0.2s ease', textAlign: 'left',
                          marginBottom: 4,
                        }}
                        onMouseEnter={e => {
                          const el = e.currentTarget as HTMLElement
                          el.style.background = '#ffffff'
                          el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'
                        }}
                        onMouseLeave={e => {
                          const el = e.currentTarget as HTMLElement
                          el.style.background = 'transparent'
                          el.style.boxShadow = 'none'
                        }}
                      >
                        <div style={{
                          width: 32, height: 32, borderRadius: 8,
                          background: `${ch.color}15`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: ch.color,
                        }}>
                          {ch.icon}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: ch.active ? '#0d1b2e' : '#5a6a80' }}>{ch.label}</div>
                          <div style={{ fontSize: 11, color: ch.active ? '#5a6a80' : '#8899aa' }}>
                            {ch.active ? 'Connecté' : 'Non connecté'}
                          </div>
                        </div>
                        <div style={{
                          width: 6, height: 6, borderRadius: '50%',
                          background: ch.active ? ch.color : '#e2e8f2',
                        }} />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </nav>

            {/* User */}
            <div style={{ 
              padding: sidebarCollapsed ? '16px 12px' : '16px 20px', 
              borderTop: '1px solid #f0f3f8',
              flexShrink: 0,
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: sidebarCollapsed ? 0 : 12,
                justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                  background: 'linear-gradient(135deg, #1a6bff 0%, #0f4fd4 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 15, fontWeight: 700, color: '#ffffff',
                  boxShadow: '0 4px 12px rgba(26, 107, 255, 0.25)',
                }}>{initial}</div>
                {!sidebarCollapsed && (
                  <>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#0d1b2e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userName}</div>
                      <div style={{ fontSize: 12, color: '#8899aa' }}>Compte actif</div>
                    </div>
                    <button 
                      onClick={() => signOut()} 
                      title="Déconnexion" 
                      style={{ 
                        background: 'none', 
                        border: 'none', 
                        cursor: 'pointer', 
                        color: '#8899aa', 
                        padding: 8, 
                        display: 'flex', 
                        borderRadius: 8, 
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={e => {
                        const el = e.currentTarget as HTMLElement
                        el.style.background = '#f5f7fa'
                        el.style.color = '#1a6bff'
                      }}
                      onMouseLeave={e => {
                        const el = e.currentTarget as HTMLElement
                        el.style.background = 'none'
                        el.style.color = '#8899aa'
                      }}
                    >
                      <LogOut size={16} />
                    </button>
                  </>
                )}
              </div>
            </div>
          </aside>
        )}

        {/* ══ Main area ════════════════════════════════════════════════════════ */}
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          minWidth: 0, 
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #f8fafc 0%, #f0f7ff 50%, #f8fafc 100%)',
        } as React.CSSProperties}>

          {/* ── Header ── */}
          <header style={{
            height: 64, flexShrink: 0,
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid #e2e8f2',
            display: 'flex', alignItems: 'center',
            padding: isMobile ? '0 16px' : '0 32px',
            gap: 16,
            position: 'relative',
          } as React.CSSProperties}>
            {isMobile ? (
              <>
                {/* Hamburger menu */}
                <button
                  onClick={() => setMobileSidebarOpen(true)}
                  style={{
                    width: 40, height: 40,
                    background: 'rgba(255, 255, 255, 0.9)',
                    border: '1px solid rgba(26, 107, 255, 0.15)',
                    cursor: 'pointer',
                    color: '#1a6bff',
                    borderRadius: 12,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.borderColor = '#1a6bff'
                    el.style.boxShadow = '0 4px 12px rgba(26, 107, 255, 0.15)'
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.borderColor = 'rgba(26, 107, 255, 0.15)'
                    el.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)'
                  }}
                >
                  <Menu size={18} strokeWidth={2.5} />
                </button>

                {/* User avatar */}
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  style={{
                    width: 38, height: 38, borderRadius: 12,
                    background: 'linear-gradient(135deg, #1a6bff 0%, #0f4fd4 100%)',
                    border: '2px solid rgba(255, 255, 255, 0.5)',
                    color: '#ffffff', fontSize: 14, fontWeight: 700,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 12px rgba(26, 107, 255, 0.25)',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.transform = 'scale(1.05)'
                    el.style.boxShadow = '0 6px 16px rgba(26, 107, 255, 0.35)'
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.transform = 'scale(1)'
                    el.style.boxShadow = '0 4px 12px rgba(26, 107, 255, 0.25)'
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
                        position: 'absolute', top: 64, right: 12,
                        background: '#ffffff', border: '1px solid #e2e8f2',
                        borderRadius: 12, padding: 6,
                        minWidth: 180, boxShadow: '0 16px 40px rgba(0,0,0,0.08)',
                        zIndex: 200,
                      }}
                    >
                      <div style={{ padding: '10px 12px 8px', borderBottom: '1px solid #f0f3f8', marginBottom: 4 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#0d1b2e' }}>{userName}</div>
                        <div style={{ fontSize: 11, color: '#8899aa', marginTop: 1 }}>{session.user?.email}</div>
                      </div>
                      <button
                        onClick={() => setProfileOpen(false)}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: 7, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, color: '#0d1b2e', transition: 'background 0.12s' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#f5f7fa'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                      >
                        <User size={14} color='#8899aa' /> Profil
                      </button>
                      <button
                        onClick={() => signOut()}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: 7, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, color: '#ef4444', transition: 'background 0.12s' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#fef2f2'}
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
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 24, fontWeight: 600, color: '#0d1b2e', letterSpacing: '-0.01em' }}>
                    {NAV.find(n => n.id === activePage)?.label ?? 'Tableau de bord'}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {anyChannel && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 10, background: '#ffffff', border: '1px solid #e2e8f2' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#1a6bff' }} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#0d1b2e' }}>{activeChannels} canaux actifs</span>
                    </div>
                  )}

                  {/* Profile avatar + dropdown */}
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={() => setProfileOpen(!profileOpen)}
                      style={{
                        width: 40, height: 40, borderRadius: 10,
                        background: 'linear-gradient(135deg, #1a6bff 0%, #0f4fd4 100%)',
                        border: 'none',
                        color: '#ffffff', fontSize: 15, fontWeight: 700,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s ease',
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
                            position: 'absolute', top: 52, right: 0,
                            background: '#ffffff', border: '1px solid #e2e8f2',
                            borderRadius: 12, padding: 6,
                            minWidth: 180, boxShadow: '0 16px 40px rgba(0,0,0,0.08)',
                            zIndex: 200,
                          }}
                        >
                          <div style={{ padding: '10px 12px 8px', borderBottom: '1px solid #f0f3f8', marginBottom: 4 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#0d1b2e' }}>{userName}</div>
                            <div style={{ fontSize: 11, color: '#8899aa', marginTop: 1 }}>{session.user?.email}</div>
                          </div>
                          <button
                            onClick={() => setProfileOpen(false)}
                            style={{ width: '100%', padding: '8px 12px', borderRadius: 7, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, color: '#0d1b2e', transition: 'background 0.12s' }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#f5f7fa'}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                          >
                            <User size={14} color='#8899aa' /> Profil
                          </button>
                          <button
                            onClick={() => signOut()}
                            style={{ width: '100%', padding: '8px 12px', borderRadius: 7, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, color: '#ef4444', transition: 'background 0.12s' }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#fef2f2'}
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
            paddingBottom: isMobile ? 88 : 0,
            background: 'linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%)',
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
                {activePage === 'bot' && (
                  <div style={{ padding: 0, height: '100%' }}>
                    <BotPage />
                  </div>
                )}
                {activePage === 'commerce' && (
                  <div style={{ padding: 0, height: '100%' }}>
                    <CommercePage />
                  </div>
                )}
                {activePage === 'catalogue' && (
                  <div style={{ padding: 0, height: '100%' }}>
                    <CataloguePage />
                  </div>
                )}
                {activePage === 'bot-settings' && (
                  <div style={{ padding: 0, height: '100%' }}>
                    <BotSettingsPage />
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
                background: C.depth2,
                backdropFilter: C.glassSuperBlur,
                border: C.borderGlossy,
                boxShadow: C.shadowGlossy,
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'left',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement
                el.style.transform = 'translateY(-2px)'
                el.style.boxShadow = C.shadowLayered
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement
                el.style.transform = 'translateY(0)'
                el.style.boxShadow = C.shadowGlossy
              }}
            >
              {/* Glossy gradient overlay */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: C.glossyGradient,
                pointerEvents: 'none',
                zIndex: 0,
              }} />
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: `${section.color}15`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: section.color,
                boxShadow: `0 0 12px ${section.color}20`,
                position: 'relative',
                zIndex: 1,
              }}>
                {section.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0, position: 'relative', zIndex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: C.textPrimary, marginBottom: 4 }}>{section.title}</div>
                <div style={{ fontSize: 13, color: C.textSecondary }}>{section.description}</div>
              </div>
              {section.connected !== undefined && (
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: section.connected ? C.success : C.mid,
                  boxShadow: section.connected ? `0 0 12px ${C.success}cc` : 'none',
                  position: 'relative',
                  zIndex: 1,
                }} />
              )}
              <ChevronRight size={18} color={C.textSecondary} style={{ position: 'relative', zIndex: 1 }} />
            </motion.button>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{ 
            marginTop: 32, 
            padding: '20px', 
            borderRadius: C.radiusCard, 
            background: C.depth2,
            backdropFilter: C.glassSuperBlur,
            border: C.borderGlossy,
            boxShadow: C.shadowGlossy,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Glossy gradient overlay */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: C.glossyGradient,
            pointerEvents: 'none',
            zIndex: 0,
          }} />
          <div style={{ fontSize: 14, fontWeight: 600, color: C.textPrimary, marginBottom: 12, position: 'relative', zIndex: 1 }}>Statut des canaux</div>
          <div style={{ display: 'flex', gap: 24, position: 'relative', zIndex: 1 }}>
            {[
              { label: 'WhatsApp', connected: waConnected, color: C.whatsapp },
              { label: 'Facebook', connected: fbConnected, color: C.facebook },
              { label: 'Instagram', connected: igConnected, color: C.instagram },
            ].map(ch => (
              <div key={ch.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: ch.connected ? ch.color : C.mid,
                  boxShadow: ch.connected ? `0 0 12px ${ch.color}cc` : 'none',
                }} />
                <span style={{ fontSize: 13, color: ch.connected ? C.textPrimary : C.textSecondary, fontWeight: ch.connected ? 500 : 400 }}>{ch.label}</span>
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

      {/* ── Onboarding CTA Banner ── */}
      {!hasConfiguredBot && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: `linear-gradient(135deg, ${C.primary} 0%, ${C.accentPurple} 100%)`,
            borderRadius: C.radiusCard,
            padding: '20px 24px',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: C.glowPrimary,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)',
            pointerEvents: 'none',
          }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#fff', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Bot size={20} />
              Configurez votre agent IA
            </div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)' }}>
              Suivez les étapes pour activer l'automatisation intelligente de vos conversations
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.location.href = '/dashboard/onboarding'}
            style={{
              position: 'relative', zIndex: 1,
              padding: '12px 24px',
              borderRadius: C.radiusPill,
              background: '#fff',
              color: C.primary,
              border: 'none',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
            }}
          >
            Commencer <ArrowRight size={16} style={{ marginLeft: 4 }} />
          </motion.button>
        </motion.div>
      )}

      {/* ── KPI row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <KpiCard
          label="Conversations ouvertes"
          value={loading ? '—' : stats.openCount}
          sub="En attente de réponse"
          icon={<MessageSquare size={18} />}
          accent={C.primary}
          loading={loading}
          actionLabel="Messagerie"
          onAction={() => onNavigate('inbox')}
          delay={0}
        />
        <KpiCard
          label="Messages traités"
          value={loading ? '—' : stats.messages}
          sub="Estimation totale"
          icon={<TrendingUp size={18} />}
          accent={C.primary}
          loading={loading}
          actionLabel="Paramètres"
          onAction={() => onNavigate('settings')}
          delay={0.05}
        />
        <KpiCard
          label="Canaux actifs"
          value={loading ? '—' : activeChannels}
          sub="Sur 3 disponibles"
          icon={<Wifi size={18} />}
          accent={C.primary}
          loading={loading}
          actionLabel="Paramètres"
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

      {/* ── Bot Activity | Mise en Service ── */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.5fr 1fr', gap: 20, marginBottom: 24 }}>
        <BotActivityWidget />
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
              onClick={() => window.location.href = '/dashboard/onboarding'}
            />
          </div>
        </div>
      </div>

      {/* ── Activité Récente ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ background: C.depth2, backdropFilter: C.glassSuperBlur, borderRadius: C.radiusCard, boxShadow: C.shadowGlossy, border: C.borderGlossy, overflow: 'hidden', position: 'relative' }}>
          {/* Glossy gradient overlay */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: C.glossyGradient,
            pointerEvents: 'none',
            zIndex: 0,
          }} />
          <div style={{ padding: '16px 20px', borderBottom: C.borderGlossy, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 500, color: C.textPrimary }}>Activité récente</div>
              <div style={{ fontSize: 12, color: C.textSecondary, marginTop: 2 }}>Dernières conversations ouvertes</div>
            </div>
            <button onClick={() => onNavigate('inbox')} style={{ fontSize: 13, fontWeight: 500, color: C.primary, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              Voir tout <ArrowRight size={12} />
            </button>
          </div>
          <div style={{ padding: '12px 20px', display: 'flex', gap: 8, overflowX: 'auto', position: 'relative', zIndex: 1 }}>
            {['all', 'unread', 'pending', 'resolved'].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilterTab(tab as any)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  background: filterTab === tab ? C.depth2 : C.depth3,
                  color: filterTab === tab ? C.primary : C.textSecondary,
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  whiteSpace: 'nowrap',
                  backdropFilter: C.glassSuperBlur,
                  boxShadow: filterTab === tab ? C.shadowGlossy : C.recessed,
                  border: filterTab === tab ? C.borderGlossy : '1px solid rgba(255, 255, 255, 0.3)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={e => {
                  if (filterTab !== tab) {
                    const el = e.currentTarget as HTMLElement
                    el.style.background = C.depth2 as string
                    el.style.boxShadow = C.shadowGlossy as string
                  }
                }}
                onMouseLeave={e => {
                  if (filterTab !== tab) {
                    const el = e.currentTarget as HTMLElement
                    el.style.background = C.depth3 as string
                    el.style.boxShadow = C.recessed as string
                  }
                }}
              >
                {/* Glossy gradient overlay for active tab */}
                {filterTab === tab && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: C.glossyGradient,
                    pointerEvents: 'none',
                    zIndex: 0,
                    borderRadius: 20,
                  }} />
                )}
                <span style={{ position: 'relative', zIndex: 1 }}>
                  {tab === 'all' ? 'Tous' : tab === 'unread' ? 'Non lus' : tab === 'pending' ? 'En attente' : 'Résolus'}
                </span>
              </button>
            ))}
          </div>
          <div style={{ padding: '0 20px 16px', position: 'relative', zIndex: 1 }}>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: i < 3 ? `1px solid ${C.border}` : 'none' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: C.depth3, flexShrink: 0 }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center' }}>
                    <div style={{ height: 14, width: '40%', background: C.depth3, borderRadius: 8 }} />
                    <div style={{ height: 12, width: '70%', background: C.depth3, borderRadius: 8 }} />
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
      </div>
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
              style={{ background: C.depth1, backdropFilter: 'blur(24px)', borderRadius: 16, padding: '24px', width: isMobile ? '90%' : 360, boxShadow: C.blueShadow, border: `1px solid ${C.border}` }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 12, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Unlink size={18} color={C.red} />
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: C.textPrimary, marginBottom: 8 }}>Déconnecter {showDisconnectModal.channel} ?</h3>
              <p style={{ fontSize: 13, color: C.textSecondary, lineHeight: 1.6, marginBottom: 20 }}>
                Cela supprimera l'inbox dans Chatwoot. Vous pourrez reconnecter à tout moment.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setShowDisconnectModal(null)} style={{ flex: 1, padding: '10px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.depth2, color: C.textPrimary, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
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
              background: ch.active ? `${ch.color}0d` : C.depth1,
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