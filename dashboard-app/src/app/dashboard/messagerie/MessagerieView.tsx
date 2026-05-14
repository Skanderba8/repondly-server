"use client"

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { useSession, signOut } from 'next-auth/react'
import {
  Search, CheckCheck, RotateCcw, Send, Loader2,
  MessageSquare, WifiOff, X, FileText, ChevronRight,
  AlertCircle, Check, CheckCircle2, Clock, Smartphone, Menu, LayoutDashboard, Radio, Calendar, Bot, Settings, LogOut, User, ArrowRight, TrendingUp,
} from 'lucide-react'

// ─── Design tokens from dashboard-design-patterns.md ───────────────────────
const C = {
  pageBg: '#F1F5F9',
  cardBg: '#FFFFFF',
  sidebarBg: '#0F172A',
  primary: '#2563EB',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  muted: '#94A3B8',
  success: '#22C55E',
  inProgress: '#3B82F6',
  pending: '#F59E0B',
  error: '#EF4444',
  border: '#E2E8F0',
  borderMid: '#CBD5E1',
  // Channel colors
  whatsapp: '#22C55E',
  whatsappBg: '#F0FDF4',
  whatsappText: '#16A34A',
  facebook: '#3B82F6',
  facebookBg: '#EFF6FF',
  facebookText: '#2563EB',
  instagram: '#EC4899',
  instagramBg: '#FDF2F8',
  instagramText: '#DB2777',
  // Utility
  blueLight: '#EFF6FF',
  blueHover: '#DBEAFE',
  greenLight: '#F0FDF4',
  pinkLight: '#FDF2F8',
  // Message bubbles
  bubbleOut: '#2563EB',
  bubbleIn: '#FFFFFF',
  listHover: 'rgba(37, 99, 235, 0.04)',
  listActive: 'rgba(37, 99, 235, 0.08)',
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
  if (channelType === 'Channel::Whatsapp') return C.whatsapp
  if (channelType === 'Channel::FacebookPage' || channelType === 'Channel::Instagram') return C.instagram
  return C.primary
}

function channelBg(channelType: string): string {
  if (channelType === 'Channel::Whatsapp') return C.whatsappBg
  if (channelType === 'Channel::FacebookPage' || channelType === 'Channel::Instagram') return C.instagramBg
  return C.blueLight
}

function channelText(channelType: string): string {
  if (channelType === 'Channel::Whatsapp') return C.whatsappText
  if (channelType === 'Channel::FacebookPage' || channelType === 'Channel::Instagram') return C.instagramText
  return C.primary
}

