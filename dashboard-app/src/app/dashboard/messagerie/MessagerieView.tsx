"use client"

import { useEffect, useRef, useState, useCallback } from 'react'
import { useTheme } from '@/lib/theme'
import { motion, AnimatePresence } from 'framer-motion'
import { useSession, signOut } from 'next-auth/react'
import { useMobileNav } from '@/components/AppShell'
import {
  Search, CheckCheck, RotateCcw, Send, Loader2,
  MessageSquare, WifiOff, X, FileText, ChevronRight,
  AlertCircle, Check, CheckCircle2, Clock, Smartphone, Menu, LayoutDashboard, Radio, Calendar, Bot, Settings, LogOut, User, ArrowRight, TrendingUp, Trash2, Pause, Play,
  MoreVertical, ChevronLeft, CheckSquare, BotOff,
} from 'lucide-react'

// ─── Theme-aware tokens ───────────────────────────────────────────────────────
function makeC(dark: boolean) {
  const bg       = dark ? '#0A0A0F'  : '#F8FAFC'
  const surface  = dark ? '#111118'  : '#FFFFFF'
  const surface2 = dark ? '#161622'  : '#F1F5F9'
  const surface3 = dark ? '#0F0F17'  : '#E2E8F0'
  const border   = dark ? '#1E1E2E'  : '#E2E8F0'
  const border2  = dark ? '#334155'  : '#CBD5E1'
  const text     = dark ? '#F1F5F9'  : '#0F172A'
  const text2    = dark ? '#94A3B8'  : '#475569'
  const text3    = dark ? '#64748B'  : '#94A3B8'
  return {
    pageBg: bg, cardBg: surface,
    primary: '#3B82F6', accentGreen: '#10B981', accentPurple: '#6366F1',
    textPrimary: text, textSecondary: text2, textTertiary: text3,
    muted: text3, success: '#10B981', inProgress: '#3B82F6',
    pending: '#F59E0B', error: '#EF4444',
    border, borderMid: border2,
    whatsapp: '#22C55E', whatsappBg: 'rgba(34,197,94,0.1)', whatsappText: '#22C55E',
    facebook: '#3B82F6', facebookBg: 'rgba(59,130,246,0.1)', facebookText: '#3B82F6',
    instagram: '#EC4899', instagramBg: 'rgba(236,72,153,0.1)', instagramText: '#EC4899',
    glassMedium: surface2, glassLight: surface, glassDark: border,
    glassShadow: dark ? '0 4px 24px rgba(0,0,0,0.4)' : '0 4px 24px rgba(0,0,0,0.08)',
    glassBorder: `1px solid ${border}`,
    depth1: surface2, depth2: surface, depth3: surface3, depth4: bg,
    innerGlow: 'none', blueShadow: dark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 16px rgba(0,0,0,0.06)',
    recessed: 'none', glassSuperBlur: 'none', glassUltraBlur: 'none',
    shadowLayered: dark ? '0 1px 3px rgba(0,0,0,0.4)' : '0 1px 3px rgba(0,0,0,0.08)',
    shadowGlossy: dark ? '0 1px 3px rgba(0,0,0,0.4)' : '0 1px 3px rgba(0,0,0,0.08)',
    glossyGradient: 'none', liquidGradient: 'none',
    borderGlossy: `1px solid ${border}`,
    glowPrimary: 'none', glowSuccess: 'none',
    radiusCard: 12, radiusInput: 8, radiusPill: 999, radiusBubble: 16,
    gradientPrimary: '#3B82F6', gradientPurple: '#6366F1', gradientBlue: '#3B82F6',
    bubbleOut: '#3B82F6',
    bubbleIn: dark ? '#1E1E2E' : '#F1F5F9',
    listHover: dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
    listActive: 'rgba(59,130,246,0.1)',
  }
}

function useC() {
  const dark = useTheme()
  return makeC(dark)
}

// ─── Types ─────────────────────────────────────────────────────────────────────
interface Contact {
  id: number
  name: string
  phone_number: string | null
  email: string | null
  avatar_url: string | null
}

interface Conversation {
  id: number
  status: 'open' | 'resolved' | 'pending' | 'snoozed'
  unread_count: number
  timestamp: number
  last_activity_at: number
  inbox_id: number
  inbox: { id: number; name: string; channel_type: string }
  meta: { sender: Contact; channel: string }
  last_non_activity_message?: {
    content: string
    created_at: number
    message_type: number
  }
  botEnabled?: boolean
}

interface Message {
  id: number
  content: string
  content_type: string
  created_at: number
  message_type: number // 0=incoming, 1=outgoing, 2=activity
  sender?: { id: number; name: string; type: string; avatar_url?: string }
  attachments?: Array<{ id: number; file_type: string; data_url: string; thumb_url: string }>
  status?: string
  error_message?: string
}

interface Note {
  id: number
  content: string
  created_at: number
  user: { id: number; name: string; avatar_url?: string }
}

type RepondlyStatus = 'EN_ATTENTE' | 'RESOLUE'

// ─── Helpers ───────────────────────────────────────────────────────────────────
function formatTime(ts: number): string {
  const d = new Date(ts * 1000)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diffDays === 0) return d.toLocaleTimeString('fr-TN', { hour: '2-digit', minute: '2-digit' })
  if (diffDays === 1) return 'Hier'
  if (diffDays < 7)  return d.toLocaleDateString('fr-TN', { weekday: 'short' })
  return d.toLocaleDateString('fr-TN', { day: '2-digit', month: '2-digit' })
}

function formatDateLabel(ts: number): string {
  const d = new Date(ts * 1000)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diffDays === 0) return "Aujourd'hui"
  if (diffDays === 1) return 'Hier'
  return d.toLocaleDateString('fr-TN', { day: 'numeric', month: 'long' })
}

function channelColor(channelType: string): string {
  if (channelType === 'Channel::Whatsapp') return '#22C55E'
  if (channelType === 'Channel::FacebookPage' || channelType === 'Channel::Instagram') return '#EC4899'
  return '#3B82F6'
}

function channelBg(channelType: string): string {
  if (channelType === 'Channel::Whatsapp') return 'rgba(34,197,94,0.1)'
  if (channelType === 'Channel::FacebookPage' || channelType === 'Channel::Instagram') return 'rgba(236,72,153,0.1)'
  return 'rgba(59,130,246,0.1)'
}

function channelText(channelType: string): string {
  if (channelType === 'Channel::Whatsapp') return '#22C55E'
  if (channelType === 'Channel::FacebookPage' || channelType === 'Channel::Instagram') return '#EC4899'
  return '#3B82F6'
}

function initials(name: string): string {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

// ─── Brand Channel Icons ───────────────────────────────────────────────────────
function ChannelIcon({ channelType, size = 20 }: { channelType: string; size?: number }) {
  const C = useC()
  const color = channelColor(channelType)

  if (channelType === 'Channel::Whatsapp') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={{ color }}>
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    )
  }

  if (channelType === 'Channel::FacebookPage' || channelType === 'Channel::Instagram') {
    // Circle half-facebook (blue) half-instagram (pink gradient)
    return (
      <svg width={size} height={size} viewBox="0 0 24 24">
        <defs>
          <linearGradient id="instagramGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EC4899" />
            <stop offset="100%" stopColor="#DB2777" />
          </linearGradient>
        </defs>
        <circle cx="12" cy="12" r="12" fill="#3B82F6" />
        <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm0 1a11 11 0 0 1 11 11 11 11 0 0 1-11 11A11 11 0 0 1 1 12 11 11 0 0 1 12 1z" fill="url(#instagramGradient)" />
        <path d="M12 0a12 12 0 0 1 12 12 12 12 0 0 1-12 12V0z" fill="url(#instagramGradient)" />
        {/* Facebook f on left half */}
        <text x="6" y="16" fontSize="10" fontWeight="bold" fill="white" textAnchor="middle">f</text>
        {/* Instagram camera icon on right half */}
        <rect x="15" y="9" width="5" height="5" rx="1" fill="none" stroke="white" strokeWidth="1" />
        <circle cx="17.5" cy="11.5" r="1.5" fill="none" stroke="white" strokeWidth="1" />
      </svg>
    )
  }

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={{ color: C.primary }}>
      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
    </svg>
  )
}