function initials(name: string): string {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

// ─── Brand Channel Icons ───────────────────────────────────────────────────────
function ChannelIcon({ channelType, size = 20 }: { channelType: string; size?: number }) {
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
  const [imgError, setImgError] = useState(false)
  const badgeSize = Math.round(size * 0.35)

  return (
    <div style={{ position: 'relative', flexShrink: 0, width: size, height: size }}>
      {contact.avatar_url && !imgError ? (
        <img
          src={contact.avatar_url}
          alt={contact.name}
          onError={() => setImgError(true)}
          style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${C.border}` }}
        />
      ) : (
        <div style={{
          width: size, height: size, borderRadius: '50%',
          background: C.blueLight, color: C.primary,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: size * 0.38, fontWeight: 700,
          border: `2px solid ${C.border}`,
        }}>
          {initials(contact.name)}
        </div>
      )}
      {showChannelBadge && channelType && (
        <div style={{ position: 'absolute', bottom: -2, right: -2, background: C.cardBg, borderRadius: '50%', padding: 2 }}>
          <ChannelIcon channelType={channelType} size={badgeSize} />
        </div>
      )}
    </div>
  )
}

// ─── Empty State ───────────────────────────────────────────────────────────────
function EmptyState({ text, icon }: { text: string; icon?: React.ReactNode }) {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 16,
      color: C.textSecondary, padding: 40,
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: 16,
        background: C.blueLight, display: 'flex',
        alignItems: 'center', justifyContent: 'center', color: C.primary,
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
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
  conv, active, onClick, repondlyStatus,
}: { conv: Conversation; active: boolean; onClick: () => void; repondlyStatus?: RepondlyStatus }) {
  const contact = conv.meta.sender
  const preview = conv.last_non_activity_message?.content || ''
  const ts      = conv.last_non_activity_message?.created_at || conv.last_activity_at
  const isOut   = conv.last_non_activity_message?.message_type === 1
  const color   = channelColor(conv.inbox?.channel_type)

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 16px', cursor: 'pointer',
        background: active ? C.listActive : 'transparent',
        borderLeft: active ? `3px solid ${C.primary}` : '3px solid transparent',
        transition: 'background 0.12s',
        borderBottom: `1px solid ${C.border}`,
      }}
      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = C.listHover }}
      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
    >
      <Avatar contact={contact} size={40} showChannelBadge={true} channelType={conv.inbox?.channel_type} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <span style={{
            fontSize: 14, fontWeight: conv.unread_count > 0 ? 700 : 600,
            color: C.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {contact.name}
          </span>
          <span style={{ fontSize: 11, color: C.textSecondary, flexShrink: 0, marginLeft: 8 }}>
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
            {preview || <em style={{ color: C.muted }}>Pas de message</em>}
          </span>
          {conv.unread_count > 0 && (
            <span style={{
              background: C.primary, color: '#fff',
              fontSize: 11, fontWeight: 700, padding: '2px 8px',
              borderRadius: 999, flexShrink: 0,
            }}>
              {conv.unread_count}
            </span>
          )}
        </div>
        {repondlyStatus && (
          <div style={{ marginTop: 6 }}>
            <span style={{
              fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em',
              color: repondlyStatus === 'RESOLUE' ? C.success : C.primary,
              background: repondlyStatus === 'RESOLUE'
                ? 'rgba(34, 197, 94, 0.1)'
                : 'rgba(37, 99, 235, 0.1)',
              padding: '3px 10px', borderRadius: 999,
              backdropFilter: 'blur(8px)',
              border: repondlyStatus === 'RESOLUE'
                ? '1px solid rgba(34, 197, 94, 0.2)'
                : '1px solid rgba(37, 99, 235, 0.2)',
              boxShadow: repondlyStatus === 'RESOLUE'
                ? '0 2px 8px rgba(34, 197, 94, 0.15)'
                : '0 2px 8px rgba(37, 99, 235, 0.15)',
            }}>
              {repondlyStatus === 'RESOLUE' ? 'Résolue' : 'En attente'}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Message Bubble ─────────────────────────────────────────────────────────────
function Bubble({ msg, conversationId, onStatusCheck, channelType }: { msg: Message; conversationId?: number; onStatusCheck?: (msgId: number) => void; channelType?: string }) {
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
      const interval = setInterval(checkStatus, 3000)
      return () => clearInterval(interval)
    }
  }, [isOut, conversationId, msg.id, onStatusCheck])

  if (isActivity) {
    return (
      <div style={{ textAlign: 'center', margin: '8px 0' }}>
        <span style={{
          fontSize: 11, color: C.textSecondary,
          background: C.border,
          padding: '4px 12px', borderRadius: 999,
        }}>
          {msg.content}
        </span>
      </div>
    )
  }

  const hasError = msg.error_message || localStatus === 'failed'

  return (
    <div style={{
      display: 'flex',
      flexDirection: isOut ? 'row-reverse' : 'row',
      alignItems: 'flex-end', gap: 8, marginBottom: 12,
    }}>
      <div style={{
        maxWidth: '70%',
        background: isOut ? C.bubbleOut : C.bubbleIn,
        color: isOut ? '#fff' : C.textPrimary,
        borderRadius: isOut ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
        padding: '10px 14px',
        fontSize: 14, lineHeight: 1.5,
        boxShadow: isOut ? '0 2px 8px rgba(37, 99, 235, 0.2)' : '0 1px 4px rgba(0,0,0,0.08)',
        wordBreak: 'break-word',
        position: 'relative',
      }}>
        {hasError && (
          <div style={{
            position: 'absolute', top: -8, right: -8,
            background: C.error, color: '#fff',
            borderRadius: '50%', width: 20, height: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            cursor: 'pointer',
            zIndex: 10,
          }} title={msg.error_message || 'Échec de l\'envoi'}>
            <AlertCircle size={12} />
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          {channelType && <ChannelIcon channelType={channelType} size={12} />}
        </div>
        {msg.attachments?.length ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {msg.attachments.map(a => (
              a.file_type === 'image' ? (
                <img key={a.id} src={a.thumb_url || a.data_url} alt="attachment"
                  style={{ maxWidth: 200, borderRadius: 12, display: 'block' }} />
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
        <div style={{
          fontSize: 11,
          color: isOut ? 'rgba(255,255,255,0.6)' : C.textSecondary,
          textAlign: 'right', marginTop: 4,
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4,
        }}>
          {formatTime(msg.created_at)}
          {isOut && !hasError && (
            <MessageStatusIndicator status={localStatus} />
          )}
        </div>
      </div>
    </div>
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
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, padding: '10px 8px', cursor: 'pointer',
        background: active
          ? 'rgba(37, 99, 235, 0.1)'
          : 'transparent',
        color: active ? C.primary : C.textSecondary,
        fontSize: 13, fontWeight: active ? 700 : 500,
        borderRadius: 12,
        backdropFilter: active ? 'blur(10px)' : 'none',
        boxShadow: active
          ? '0 4px 12px rgba(37, 99, 235, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.5)'
          : 'none',
        transition: 'all 0.2s ease',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        border: active ? '1px solid rgba(37, 99, 235, 0.2)' : '1px solid transparent',
      }}
    >
      {label}
      {count !== undefined && count > 0 && (
        <span style={{
          background: active ? C.primary : 'rgba(0,0,0,0.08)',
          color: active ? '#fff' : C.textSecondary,
          fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 999,
          boxShadow: active ? '0 2px 4px rgba(37, 99, 235, 0.3)' : 'none',
        }}>
          {count}
        </span>
      )}
    </button>
  )
}

// ─── Notes Panel ─────────────────────────────────────────────────────────────────
function NotesPanel({ conversationId, isOpen, onClose }: { conversationId: number; isOpen: boolean; onClose: () => void }) {
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
        width: 320, background: C.cardBg,
        borderLeft: `1px solid ${C.border}`,
        boxShadow: '-4px 0 20px rgba(0,0,0,0.1)',
        display: 'flex', flexDirection: 'column',
        zIndex: 1000,
      }}
    >
      <div style={{ padding: '20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.textPrimary, display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileText size={18} color={C.primary} /> Notes
        </h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textSecondary, padding: 4 }}>
          <X size={20} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
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
                background: C.pageBg, borderRadius: 12, padding: 12,
                border: `1px solid ${C.border}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%',
                    background: C.blueLight, color: C.primary,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700,
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

      <div style={{ padding: '16px 20px', borderTop: `1px solid ${C.border}`, background: C.cardBg }}>
        <textarea
          value={newNote}
          onChange={e => setNewNote(e.target.value)}
          placeholder="Ajouter une note..."
          rows={3}
          style={{
            width: '100%', resize: 'none', border: `1px solid ${C.border}`,
            borderRadius: 8, padding: '10px',
            fontSize: 13, color: C.textPrimary,
            background: C.pageBg, outline: 'none',
            fontFamily: 'inherit', lineHeight: 1.5,
            marginBottom: 10,
          }}
        />
        <button
          onClick={handleSubmit}
          disabled={!newNote.trim() || submitting}
          style={{
            width: '100%', padding: '10px', borderRadius: 8, border: 'none',
            background: newNote.trim() ? C.primary : C.border,
            color: newNote.trim() ? '#fff' : C.textSecondary,
            fontSize: 13, fontWeight: 600, cursor: newNote.trim() ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}
        >
          {submitting ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : 'Ajouter'}
        </button>
      </div>
    </motion.div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────────
export default function Messagerie() {
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
  const [repondlyStatuses, setRepondlyStatuses] = useState<Map<number, RepondlyStatus>>(new Map())

  const [enAttenteCount, setEnAttenteCount] = useState(0)
  const [resolueCount, setResolueCount] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [channelFilter, setChannelFilter] = useState<'all' | 'whatsapp' | 'facebook'>('all')
  const [channelCounts, setChannelCounts] = useState({ whatsapp: 0, facebook_instagram: 0 })

  const messagesEndRef  = useRef<HTMLDivElement>(null)
  const textareaRef     = useRef<HTMLTextAreaElement>(null)
  const convPollRef     = useRef<ReturnType<typeof setInterval> | null>(null)
  const msgPollRef      = useRef<ReturnType<typeof setInterval> | null>(null)

  const activeConv = conversations.find(c => c.id === activeConvId) || null

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
            
            // Count incoming messages (message_type = 0) created after last viewed timestamp
            const unreadCount = recentMessages.filter(
              (msg: Message) => msg.message_type === 0 && msg.created_at > Math.floor(lastViewedAt.getTime() / 1000)
            ).length

            return { ...conv, unread_count: unreadCount }
          } catch {
            // On error, use Chatwoot's unread_count
            return conv
          }
        })
      )
      
      console.log('[Messagerie] Conversations fetched:', conversationsWithUnread.map(c => ({ id: c.id, channelType: c.inbox?.channel_type, sender: c.meta.sender.name, unread: c.unread_count })))
      setConversations(conversationsWithUnread)
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
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // ── Initial load ─────────────────────────────────────────────────────────────
  useEffect(() => {
    setConvLoading(true)
    setConversations([])
    setActiveConvId(null)
    fetchConversations()

    // Poll conversation list every 10s
    if (convPollRef.current) clearInterval(convPollRef.current)
    convPollRef.current = setInterval(fetchConversations, 10_000)
    return () => { if (convPollRef.current) clearInterval(convPollRef.current) }
  }, [fetchConversations])

  // ── Select conversation ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!activeConvId) { setMessages([]); return }
    setMsgLoading(true)
    fetchMessages(activeConvId).finally(() => setMsgLoading(false))

    // Poll messages every 3s
    if (msgPollRef.current) clearInterval(msgPollRef.current)
    msgPollRef.current = setInterval(() => fetchMessages(activeConvId), 3_000)
    return () => { if (msgPollRef.current) clearInterval(msgPollRef.current) }
  }, [activeConvId, fetchMessages])

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
  const toggleStatus = async () => {
    if (!activeConv || statusLoading) return
    const currentStatus = repondlyStatuses.get(activeConv.id) || 'EN_ATTENTE'
    const newStatus = currentStatus === 'EN_ATTENTE' ? 'RESOLUE' : 'EN_ATTENTE'
    setStatusLoading(true)
    try {
      await fetch('/api/chatwoot/conversation-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: activeConv.id, status: newStatus }),
      })
      setRepondlyStatuses(prev => new Map(prev).set(activeConv.id, newStatus))
      if (newStatus === 'RESOLUE') {
        setResolueCount(prev => prev + 1)
        setEnAttenteCount(prev => Math.max(0, prev - 1))
      } else {
        setEnAttenteCount(prev => prev + 1)
        setResolueCount(prev => Math.max(0, prev - 1))
      }
    } finally {
      setStatusLoading(false)
    }
  }

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
      display: 'flex', height: '100%', overflow: 'hidden',
      background: C.pageBg, fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
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
              transition={{ duration: 0.2 }}
              onClick={() => setMobileSidebarOpen(false)}
              style={{
                position: 'fixed', inset: 0,
                background: 'rgba(0, 0, 0, 0.5)',
                zIndex: 1000,
              }}
            />
            {/* Sidebar */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{
                position: 'fixed', left: 0, top: 0, bottom: 0,
                width: 280, maxWidth: '85vw',
                background: '#FFFFFF',
                zIndex: 1001,
                display: 'flex', flexDirection: 'column',
                boxShadow: '4px 0 24px rgba(0,0,0,0.08)',
              }}
            >
              {/* Logo */}
              <div style={{ height: 64, display: 'flex', alignItems: 'center', padding: '0 20px', borderBottom: '1px solid rgba(0,0,0,0.06)', flexShrink: 0 }}>
                <a href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
                  <Image src="/logo.png" alt="Répondly" width={28} height={28} style={{ objectFit: 'contain' }} priority />
                  <span style={{ fontSize: 18, fontWeight: 700, color: C.textPrimary, letterSpacing: '-0.02em' }}>
                    Répondly
                  </span>
                </a>
              </div>

              {/* Nav */}
              <nav style={{ flex: 1, padding: '8px 0', display: 'flex', flexDirection: 'column', gap: 0, overflowY: 'auto' }}>
                {[
                  { id: 'home', label: 'Accueil', icon: <LayoutDashboard size={20} />, href: '/dashboard' },
                  { id: 'inbox', label: 'Messagerie', icon: <MessageSquare size={20} />, href: '/dashboard/messagerie', active: true },
                  { id: 'channels', label: 'Canaux', icon: <Radio size={20} />, href: '/dashboard/channels' },
                  { id: 'calendrier', label: 'Calendrier', icon: <Calendar size={20} />, href: '/dashboard/calendrier' },
                  { id: 'bot', label: 'Agent IA', icon: <Bot size={20} />, href: '/dashboard/bot' },
                  { id: 'settings', label: 'Paramètres', icon: <Settings size={20} />, href: '/dashboard/settings' },
                ].map((item, index) => (
                  <a
                    key={item.id}
                    href={item.href}
                    onClick={() => setMobileSidebarOpen(false)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      width: '100%', padding: '14px 20px',
                      background: item.active ? 'rgba(37, 99, 235, 0.08)' : 'transparent',
                      color: item.active ? C.primary : C.textSecondary,
                      fontSize: 16, fontWeight: item.active ? 600 : 400,
                      border: 'none', cursor: 'pointer', transition: 'background 0.2s ease',
                      textDecoration: 'none',
                      position: 'relative',
                    }}
                    onMouseEnter={e => { if (!item.active) (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.03)' }}
                    onMouseLeave={e => { if (!item.active) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                  >
                    <span style={{ color: item.active ? C.primary : 'inherit' }}>{item.icon}</span>
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {item.active && (
                      <div style={{
                        position: 'absolute', left: 0, top: 0, bottom: 0,
                        width: 3, background: C.primary,
                      }} />
                    )}
                  </a>
                ))}
              </nav>

              {/* User */}
              <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(0,0,0,0.06)', background: '#FFFFFF', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                    background: C.primary,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 15, fontWeight: 700, color: '#fff',
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

      {/* ══ Mobile Topbar ════════════════════════════════════════════════════════ */}
      {isMobile && (
        <header style={{
          position: 'fixed', top: 0, left: 0, right: 0,
          height: 64, flexShrink: 0,
          background: C.cardBg,
          borderBottom: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center',
          padding: '0 12px',
          gap: 12,
          zIndex: 100,
        }}>
          {/* Hamburger menu */}
          <button
            onClick={() => setMobileSidebarOpen(true)}
            style={{
              background: 'none', border: 'none',
              cursor: 'pointer', padding: 8,
              color: C.textSecondary,
              borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Menu size={24} />
          </button>

          {/* Repondly branding */}
          <a href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', marginRight: 'auto' }}>
            <Image src="/logo.png" alt="Répondly" width={28} height={28} style={{ objectFit: 'contain' }} priority />
            <span style={{ fontSize: 18, fontWeight: 700, color: C.textPrimary, letterSpacing: '-0.02em' }}>
              Répondly
            </span>
          </a>

          {/* User avatar */}
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            style={{
              width: 40, height: 40, borderRadius: '50%',
              background: C.primary,
              border: profileOpen ? `2px solid ${C.primary}` : '2px solid transparent',
              color: '#fff', fontSize: 15, fontWeight: 700,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'border-color 0.15s',
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
                  <div style={{ fontSize: 11, color: C.textSecondary, marginTop: 1 }}>{session?.user?.email}</div>
                </div>
                <button
                  onClick={() => setProfileOpen(false)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 7, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, color: C.textPrimary, transition: 'background 0.12s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.pageBg}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                >
                  <User size={14} color={C.textSecondary} /> Profil
                </button>
                <button
                  onClick={() => signOut()}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 7, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, color: C.error, transition: 'background 0.12s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#FEE2E2'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                >
                  <LogOut size={14} /> Déconnexion
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </header>
      )}

      {/* ══ Main Content ════════════════════════════════════════════════════════ */}
      <div style={{
        display: 'flex', height: '100%', overflow: 'hidden',
        paddingTop: isMobile ? 64 : 0,
        background: C.pageBg,
      }}>

      {/* ══ LEFT: Conversation List ══════════════════════════════════════════════ */}
      <div style={{
        width: isMobile ? '100%' : 320,
        flexShrink: 0,
        background: C.cardBg,
        borderRight: isMobile ? 'none' : `1px solid ${C.border}`,
        display: isMobile && activeConvId ? 'none' : 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        height: '100%',
      }}>
        {/* Header */}
        <div style={{ padding: isMobile ? '16px' : '20px', borderBottom: `1px solid ${C.border}` }}>
          {/* Tabs */}
          <div style={{
            display: 'flex', background: C.pageBg,
            borderRadius: 12, padding: 4, gap: 4, marginBottom: isMobile ? 12 : 16,
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
                  flex: 1, padding: isMobile ? '8px 10px' : '6px 10px', borderRadius: 8,
                  background: channelFilter === ch.id ? C.pageBg : 'transparent',
                  color: channelFilter === ch.id ? ch.color : C.textSecondary,
                  fontSize: isMobile ? 12 : 11, fontWeight: channelFilter === ch.id ? 600 : 500,
                  cursor: 'pointer', transition: 'all 0.15s',
                  border: channelFilter === ch.id ? `1px solid ${ch.color}33` : '1px solid transparent',
                }}
              >
                {ch.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: C.pageBg, border: `1px solid ${C.border}`,
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
        <div style={{ flex: 1, overflowY: 'auto' }}>
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
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <ConvItem
                    conv={conv}
                    active={activeConvId === conv.id}
                    onClick={() => setActiveConvId(conv.id)}
                    repondlyStatus={repondlyStatuses.get(conv.id)}
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
          gap: 16 
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20,
            background: C.blueLight, display: 'flex',
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
          ...(isMobile && { position: 'fixed', left: 0, right: 0, top: 0, bottom: 0, zIndex: 50, background: C.pageBg })
        }}>

          {/* ── Thread Header ── */}
          <div style={{
            padding: isMobile ? '12px 16px' : '16px 24px',
            background: C.cardBg,
            borderBottom: `1px solid ${C.border}`,
            display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 12,
          }}>
            {isMobile && (
              <button
                onClick={() => setActiveConvId(null)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 36, height: 36, borderRadius: '50%',
                  background: C.pageBg, border: `1px solid ${C.border}`,
                  cursor: 'pointer', color: C.textSecondary,
                  flexShrink: 0,
                }}
              >
                <ChevronRight size={20} style={{ transform: 'rotate(180deg)' }} />
              </button>
            )}
            <Avatar
              contact={activeConv.meta.sender}
              size={isMobile ? 36 : 44}
              showChannelBadge={true}
              channelType={activeConv.inbox?.channel_type}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: isMobile ? 14 : 15, fontWeight: 700, color: C.textPrimary, letterSpacing: '-0.01em' }}>
                {activeConv.meta.sender.name}
              </div>
              <div style={{ fontSize: isMobile ? 11 : 12, color: C.textSecondary, display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                <span>{activeConv.inbox?.name || 'Inbox'}</span>
                {activeConv.meta.sender.phone_number && !isMobile && (
                  <span>· {activeConv.meta.sender.phone_number}</span>
                )}
              </div>
            </div>

            {/* Notes button */}
            {!isMobile && (
              <button
                onClick={() => setNotesOpen(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 14px', borderRadius: 8, border: `1px solid ${C.border}`,
                  background: C.pageBg,
                  color: C.textSecondary,
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.blueHover }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = C.pageBg }}
              >
                <FileText size={14} /> Notes
              </button>
            )}

            {/* Status button */}
            <button
              onClick={toggleStatus}
              disabled={statusLoading}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: isMobile ? '8px 12px' : '8px 14px', borderRadius: 8, border: 'none',
                background: (repondlyStatuses.get(activeConv.id) || 'EN_ATTENTE') === 'EN_ATTENTE' ? C.greenLight : C.blueLight,
                color: (repondlyStatuses.get(activeConv.id) || 'EN_ATTENTE') === 'EN_ATTENTE' ? C.success : C.primary,
                fontSize: isMobile ? 12 : 13, fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.15s',
                opacity: statusLoading ? 0.6 : 1,
                flexShrink: 0,
              }}
            >
              {statusLoading ? (
                <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (repondlyStatuses.get(activeConv.id) || 'EN_ATTENTE') === 'EN_ATTENTE' ? (
                isMobile ? <><CheckCheck size={14} /></> : <><CheckCheck size={14} /> Résoudre</>
              ) : (
                isMobile ? <><RotateCcw size={14} /></> : <><RotateCcw size={14} /> Rouvrir</>
              )}
            </button>
          </div>

          {/* ── Messages ── */}
          <div style={{
            flex: 1, overflowY: 'auto',
            padding: isMobile ? '16px' : '20px 24px',
            display: 'flex', flexDirection: 'column',
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
          {(repondlyStatuses.get(activeConv.id) || 'EN_ATTENTE') === 'EN_ATTENTE' && (
            <div style={{
              padding: isMobile ? '12px 16px' : '16px 24px',
              borderTop: `1px solid ${C.border}`,
              background: C.cardBg,
              display: 'flex', gap: isMobile ? 10 : 12, alignItems: 'flex-end',
              paddingBottom: isMobile ? 'max(12px, env(safe-area-inset-bottom))' : '16px',
            }}>
              <textarea
                ref={textareaRef}
                value={reply}
                onChange={e => setReply(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Écrire un message… (Entrée pour envoyer)"
                rows={1}
                style={{
                  flex: 1, resize: 'none', border: `1px solid ${C.border}`,
                  borderRadius: 12, padding: isMobile ? '10px 14px' : '12px 16px',
                  fontSize: isMobile ? 16 : 14, color: C.textPrimary,
                  background: C.pageBg, outline: 'none',
                  fontFamily: 'inherit', lineHeight: 1.5,
                  maxHeight: 120, overflowY: 'auto',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => (e.target.style.borderColor = C.primary)}
                onBlur={e => (e.target.style.borderColor = C.border)}
              />
              <button
                onClick={handleSend}
                disabled={!reply.trim() || sending}
                style={{
                  width: isMobile ? 48 : 44, height: isMobile ? 48 : 44, flexShrink: 0,
                  borderRadius: '50%', border: 'none',
                  background: reply.trim() ? C.primary : C.border,
                  color: reply.trim() ? '#fff' : C.textSecondary,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: reply.trim() ? 'pointer' : 'default',
                  transition: 'all 0.15s',
                  boxShadow: reply.trim() ? '0 4px 12px rgba(37, 99, 235, 0.3)' : 'none',
                }}
              >
                {sending
                  ? <Loader2 size={isMobile ? 20 : 18} style={{ animation: 'spin 1s linear infinite' }} />
                  : <Send size={isMobile ? 20 : 18} strokeWidth={2.5} />
                }
              </button>
            </div>
          )}

          {/* Resolved banner */}
          {(repondlyStatuses.get(activeConv.id) || 'EN_ATTENTE') === 'RESOLUE' && (
            <div style={{
              padding: isMobile ? '12px 16px' : '12px 24px',
              borderTop: `1px solid ${C.border}`,
              background: C.greenLight,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              paddingBottom: isMobile ? 'max(12px, env(safe-area-inset-bottom))' : '12px',
            }}>
              <span style={{ fontSize: isMobile ? 12 : 13, color: C.success, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCheck size={isMobile ? 14 : 16} /> Conversation résolue
              </span>
              <button onClick={toggleStatus} disabled={statusLoading}
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
            {notesOpen && activeConvId && (
              <NotesPanel conversationId={activeConvId} isOpen={notesOpen} onClose={() => setNotesOpen(false)} />
            )}
          </AnimatePresence>

          {/* Mobile Notes Button */}
          {isMobile && activeConvId && (
            <button
              onClick={() => setNotesOpen(true)}
              style={{
                position: 'fixed',
                bottom: 100,
                right: 16,
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: C.primary,
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)',
                zIndex: 100,
              }}
            >
              <FileText size={24} />
            </button>
          )}
        </div>
      )}

      {/* Spin keyframe */}
      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
      </div>
    </div>
  )
}