// ─── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ contact, size = 40, showChannelBadge = false, channelType }: { contact: Contact; size?: number; showChannelBadge?: boolean; channelType?: string }) {
  const C = useC()
  const [imgError, setImgError] = useState(false)
  const badgeSize = Math.round(size * 0.35)
  const color = channelType ? channelColor(channelType) : C.primary

  return (
    <div style={{ position: 'relative', flexShrink: 0, width: size, height: size }}>
      {contact.avatar_url && !imgError ? (
        <img
          src={contact.avatar_url}
          alt={contact.name}
          onError={() => setImgError(true)}
          style={{ 
            width: size, 
            height: size, 
            borderRadius: '50%', 
            objectFit: 'cover', 
            border: `2px solid ${color}40`,
            boxShadow: `0 0 12px ${color}20`,
          }}
        />
      ) : (
        <div style={{
          width: size, height: size, borderRadius: '50%',
          background: `linear-gradient(135deg, ${color}20 0%, ${color}10 100%)`,
          color: color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: size * 0.38, fontWeight: 600,
          border: `2px solid ${color}30`,
          boxShadow: `0 0 12px ${color}20`,
        }}>
          {initials(contact.name)}
        </div>
      )}
      {showChannelBadge && channelType && (
        <div style={{ 
          position: 'absolute', 
          bottom: -2, 
          right: -2, 
          background: C.depth2, 
          borderRadius: '50%', 
          padding: 2, 
          backdropFilter: C.glassSuperBlur, 
          boxShadow: C.shadowGlossy, 
          border: C.borderGlossy,
        }}>
          <ChannelIcon channelType={channelType} size={badgeSize} />
        </div>
      )}
    </div>
  )
}

// ─── Empty State ───────────────────────────────────────────────────────────────
function EmptyState({ text, icon }: { text: string; icon?: React.ReactNode }) {
  const C = useC()
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 16,
      color: C.textSecondary, padding: 40,
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: 20,
        background: C.gradientPrimary, display: 'flex',
        alignItems: 'center', justifyContent: 'center', color: '#fff',
        boxShadow: C.glassShadow,
      }}>
        {icon || <MessageSquare size={28} />}
      </div>
      <p style={{ margin: 0, fontSize: 14, color: C.textSecondary, textAlign: 'center', maxWidth: 280, lineHeight: 1.6, fontWeight: 500 }}>
        {text}
      </p>
    </div>
  )
}

// ─── Conversation List Item ─────────────────────────────────────────────────────
function ConvItem({
  conv, active, onClick, repondlyStatus, onResolve, onToggleBot,
}: { 
  conv: Conversation; 
  active: boolean; 
  onClick: () => void; 
  repondlyStatus?: RepondlyStatus; 
  onResolve?: (convId: number) => void;
  onToggleBot?: (convId: number, botEnabled: boolean) => void;
}) {
  const C = useC()
  const contact = conv.meta.sender
  const preview = conv.last_non_activity_message?.content || ''
  const ts      = conv.last_non_activity_message?.created_at || conv.last_activity_at
  const isOut   = conv.last_non_activity_message?.message_type === 1
  const color   = channelColor(conv.inbox?.channel_type)
  const [toggling, setToggling] = useState(false)

  const handleToggleBot = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (toggling || !onToggleBot) return
    setToggling(true)
    try {
      await onToggleBot(conv.id, !conv.botEnabled)
    } finally {
      setToggling(false)
    }
  }

  return (
    <motion.div
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      whileHover={{ scale: active ? 1 : 1.01 }}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 16px', cursor: 'pointer',
        background: active ? C.depth2 : C.depth3,
        backdropFilter: C.glassSuperBlur,
        borderLeft: conv.unread_count > 0 ? `3px solid #3B82F6` : (active ? `3px solid ${C.primary}` : '3px solid transparent'),
        borderTop: '1px solid rgba(255, 255, 255, 0.5)',
        boxShadow: active ? C.shadowGlossy : C.blueShadow,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        borderBottom: `1px solid ${C.border}`,
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={e => { 
        if (!active) {
          const el = e.currentTarget as HTMLElement
          el.style.background = C.depth2 as string
          el.style.boxShadow = C.shadowGlossy as string
        }
      }}
      onMouseLeave={e => { 
        if (!active) {
          const el = e.currentTarget as HTMLElement
          el.style.background = C.depth3 as string
          el.style.boxShadow = C.blueShadow as string
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
      <Avatar contact={contact} size={44} showChannelBadge={true} channelType={conv.inbox?.channel_type} />
      <div style={{ flex: 1, minWidth: 0, position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <span style={{
            fontSize: 14, fontWeight: conv.unread_count > 0 ? 600 : 500,
            color: C.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {contact.name}
          </span>
          <span style={{ fontSize: 11, color: C.textTertiary, flexShrink: 0, marginLeft: 8 }}>
            {formatTime(ts)}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span style={{
            fontSize: 13, color: conv.unread_count > 0 ? C.textPrimary : C.textSecondary,
            fontWeight: conv.unread_count > 0 ? 500 : 400,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
          }}>
            {isOut && <span style={{ color: C.primary, marginRight: 4 }}>↗</span>}
            {preview || <em style={{ color: C.textTertiary }}>Pas de message</em>}
          </span>
          {conv.unread_count > 0 && (
            <span style={{
              background: C.gradientPrimary, color: '#fff',
              fontSize: 11, fontWeight: 600, padding: '2px 8px',
              borderRadius: C.radiusPill, flexShrink: 0,
              boxShadow: C.glowPrimary,
            }}>
              {conv.unread_count}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
          {repondlyStatus && (
            <span style={{
              fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em',
              color: repondlyStatus === 'RESOLUE' ? C.success : C.primary,
              background: C.depth3,
              backdropFilter: C.glassSuperBlur,
              padding: '3px 10px', borderRadius: C.radiusPill,
              boxShadow: C.shadowGlossy,
              border: repondlyStatus === 'RESOLUE'
                ? '1px solid rgba(14, 164, 114, 0.3)'
                : '1px solid rgba(26, 86, 219, 0.3)',
            }}>
              {repondlyStatus === 'RESOLUE' ? 'Résolue' : 'En attente'}
            </span>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {onToggleBot && (
              <button
                onClick={handleToggleBot}
                disabled={toggling}
                style={{
                  fontSize: 10, fontWeight: 600,
                  color: conv.botEnabled ? C.success : C.textSecondary,
                  background: conv.botEnabled 
                    ? 'rgba(14, 164, 114, 0.1)' 
                    : C.depth3,
                  backdropFilter: C.glassSuperBlur,
                  border: conv.botEnabled
                    ? '1px solid rgba(14, 164, 114, 0.3)'
                    : '1px solid rgba(255, 255, 255, 0.3)',
                  padding: '3px 8px', borderRadius: C.radiusPill,
                  cursor: toggling ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: conv.botEnabled ? C.glowSuccess : C.shadowGlossy,
                  display: 'flex', alignItems: 'center', gap: 4,
                }}
                onMouseEnter={e => {
                  if (!toggling) {
                    const el = e.currentTarget as HTMLElement
                    el.style.background = conv.botEnabled ? 'rgba(14, 164, 114, 0.2)' : C.depth2 as string
                    el.style.boxShadow = C.shadowLayered as string
                  }
                }}
                onMouseLeave={e => {
                  if (!toggling) {
                    const el = e.currentTarget as HTMLElement
                    el.style.background = conv.botEnabled ? 'rgba(14, 164, 114, 0.1)' : C.depth3 as string
                    el.style.boxShadow = conv.botEnabled ? C.glowSuccess : C.shadowGlossy as string
                  }
                }}
              >
                {conv.botEnabled ? (
                  <>
                    <motion.div
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                      style={{
                        width: 14, height: 14, borderRadius: '50%',
                        background: C.success,
                        boxShadow: '0 0 8px rgba(14, 164, 114, 0.6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <Bot size={10} color="#fff" strokeWidth={3} />
                    </motion.div>
                    Actif
                  </>
                ) : (
                  <>
                    <div style={{
                      width: 14, height: 14, borderRadius: '50%',
                      background: C.textSecondary,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Bot size={10} color="#fff" strokeWidth={3} />
                    </div>
                    Pause
                  </>
                )}
              </button>
            )}
            {onResolve && repondlyStatus === 'EN_ATTENTE' && (
              <button
                onClick={(e) => { e.stopPropagation(); onResolve(conv.id) }}
                style={{
                  fontSize: 11, fontWeight: 600, color: C.success,
                  background: C.depth3,
                  backdropFilter: C.glassSuperBlur,
                  border: '1px solid rgba(14, 164, 114, 0.3)',
                  padding: '3px 8px', borderRadius: C.radiusInput,
                  cursor: 'pointer', transition: 'all 0.2s ease',
                  boxShadow: C.shadowGlossy,
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.background = C.depth2 as string
                  el.style.boxShadow = C.shadowLayered as string
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.background = C.depth3 as string
                  el.style.boxShadow = C.shadowGlossy as string
                }}
              >
                Résoudre
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Message Bubble ─────────────────────────────────────────────────────────────
function Bubble({ msg, conversationId, onStatusCheck, channelType }: { msg: Message; conversationId?: number; onStatusCheck?: (msgId: number) => void; channelType?: string }) {
  const C = useC()
  const isOut      = msg.message_type === 1
  const isActivity = msg.message_type === 2
  const [localStatus, setLocalStatus] = useState(msg.status)

  useEffect(() => {
    if (isOut && conversationId && onStatusCheck) {
      const checkStatus = async () => {
        try {
          const res = await fetch(`/api/chatwoot/messages/${conversationId}/status-check`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messageId: msg.id }),
          })
          const data = await res.json()
          if (data.status) setLocalStatus(data.status)
        } catch {}
      }
      checkStatus()
      const interval = setInterval(checkStatus, 10_000)
      return () => clearInterval(interval)
    }
  }, [isOut, conversationId, msg.id, onStatusCheck])

  if (isActivity) {
    return (
      <div style={{ textAlign: 'center', margin: '8px 0' }}>
        <span style={{
          fontSize: 11, color: C.textSecondary,
          background: C.depth3,
          backdropFilter: C.glassSuperBlur,
          padding: '4px 12px', borderRadius: C.radiusPill,
          border: C.borderGlossy,
          boxShadow: C.shadowGlossy,
        }}>
          {msg.content}
        </span>
      </div>
    )
  }

  const hasError = msg.error_message || localStatus === 'failed'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      style={{
        display: 'flex',
        flexDirection: isOut ? 'row-reverse' : 'row',
        alignItems: 'flex-end', gap: 8, marginBottom: 12,
      }}
    >
      <div style={{
        maxWidth: '70%',
        background: isOut ? C.gradientPrimary : C.depth3,
        backdropFilter: C.glassSuperBlur,
        color: isOut ? '#fff' : C.textPrimary,
        borderRadius: isOut ? `${C.radiusBubble}px ${C.radiusBubble}px 4px ${C.radiusBubble}px` : `${C.radiusBubble}px ${C.radiusBubble}px ${C.radiusBubble}px 4px`,
        padding: '12px 16px',
        fontSize: 14, lineHeight: 1.5,
        boxShadow: isOut ? C.glowPrimary : C.shadowGlossy,
        border: isOut ? 'none' : C.borderGlossy,
        wordBreak: 'break-word',
        position: 'relative',
        ...(isOut ? {} : { boxShadow: C.shadowGlossy }),
      }}>
        {/* Glossy gradient overlay for incoming messages */}
        {!isOut && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: C.glossyGradient,
            pointerEvents: 'none',
            zIndex: 0,
            borderRadius: isOut ? `${C.radiusBubble}px ${C.radiusBubble}px 4px ${C.radiusBubble}px` : `${C.radiusBubble}px ${C.radiusBubble}px ${C.radiusBubble}px 4px`,
          }} />
        )}
        {hasError && (
          <div style={{
            position: 'absolute', top: -8, right: -8,
            background: C.error, color: '#fff',
            borderRadius: '50%', width: 20, height: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)',
            cursor: 'pointer',
            zIndex: 10,
          }} title={msg.error_message || 'Échec de l\'envoi'}>
            <AlertCircle size={12} />
          </div>
        )}
        <div style={{ position: 'relative', zIndex: 1 }}>
          {msg.attachments?.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {msg.attachments.map(a => (
                a.file_type === 'image' ? (
                  <img key={a.id} src={a.thumb_url || a.data_url} alt="attachment"
                    style={{ maxWidth: 200, borderRadius: C.radiusInput, display: 'block', boxShadow: C.blueShadow }} />
                ) : (
                  <a key={a.id} href={a.data_url} target="_blank" rel="noreferrer"
                    style={{ color: isOut ? 'rgba(255,255,255,0.9)' : C.primary, fontSize: 13, textDecoration: 'underline' }}>
                    📎 Pièce jointe
                  </a>
                )
              ))}
              {msg.content && <span>{msg.content}</span>}
            </div>
          ) : msg.content}
        </div>
        <div style={{
          fontSize: 11,
          color: isOut ? 'rgba(255,255,255,0.6)' : C.textTertiary,
          textAlign: 'right', marginTop: 4,
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4,
          position: 'relative',
          zIndex: 1,
        }}>
          {formatTime(msg.created_at)}
          {isOut && !hasError && (
            <MessageStatusIndicator status={localStatus} />
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ─── Message Status Indicator ─────────────────────────────────────────────────────
function MessageStatusIndicator({ status }: { status?: string }) {
  if (status === 'sent') {
    return <Check size={12} color="rgba(255,255,255,0.6)" />
  }
  if (status === 'delivered') {
    return <CheckCheck size={12} color="rgba(255,255,255,0.6)" />
  }
  if (status === 'read') {
    return <CheckCircle2 size={12} color="#60A5FA" />
  }
  return <Clock size={12} color="rgba(255,255,255,0.4)" />
}

// ─── Date Separator ────────────────────────────────────────────────────────────
function DateSep({ label }: { label: string }) {
  const C = useC()
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0 12px' }}>
      <div style={{ flex: 1, height: 1, background: C.border }} />
      <span style={{ fontSize: 12, color: C.textSecondary, fontWeight: 500, whiteSpace: 'nowrap' }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: C.border }} />
    </div>
  )
}

// ─── Status Tab ────────────────────────────────────────────────────────────────
function Tab({ label, active, onClick, count }: { label: string; active: boolean; onClick: () => void; count?: number }) {
  const C = useC()
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, padding: '10px 12px', cursor: 'pointer',
        background: active ? C.depth2 : C.depth3,
        backdropFilter: C.glassSuperBlur,
        color: active ? C.primary : C.textSecondary,
        fontSize: 13, fontWeight: active ? 600 : 500,
        borderRadius: 20,
        boxShadow: active ? C.shadowGlossy : C.recessed,
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        border: active ? C.borderGlossy : '1px solid rgba(255, 255, 255, 0.3)',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={e => {
        if (!active) {
          const el = e.currentTarget as HTMLElement
          el.style.background = C.depth2 as string
          el.style.boxShadow = C.shadowGlossy as string
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          const el = e.currentTarget as HTMLElement
          el.style.background = C.depth3 as string
          el.style.boxShadow = C.recessed as string
        }
      }}
    >
      {/* Glossy gradient overlay */}
      {active && (
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
      <span style={{ position: 'relative', zIndex: 1 }}>{label}</span>
      {count !== undefined && count > 0 && (
        <span style={{
          background: active ? C.gradientPrimary : 'rgba(0,0,0,0.08)',
          color: active ? '#fff' : C.textSecondary,
          fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 999,
          boxShadow: active ? C.glowPrimary : 'none',
          position: 'relative',
          zIndex: 1,
        }}>
          {count}
        </span>
      )}
    </button>
  )
}

// ─── Notes Panel ─────────────────────────────────────────────────────────────────
function NotesPanel({ conversationId, isOpen, onClose }: { conversationId: number; isOpen: boolean; onClose: () => void }) {
  const C = useC()
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(false)
  const [newNote, setNewNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen && conversationId) {
      setLoading(true)
      fetch(`/api/chatwoot/notes/${conversationId}`)
        .then(res => res.json())
        .then(data => setNotes(data.payload || []))
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [isOpen, conversationId])

  const handleSubmit = async () => {
    if (!newNote.trim() || submitting) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/chatwoot/notes/${conversationId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newNote.trim() }),
      })
      const data = await res.json()
      setNotes(prev => [data, ...prev])
      setNewNote('')
    } catch {}
    finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ x: 320 }}
      animate={{ x: 0 }}
      exit={{ x: 320 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      style={{
        position: 'fixed', right: 0, top: 0, bottom: 0,
        width: 320, background: C.depth1,
        backdropFilter: C.glassSuperBlur,
        borderLeft: C.borderGlossy,
        boxShadow: C.shadowGlossy,
        display: 'flex', flexDirection: 'column',
        zIndex: 1000,
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
      <div style={{ padding: '20px', borderBottom: C.borderGlossy, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.textPrimary, display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileText size={18} color={C.primary} /> Notes
        </h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textSecondary, padding: 4, borderRadius: 8, transition: 'all 0.2s' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.liquidGradient}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}
        >
          <X size={20} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', position: 'relative', zIndex: 1 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <Loader2 size={24} color={C.primary} style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        ) : notes.length === 0 ? (
          <EmptyState text="Aucune note pour cette conversation" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {notes.map(note => (
              <div key={note.id} style={{
                background: C.depth3,
                backdropFilter: C.glassSuperBlur,
                borderRadius: 12, padding: 12,
                border: C.borderGlossy,
                boxShadow: C.shadowGlossy,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%',
                    background: C.gradientPrimary,
                    color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700,
                    boxShadow: C.glowPrimary,
                  }}>
                    {note.user.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: C.textPrimary }}>{note.user.name}</span>
                  <span style={{ fontSize: 11, color: C.textSecondary, marginLeft: 'auto' }}>
                    {formatTime(note.created_at)}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: C.textPrimary, lineHeight: 1.5 }}>
                  {note.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: '16px 20px', borderTop: C.borderGlossy, background: C.depth1, backdropFilter: C.glassSuperBlur, position: 'relative', zIndex: 1 }}>
        <textarea
          value={newNote}
          onChange={e => setNewNote(e.target.value)}
          placeholder="Ajouter une note..."
          rows={3}
          style={{
            width: '100%', resize: 'none', border: C.borderGlossy,
            borderRadius: 8, padding: '10px',
            fontSize: 13, color: C.textPrimary,
            background: C.depth3,
            backdropFilter: C.glassSuperBlur,
            outline: 'none',
            fontFamily: 'inherit', lineHeight: 1.5,
            marginBottom: 10,
            boxShadow: C.blueShadow,
          }}
        />
        <button
          onClick={handleSubmit}
          disabled={!newNote.trim() || submitting}
          style={{
            width: '100%', padding: '10px', borderRadius: 8, border: 'none',
            background: newNote.trim() ? C.gradientPrimary : C.depth3,
            color: newNote.trim() ? '#fff' : C.textSecondary,
            fontSize: 13, fontWeight: 600, cursor: newNote.trim() ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            backdropFilter: C.glassSuperBlur,
            boxShadow: newNote.trim() ? C.glowPrimary : 'none',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => {
            if (newNote.trim()) {
              (e.currentTarget as HTMLElement).style.boxShadow = C.shadowLayered
            }
          }}
          onMouseLeave={e => {
            if (newNote.trim()) {
              (e.currentTarget as HTMLElement).style.boxShadow = C.glowPrimary
            }
          }}
        >
          {submitting ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : 'Ajouter'}
        </button>
      </div>
    </motion.div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────────
interface MessagerieProps {
  onConversationChange?: (convId: number | null, status: RepondlyStatus) => void
  externalNotesOpen?: boolean
  onNotesOpenChange?: (open: boolean) => void
}

export default function Messagerie({ onConversationChange, externalNotesOpen, onNotesOpenChange }: MessagerieProps) {
  const C = useC()
  const { setHideNav } = useMobileNav()
  const [tabStatus, setTabStatus]       = useState<RepondlyStatus>('EN_ATTENTE')
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [convLoading, setConvLoading]   = useState(true)
  const [convError, setConvError]       = useState<string | null>(null)

  const [activeConvId, setActiveConvIdState] = useState<number | null>(null)
  const [messages, setMessages]         = useState<Message[]>([])
  const [msgLoading, setMsgLoading]     = useState(false)

  const [search, setSearch]             = useState('')
  const [reply, setReply]               = useState('')
  const [sending, setSending]           = useState(false)
  const [statusLoading, setStatusLoading] = useState(false)

  const [notesOpen, setNotesOpen]       = useState(false)
  const effectiveNotesOpen = externalNotesOpen !== undefined ? externalNotesOpen : notesOpen
  const [repondlyStatuses, setRepondlyStatuses] = useState<Map<number, RepondlyStatus>>(new Map())

  const [enAttenteCount, setEnAttenteCount] = useState(0)
  const [resolueCount, setResolueCount] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [actionSheetOpen, setActionSheetOpen] = useState(false)
  const [channelFilter, setChannelFilter] = useState<'all' | 'whatsapp' | 'facebook'>('all')
  const [channelCounts, setChannelCounts] = useState({ whatsapp: 0, facebook_instagram: 0 })

  const messagesEndRef  = useRef<HTMLDivElement>(null)
  const textareaRef     = useRef<HTMLTextAreaElement>(null)
  const convPollRef     = useRef<ReturnType<typeof setInterval> | null>(null)
  const msgPollRef      = useRef<ReturnType<typeof setInterval> | null>(null)
  const eventSourceRef  = useRef<EventSource | null>(null)

  const activeConv = conversations.find(c => c.id === activeConvId) || null

  // Hide/show navbar based on conversation state
  useEffect(() => {
    setHideNav(!!activeConvId && isMobile)
  }, [activeConvId, isMobile, setHideNav])

  // ── Fetch conversations ──────────────────────────────────────────────────────
  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/chatwoot/conversations?status=open')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur réseau')
      const list: Conversation[] = data.data?.payload || []
      
      // Fetch inboxes to get channel types
      const inboxesRes = await fetch('/api/chatwoot/inboxes')
      const inboxesData = await inboxesRes.json()
      const inboxesMap = new Map<number, string>(inboxesData.payload?.map((i: any) => [i.id, i.channel_type]) || [])
      
      // Attach channel type to conversations
      const conversationsWithChannel = list.map(c => ({
        ...c,
        inbox: {
          ...c.inbox,
          channel_type: inboxesMap.get(c.inbox_id) || c.inbox?.channel_type || ''
        }
      }))
      
      // Calculate channel counts
      const whatsappCount = conversationsWithChannel.filter(c => c.inbox?.channel_type === 'Channel::Whatsapp').length
      const fbInstaCount = conversationsWithChannel.filter(c => c.inbox?.channel_type === 'Channel::FacebookPage' || c.inbox?.channel_type === 'Channel::Instagram').length
      setChannelCounts({ whatsapp: whatsappCount, facebook_instagram: fbInstaCount })
      
      // Fetch conversation views to calculate actual unread counts
      const viewsRes = await fetch('/api/chatwoot/conversation-view')
      const viewsData = await viewsRes.json()
      const viewsMap = new Map<number, Date>()
      viewsData?.forEach((v: any) => {
        viewsMap.set(v.conversationId, new Date(v.lastViewedAt))
      })

      // Calculate actual unread counts based on last viewed timestamp
      const conversationsWithUnread = await Promise.all(
        conversationsWithChannel.map(async (conv) => {
          const lastViewedAt = viewsMap.get(conv.id)
          if (!lastViewedAt) {
            // Never viewed, use Chatwoot's unread_count
            return conv
          }

          // Only fetch if there are potential unread messages (Chatwoot shows > 0)
          if (conv.unread_count === 0) {
            return conv
          }

          // Fetch only recent messages to count unread incoming messages
          try {
            const msgsRes = await fetch(`/api/chatwoot/messages/${conv.id}`)
            const msgsData = await msgsRes.json()
            const messages: Message[] = msgsData.payload || []
            
            // Only check last 20 messages for efficiency
            const recentMessages = messages.slice(-20)
            
            const unreadCount = recentMessages.filter(m => 
              m.message_type === 0 && new Date(m.created_at * 1000) > lastViewedAt
            ).length
            
            return { ...conv, unread_count: unreadCount }
          } catch {
            return conv
          }
        })
      )
      // Fetch bot enabled status for all conversations
      const conversationsWithBotStatus = await Promise.all(
        conversationsWithUnread.map(async (conv) => {
          try {
            const res = await fetch(`/api/conversation-bot?conversationId=${conv.id}`)
            const data = await res.json()
            return { ...conv, botEnabled: data.success ? data.data.botEnabled : true }
          } catch {
            return { ...conv, botEnabled: true }
          }
        })
      )

      console.log('[Messagerie] Conversations fetched:', conversationsWithBotStatus.map((c: Conversation) => ({ id: c.id, channelType: c.inbox?.channel_type, sender: c.meta.sender.name, unread: c.unread_count, botEnabled: c.botEnabled })))
      setConversations(conversationsWithBotStatus)
      setConvError(null)

      // Fetch Repondly statuses for all conversations
      const statusPromises = list.map(conv =>
        fetch(`/api/chatwoot/conversation-status?conversationId=${conv.id}`)
          .then(r => r.json())
          .catch(() => null)
      )
      const statuses = await Promise.all(statusPromises)
      const statusMap = new Map<number, RepondlyStatus>()
      let enAttente = 0
      let resolue = 0

      if (Array.isArray(statuses)) {
        statuses.forEach((status, idx) => {
          if (status) {
            statusMap.set(list[idx].id, status.status)
            if (status.status === 'EN_ATTENTE') enAttente++
            if (status.status === 'RESOLUE') resolue++
          } else {
            statusMap.set(list[idx].id, 'EN_ATTENTE')
            enAttente++
          }
        })
      }

      setRepondlyStatuses(statusMap)
      
      // Calculate total unread messages for EN_ATTENTE conversations
      const totalUnreadMessages = conversationsWithUnread.reduce((sum, conv) => {
        const status = statusMap.get(conv.id)
        return status === 'EN_ATTENTE' ? sum + (conv.unread_count || 0) : sum
      }, 0)
      
      setEnAttenteCount(totalUnreadMessages)
      setResolueCount(resolue)
    } catch (err: any) {
      setConvError(err.message)
    } finally {
      setConvLoading(false)
    }
  }, [])

  // ── Set active conversation with mark-as-read logic ───────────────────────────
  const setActiveConvId = useCallback(async (id: number | null) => {
    setActiveConvIdState(id)
    // Mark conversation as viewed when opened
    if (id) {
      const conv = conversations.find(c => c.id === id)
      if (conv && conv.unread_count > 0) {
        // Update the conversation's unread count locally
        setConversations(prev => prev.map(c => 
          c.id === id ? { ...c, unread_count: 0 } : c
        ))
      }
      // Call API to update last viewed timestamp
      try {
        await fetch('/api/chatwoot/conversation-view', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversationId: id }),
        })
      } catch (err) {
        console.error('[Messagerie] Failed to update conversation view:', err)
      }
    }
  }, [conversations])

  // ── Fetch messages ───────────────────────────────────────────────────────────
  const fetchMessages = useCallback(async (convId: number) => {
    try {
      const res  = await fetch(`/api/chatwoot/messages/${convId}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMessages(data.payload || [])
    } catch {
      // silent on poll failure
    }
  }, [])

  // ── Mobile detection ───────────────────────────────────────────────────────────
  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 1024 || ('ontouchstart' in window)
      setIsMobile(mobile)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // ── SSE subscription for real-time updates ───────────────────────────────────────
  useEffect(() => {
    const eventSource = new EventSource('/api/sse')
    eventSourceRef.current = eventSource

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        
        if (data.type === 'message_created' && data.data?.conversationId) {
          const msgConvId = data.data.conversationId
          
          // If it's the active conversation, append the message
          if (msgConvId === activeConvId) {
            const newMessage: Message = {
              id: data.data.messageId,
              content: data.data.content,
              content_type: 'text',
              created_at: data.data.timestamp || Math.floor(Date.now() / 1000),
              message_type: data.data.messageType === 0 ? 0 : data.data.messageType === 1 ? 1 : 2,
              sender: data.data.sender,
            }
            setMessages(prev => [...prev, newMessage])
            
            // Mark as read if it's the active conversation
            if (newMessage.message_type === 0) {
              fetch('/api/chatwoot/conversation-view', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ conversationId: msgConvId }),
              }).catch(() => {})
            }
          } else {
            // Not active conversation, refresh list to update unread counts
            fetchConversations()
          }
        }
        
        if (data.type === 'conversation_created' || data.type === 'conversation_status_changed') {
          // Refresh conversations list
          fetchConversations()
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
  }, [activeConvId, fetchConversations])

  // ── Pause polling when tab is not visible ───────────────────────────────────────
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Pause polling when tab is hidden
        if (convPollRef.current) clearInterval(convPollRef.current)
        if (eventSourceRef.current) eventSourceRef.current.close()
      } else {
        // Resume polling when tab is visible
        fetchConversations()
        if (convPollRef.current) clearInterval(convPollRef.current)
        convPollRef.current = setInterval(fetchConversations, 30_000)
        // Reconnect SSE
        if (!eventSourceRef.current || eventSourceRef.current.readyState === EventSource.CLOSED) {
          const eventSource = new EventSource('/api/sse')
          eventSourceRef.current = eventSource
          eventSource.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data)
              if (data.type === 'message_created' && data.data?.conversationId === activeConvId) {
                const newMessage: Message = {
                  id: data.data.messageId,
                  content: data.data.content,
                  content_type: 'text',
                  created_at: data.data.timestamp || Math.floor(Date.now() / 1000),
                  message_type: data.data.messageType === 0 ? 0 : data.data.messageType === 1 ? 1 : 2,
                  sender: data.data.sender,
                }
                setMessages(prev => [...prev, newMessage])
              } else if (data.type === 'conversation_created' || data.type === 'conversation_status_changed') {
                fetchConversations()
              }
            } catch (err) {
              console.error('[SSE] Failed to parse event:', err)
            }
          }
        }
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [fetchConversations, activeConvId])

  // ── Initial load ─────────────────────────────────────────────────────────────
  useEffect(() => {
    setConvLoading(true)
    setConversations([])
    setActiveConvId(null)
    fetchConversations()

    // Poll conversation list every 30s as fallback (SSE handles real-time updates)
    if (convPollRef.current) clearInterval(convPollRef.current)
    convPollRef.current = setInterval(fetchConversations, 30_000)
    return () => { if (convPollRef.current) clearInterval(convPollRef.current) }
  }, [])

  // ── Select conversation ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!activeConvId) { setMessages([]); return }
    setMsgLoading(true)
    fetchMessages(activeConvId).finally(() => setMsgLoading(false))
    // No polling - SSE handles real-time message updates
  }, [activeConvId, fetchMessages])

  // ── Back to list handler ───────────────────────────────────────────────────────
  const handleBack = () => {
    setActiveConvId(null)
  }

  // ── Scroll to bottom ──────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Send message ──────────────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!reply.trim() || !activeConvId || sending) return
    const content = reply.trim()
    setReply('')
    setSending(true)

    // Optimistic UI
    const optimistic: Message = {
      id: Date.now(),
      content,
      content_type: 'text',
      created_at: Math.floor(Date.now() / 1000),
      message_type: 1,
    }
    setMessages(prev => [...prev, optimistic])

    try {
      await fetch(`/api/chatwoot/messages/${activeConvId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      // Real message will appear on next poll
    } catch {
      // Remove optimistic on failure
      setMessages(prev => prev.filter(m => m.id !== optimistic.id))
      setReply(content)
    } finally {
      setSending(false)
      textareaRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  // ── Toggle status ─────────────────────────────────────────────────────────────
  const toggleStatus = async (convId?: number) => {
    const targetConv = convId ? conversations.find(c => c.id === convId) : activeConv
    if (!targetConv || statusLoading) return
    const currentStatus = repondlyStatuses.get(targetConv.id) || 'EN_ATTENTE'
    const newStatus = currentStatus === 'EN_ATTENTE' ? 'RESOLUE' : 'EN_ATTENTE'
    setStatusLoading(true)
    try {
      await fetch('/api/chatwoot/conversation-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: targetConv.id, status: newStatus }),
      })
      setRepondlyStatuses(prev => new Map(prev).set(targetConv.id, newStatus))
      if (newStatus === 'RESOLUE') setResolueCount(prev => prev + 1)
      else setEnAttenteCount(prev => prev + 1)
    } catch (err) {
      console.error('[Messagerie] Failed to toggle status:', err)
    } finally {
      setStatusLoading(false)
    }
  }

  const handleToggleBot = async (convId: number, botEnabled: boolean) => {
    try {
      const res = await fetch('/api/conversation-bot', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: convId, botEnabled }),
      })
      const data = await res.json()
      if (data.success) {
        setConversations(prev => prev.map(c => 
          c.id === convId ? { ...c, botEnabled } : c
        ))
      }
    } catch (err) {
      console.error('[Messagerie] Failed to toggle bot:', err)
    }
  }

  const handleDeleteConversation = async (convId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette conversation ? Cela la supprimera également de Chatwoot.')) return
    setStatusLoading(true)
    try {
      const res = await fetch('/api/chatwoot/conversations', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: convId }),
      })
      const data = await res.json()
      if (data.success) {
        setActiveConvId(null)
        fetchConversations()
      } else {
        console.error('[Messagerie] Failed to delete conversation:', data.error)
      }
    } catch (err) {
      console.error('[Messagerie] Failed to delete conversation:', err)
    } finally {
      setStatusLoading(false)
    }
  }

  // ── Listen for status toggle from topbar ───────────────────────────────────────
  useEffect(() => {
    const handleToggle = () => {
      toggleStatus()
    }
    window.addEventListener('toggle-conversation-status', handleToggle)
    return () => window.removeEventListener('toggle-conversation-status', handleToggle)
  }, [toggleStatus])

  // ── Filtered conversations ────────────────────────────────────────────────────
  const filtered = conversations.filter(c => {
    const repondlyStatus = repondlyStatuses.get(c.id) || 'EN_ATTENTE'
    if (tabStatus !== repondlyStatus) return false
    if (channelFilter !== 'all') {
      const channelType = c.inbox?.channel_type || ''
      if (channelFilter === 'whatsapp' && channelType !== 'Channel::Whatsapp') return false
      if (channelFilter === 'facebook' && channelType !== 'Channel::FacebookPage') return false
    }
    if (!search) return true
    const q = search.toLowerCase()
    const name = c.meta.sender.name.toLowerCase()
    const preview = (c.last_non_activity_message?.content || '').toLowerCase()
    return name.includes(q) || preview.includes(q)
  })

  // ── Group messages by date ────────────────────────────────────────────────────
  type MsgOrSep = { type: 'sep'; label: string; key: string } | { type: 'msg'; msg: Message }
  const grouped: MsgOrSep[] = []
  let lastDateLabel = ''
  for (const msg of messages) {
    if (msg.message_type === 2) { grouped.push({ type: 'msg', msg }); continue }
    const label = formatDateLabel(msg.created_at)
    if (label !== lastDateLabel) {
      grouped.push({ type: 'sep', label, key: `sep-${msg.id}` })
      lastDateLabel = label
    }
    grouped.push({ type: 'msg', msg })
  }

  // ─── Render ──────────────────────────────────────────────────────────────────
  const { data: session } = useSession()
  const userName = session?.user?.name || 'Admin'
  const initial = userName.charAt(0).toUpperCase()

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%', width: '100%', overflow: 'hidden',
      background: C.pageBg, fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      position: 'relative',
      touchAction: 'manipulation',
    }}>

      {/* ══ Main Content ════════════════════════════════════════════════════════ */}
      <div style={{
        display: 'flex', height: '100%', width: '100%', overflow: 'hidden',
        background: C.depth1,
      }}>

      {/* ══ LEFT: Conversation List ══════════════════════════════════════════════ */}
      <div style={{
        width: isMobile ? '100%' : 380,
        flexShrink: 0,
        background: 'transparent',
        borderRight: isMobile ? 'none' : `1px solid ${C.border}`,
        display: isMobile && activeConvId ? 'none' : 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        height: '100%',
      }}>

        {/* Header */}
        <div style={{ padding: isMobile ? '12px 14px' : '20px', borderBottom: `1px solid ${C.border}`, background: 'transparent', flexShrink: 0 }}>
          {/* Tabs */}
          <div style={{
            display: 'flex', background: C.depth2,
            borderRadius: 12, padding: 4, gap: 4, marginBottom: isMobile ? 10 : 16,
            border: `1px solid ${C.border}`,
          }}>
            <Tab label="En attente"  active={tabStatus === 'EN_ATTENTE'} onClick={() => setTabStatus('EN_ATTENTE')} count={enAttenteCount} />
            <Tab label="Résolues" active={tabStatus === 'RESOLUE'} onClick={() => setTabStatus('RESOLUE')} count={resolueCount} />
          </div>

          {/* Channel Filter */}
          <div style={{ display: 'flex', gap: 8, marginBottom: isMobile ? 12 : 12 }}>
            {[
              { id: 'all', label: 'Tous', color: C.textSecondary },
              { id: 'whatsapp', label: 'WhatsApp', color: C.whatsapp },
              { id: 'facebook', label: 'Facebook', color: C.facebook },
            ].map(ch => (
              <button
                key={ch.id}
                onClick={() => setChannelFilter(ch.id as any)}
                style={{
                  flex: 1, padding: isMobile ? '8px 12px' : '6px 12px', borderRadius: 16,
                  background: channelFilter === ch.id ? C.depth1 : 'transparent',
                  color: channelFilter === ch.id ? (ch.id === 'all' ? C.primary : ch.color) : C.textSecondary,
                  fontSize: isMobile ? 12 : 11, fontWeight: channelFilter === ch.id ? 600 : 500,
                  cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  border: channelFilter === ch.id ? (ch.id === 'all' ? '1px solid rgba(26, 86, 219, 0.2)' : `1px solid ${ch.color}30`) : '1px solid transparent',
                  ...(channelFilter === ch.id ? { boxShadow: 'none' } : {}),
                }}
              >
                {ch.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: C.depth1, border: `1px solid ${C.border}`,
            borderRadius: 10, padding: isMobile ? '12px 14px' : '10px 14px',
          }}>
            <Search size={isMobile ? 18 : 16} color={C.textSecondary} strokeWidth={2.5} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher..."
              style={{
                flex: 1, border: 'none', background: 'transparent',
                fontSize: isMobile ? 15 : 14, color: C.textPrimary, outline: 'none',
              }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: C.textSecondary }}>
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch', scrollBehavior: 'smooth' }}>
          {convLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 120 }}>
              <Loader2 size={24} color={C.primary} style={{ animation: 'spin 1s linear infinite' }} />
            </div>
          ) : convError ? (
            <div style={{ padding: 20, textAlign: 'center' }}>
              <WifiOff size={24} color={C.error} style={{ marginBottom: 8 }} />
              <p style={{ margin: 0, fontSize: 13, color: C.error }}>{convError}</p>
              <button onClick={() => fetchConversations()}
                style={{ marginTop: 8, fontSize: 13, color: C.primary, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                Réessayer
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState text={search ? 'Aucun résultat' : tabStatus === 'EN_ATTENTE' ? 'Aucune conversation en attente' : 'Aucune conversation résolue'} />
          ) : (
            <AnimatePresence>
              {filtered.map(conv => (
                <motion.div
                  key={conv.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                >
                  <ConvItem
                    conv={conv}
                    active={activeConvId === conv.id}
                    onClick={() => setActiveConvId(conv.id)}
                    repondlyStatus={repondlyStatuses.get(conv.id)}
                    onResolve={toggleStatus}
                    onToggleBot={handleToggleBot}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* ══ RIGHT: Message Thread ════════════════════════════════════════════════ */}
      {!activeConv ? (
        <div style={{
          flex: 1,
          display: isMobile ? 'none' : 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 16,
          background: C.depth1,
          backdropFilter: 'blur(24px)',
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20,
            background: 'rgba(26, 86, 219, 0.1)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', color: C.primary,
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          }}>
            <MessageSquare size={32} />
          </div>
          <p style={{ margin: 0, fontSize: 15, color: C.textSecondary, fontWeight: 500 }}>
            Sélectionnez une conversation
          </p>
        </div>
      ) : (
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative',
          background: 'transparent',
        }}>

          {/* ── Thread Header ── */}
          {isMobile ? (
            /* Mobile header: safe-area top + back arrow + contact name (centered) + ··· */
            <div style={{
              paddingTop: 'env(safe-area-inset-top)',
              background: C.depth2,
              backdropFilter: 'blur(32px) saturate(180%)',
              WebkitBackdropFilter: 'blur(32px) saturate(180%)',
              borderBottom: `1px solid ${C.border}`,
              flexShrink: 0,
            }}>
              <div style={{ height: 56, display: 'flex', alignItems: 'center', paddingLeft: 4, paddingRight: 12, gap: 8 }}>
                {/* Back */}
                <button
                  onClick={handleBack}
                  style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', color: C.primary, borderRadius: 12, flexShrink: 0, transition: 'background 0.2s ease' }}
                  onTouchStart={e => (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.05)'}
                  onTouchEnd={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                >
                  <ChevronLeft size={28} strokeWidth={2.5} />
                </button>

                {/* Contact info center */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: C.textPrimary, letterSpacing: '-0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
                    {activeConv.meta.sender.name}
                  </div>
                  <div style={{ fontSize: 12, color: C.textSecondary, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <ChannelIcon channelType={activeConv.inbox?.channel_type} size={12} />
                    <span>{activeConv.inbox?.name || 'Inbox'}</span>
                  </div>
                </div>

                {/* More menu */}
                <button
                  onClick={() => setActionSheetOpen(true)}
                  style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', color: C.textSecondary, borderRadius: 10, flexShrink: 0 }}
                >
                  <MoreVertical size={20} />
                </button>
              </div>
            </div>
          ) : (
            /* Desktop header */
            <div style={{
              padding: '18px 28px',
              background: C.depth2,
              backdropFilter: 'blur(16px)',
              borderBottom: `1px solid ${C.border}`,
              display: 'flex', alignItems: 'center', gap: 14,
              boxShadow: C.innerGlow,
            }}>
            <Avatar
              contact={activeConv.meta.sender}
              size={48}
              showChannelBadge={true}
              channelType={activeConv.inbox?.channel_type}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.textPrimary, letterSpacing: '-0.02em', marginBottom: 2 }}>
                {activeConv.meta.sender.name}
              </div>
              <div style={{ fontSize: 13, color: C.textSecondary, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500 }}>
                <span>{activeConv.inbox?.name || 'Inbox'}</span>
                {activeConv.meta.sender.phone_number && (
                  <><span style={{ color: C.border }}>·</span><span>{activeConv.meta.sender.phone_number}</span></>
                )}
              </div>
            </div>
            {/* Resolve Button */}
            {(repondlyStatuses.get(activeConv.id) || 'EN_ATTENTE') === 'EN_ATTENTE' && (
              <button onClick={() => toggleStatus()} disabled={statusLoading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, borderRadius: 12, background: C.depth2, border: `1px solid rgba(14,164,114,0.12)`, cursor: statusLoading ? 'default' : 'pointer', color: C.success, flexShrink: 0, opacity: statusLoading ? 0.5 : 1 }}>
                {statusLoading ? <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCheck size={20} />}
              </button>
            )}
            {/* Bot Toggle */}
            <button onClick={() => handleToggleBot(activeConv.id, !activeConv.botEnabled)} disabled={statusLoading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, borderRadius: 12, background: activeConv.botEnabled ? 'rgba(14,164,114,0.1)' : C.depth2, border: activeConv.botEnabled ? '1px solid rgba(14,164,114,0.3)' : `1px solid rgba(26,86,219,0.12)`, cursor: statusLoading ? 'default' : 'pointer', color: activeConv.botEnabled ? C.success : C.primary, flexShrink: 0, opacity: statusLoading ? 0.5 : 1 }}>
              {activeConv.botEnabled ? <motion.div animate={{ opacity: [1,0.3,1] }} transition={{ duration: 1.5, repeat: Infinity }}><Bot size={20} /></motion.div> : <Bot size={20} />}
            </button>
            {/* Delete */}
            <button onClick={() => handleDeleteConversation(activeConv.id)} disabled={statusLoading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, borderRadius: 12, background: C.depth2, border: `1px solid rgba(239,68,68,0.12)`, cursor: statusLoading ? 'default' : 'pointer', color: C.error, flexShrink: 0, opacity: statusLoading ? 0.5 : 1 }}>
              <Trash2 size={20} />
            </button>
            {/* Notes Button */}
            <button
              onClick={() => { if (onNotesOpenChange) onNotesOpenChange(true); else setNotesOpen(true) }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, borderRadius: 12, background: C.depth2, border: `1px solid rgba(26,86,219,0.12)`, cursor: 'pointer', color: C.primary, flexShrink: 0, transition: 'all 0.2s ease' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.depth3}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = C.depth2}
            >
              <FileText size={20} />
            </button>
            </div>
          )}

          {/* ── Messages ── */}
          <div style={{
            flex: 1, overflowY: 'auto', overflowX: 'hidden',
            WebkitOverflowScrolling: 'touch',
            padding: isMobile ? '16px' : '20px 24px',
            display: 'flex', flexDirection: 'column',
            scrollBehavior: 'smooth',
            background: 'transparent',
          }}>
            {msgLoading && messages.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Loader2 size={24} color={C.primary} style={{ animation: 'spin 1s linear infinite' }} />
              </div>
            ) : messages.length === 0 ? (
              <EmptyState text="Aucun message dans cette conversation" />
            ) : (
              <>
                {grouped.map((item, i) =>
                  item.type === 'sep' ? (
                    <DateSep key={item.key} label={item.label} />
                  ) : (
                    <Bubble key={item.msg.id} msg={item.msg} conversationId={activeConvId || undefined} channelType={activeConv?.inbox?.channel_type} />
                  )
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* ── Reply Box (only for EN_ATTENTE conversations) ── */}
          {activeConv && (repondlyStatuses.get(activeConv.id) || 'EN_ATTENTE') === 'EN_ATTENTE' && (
            <div style={{
              padding: isMobile ? '16px' : '20px 24px',
              background: C.depth1,
              backdropFilter: 'blur(24px)',
              borderTop: `1px solid ${C.border}`,
              display: 'flex', gap: isMobile ? 10 : 12, alignItems: 'flex-end',
              paddingBottom: isMobile ? `calc(16px + env(safe-area-inset-bottom))` : '20px',
              boxShadow: C.innerGlow + ', ' + C.blueShadow,
            }}>
              <div style={{
                flex: 1, display: 'flex', gap: isMobile ? 10 : 12, alignItems: 'flex-end',
                background: C.depth2,
                backdropFilter: 'blur(16px)',
                borderRadius: 24,
                padding: isMobile ? '8px 12px' : '10px 14px',
                border: C.glassBorder,
                boxShadow: C.innerGlow + ', ' + C.blueShadow,
              }}>
                <textarea
                  ref={textareaRef}
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Écrire un message…"
                  rows={1}
                  style={{
                    flex: 1, resize: 'none', border: 'none',
                    fontSize: isMobile ? 16 : 14, color: C.textPrimary,
                    background: 'transparent',
                    outline: 'none',
                    fontFamily: 'inherit', lineHeight: 1.5,
                    maxHeight: 120, overflowY: 'auto',
                    padding: 0,
                  }}
                />
                <button
                  onClick={handleSend}
                  disabled={!reply.trim() || sending}
                  style={{
                    width: isMobile ? 44 : 40, height: isMobile ? 44 : 40, flexShrink: 0,
                    borderRadius: '50%',
                    border: reply.trim() ? 'none' : `1px solid ${C.border}`,
                    background: reply.trim() ? C.primary : C.depth3,
                    backdropFilter: reply.trim() ? 'none' : 'blur(16px)',
                    color: reply.trim() ? '#fff' : C.textSecondary,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: reply.trim() ? 'pointer' : 'default',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: reply.trim() ? C.innerGlow + ', ' + C.blueShadow : 'none',
                  }}
                >
                  {sending
                    ? <Loader2 size={isMobile ? 20 : 18} style={{ animation: 'spin 1s linear infinite' }} />
                    : <Send size={isMobile ? 20 : 18} strokeWidth={2.5} />
                  }
                </button>
              </div>
            </div>
          )}

          {/* Resolved banner */}
          {activeConv && (repondlyStatuses.get(activeConv.id) || 'EN_ATTENTE') === 'RESOLUE' && (
            <div style={{
              padding: isMobile ? '12px 16px' : '12px 24px',
              borderTop: `1px solid ${C.border}`,
              background: 'rgba(14, 164, 114, 0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              paddingBottom: isMobile ? 'max(12px, env(safe-area-inset-bottom) + 88)' : '12px',
            }}>
              <span style={{ fontSize: isMobile ? 12 : 13, color: C.success, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCheck size={isMobile ? 14 : 16} /> Conversation résolue
              </span>
              <button onClick={() => toggleStatus()} disabled={statusLoading}
                style={{
                  fontSize: isMobile ? 12 : 13, fontWeight: 600, color: C.success,
                  background: 'none', border: 'none', cursor: 'pointer',
                  textDecoration: 'underline',
                }}>
                Rouvrir
              </button>
            </div>
          )}

          {/* Notes Panel */}
          <AnimatePresence>
            {effectiveNotesOpen && activeConvId && (
              <NotesPanel
                conversationId={activeConvId}
                isOpen={effectiveNotesOpen}
                onClose={() => {
                  if (onNotesOpenChange) {
                    onNotesOpenChange(false)
                  } else {
                    setNotesOpen(false)
                  }
                }}
              />
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Spin keyframe */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        @keyframes slideUpSheet { from { transform: translateY(100%) } to { transform: translateY(0) } }
      `}</style>
      </div>

      {/* ── Mobile Action Sheet ── */}
      {isMobile && actionSheetOpen && activeConv && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setActionSheetOpen(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 300,
              background: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
            }}
          />
          {/* Sheet */}
          <div style={{
            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 301,
            background: C.depth2,
            borderRadius: '20px 20px 0 0',
            border: `1px solid ${C.border}`,
            borderBottom: 'none',
            paddingBottom: 'env(safe-area-inset-bottom)',
            animation: 'slideUpSheet 0.3s cubic-bezier(0.32,0.72,0,1)',
          }}>
            {/* Handle */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: C.border }} />
            </div>

            {/* Contact name */}
            <div style={{ padding: '4px 20px 12px', borderBottom: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.textPrimary }}>{activeConv.meta.sender.name}</div>
              <div style={{ fontSize: 11, color: C.textSecondary }}>{activeConv.inbox?.name}</div>
            </div>

            {/* Actions */}
            <div style={{ padding: '8px 0' }}>
              {/* Notes */}
              <button
                onClick={() => { setActionSheetOpen(false); if (onNotesOpenChange) onNotesOpenChange(true); else setNotesOpen(true) }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px', border: 'none', background: 'transparent', color: C.textPrimary, fontSize: 15, cursor: 'pointer', textAlign: 'left' }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(59,130,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={18} color={C.primary} />
                </div>
                Notes du bot
              </button>

              {/* Resolve / Unresolve */}
              <button
                onClick={() => { setActionSheetOpen(false); toggleStatus() }}
                disabled={statusLoading}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px', border: 'none', background: 'transparent', color: C.textPrimary, fontSize: 15, cursor: 'pointer', textAlign: 'left', opacity: statusLoading ? 0.5 : 1 }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCheck size={18} color={C.success} />
                </div>
                {(repondlyStatuses.get(activeConv.id) || 'EN_ATTENTE') === 'EN_ATTENTE' ? 'Résoudre' : 'Rouvrir'}
              </button>

              {/* Bot toggle */}
              <button
                onClick={() => { setActionSheetOpen(false); handleToggleBot(activeConv.id, !activeConv.botEnabled) }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px', border: 'none', background: 'transparent', color: C.textPrimary, fontSize: 15, cursor: 'pointer', textAlign: 'left' }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 10, background: activeConv.botEnabled ? 'rgba(16,185,129,0.12)' : 'rgba(100,116,139,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bot size={18} color={activeConv.botEnabled ? C.success : C.textSecondary} />
                </div>
                {activeConv.botEnabled ? 'Pause bot' : 'Reprendre bot'}
              </button>

              {/* Delete */}
              <button
                onClick={() => { setActionSheetOpen(false); handleDeleteConversation(activeConv.id) }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px', border: 'none', background: 'transparent', color: C.error, fontSize: 15, cursor: 'pointer', textAlign: 'left' }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Trash2 size={18} color={C.error} />
                </div>
                Supprimer la conversation
              </button>
            </div>

            {/* Cancel */}
            <div style={{ padding: '4px 16px 8px' }}>
              <button
                onClick={() => setActionSheetOpen(false)}
                style={{ width: '100%', padding: '14px', borderRadius: 14, background: C.depth3, border: 'none', color: C.textPrimary, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}
              >
                Annuler
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}