'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, CheckCheck, RotateCcw, Send, Loader2,
  MessageSquare, WifiOff, ChevronDown, X
} from 'lucide-react'

// ─── Design tokens (mirrors page.tsx) ─────────────────────────────────────────
const C = {
  sidebarBg:    'rgba(10, 22, 48, 0.97)',
  mainBg:       '#f0f4fb',
  cardBg:       'rgba(255,255,255,0.82)',
  cardBgSolid:  '#ffffff',
  blue:         '#1a6bff',
  blueDark:     '#0f4fd4',
  blueLight:    '#ddeaff',
  ink:          '#0d1b2e',
  inkSoft:      '#1e3557',
  mid:          '#5a6a80',
  muted:        '#8899aa',
  green:        '#00c853',
  greenBg:      'rgba(0,200,83,0.1)',
  amber:        '#f59e0b',
  amberBg:      'rgba(245,158,11,0.1)',
  red:          '#ef4444',
  redBg:        'rgba(239,68,68,0.1)',
  border:       'rgba(26,107,255,0.1)',
  borderLight:  'rgba(0,0,0,0.06)',
  // Messagerie-specific
  bubbleOut:    '#1a6bff',
  bubbleIn:     '#ffffff',
  listHover:    'rgba(26,107,255,0.04)',
  listActive:   'rgba(26,107,255,0.08)',
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
}

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
  if (channelType?.toLowerCase().includes('whatsapp')) return '#25D366'
  if (channelType?.toLowerCase().includes('facebook'))  return '#1877f2'
  if (channelType?.toLowerCase().includes('instagram')) return '#e1306c'
  return C.blue
}

function channelLabel(channelType: string): string {
  if (channelType?.toLowerCase().includes('whatsapp')) return 'WA'
  if (channelType?.toLowerCase().includes('facebook'))  return 'FB'
  if (channelType?.toLowerCase().includes('instagram')) return 'IG'
  return 'MSG'
}

function initials(name: string): string {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

// ─── Channel Dot ───────────────────────────────────────────────────────────────
function ChannelDot({ channelType, size = 18 }: { channelType: string; size?: number }) {
  const color = channelColor(channelType)
  const label = channelLabel(channelType)
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: size, height: size, borderRadius: '50%',
      background: color, color: '#fff',
      fontSize: size * 0.38, fontWeight: 700, flexShrink: 0,
    }}>
      {label}
    </span>
  )
}

// ─── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ contact, size = 38, channelType }: { contact: Contact; size?: number; channelType?: string }) {
  const [imgError, setImgError] = useState(false)
  const dotSize = Math.round(size * 0.42)

  return (
    <div style={{ position: 'relative', flexShrink: 0, width: size, height: size }}>
      {contact.avatar_url && !imgError ? (
        <img
          src={contact.avatar_url}
          alt={contact.name}
          onError={() => setImgError(true)}
          style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }}
        />
      ) : (
        <div style={{
          width: size, height: size, borderRadius: '50%',
          background: C.blueLight, color: C.blue,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: size * 0.36, fontWeight: 700,
        }}>
          {initials(contact.name)}
        </div>
      )}
      {channelType && (
        <div style={{ position: 'absolute', bottom: -1, right: -1 }}>
          <ChannelDot channelType={channelType} size={dotSize} />
        </div>
      )}
    </div>
  )
}

// ─── Empty State ───────────────────────────────────────────────────────────────
function EmptyState({ text }: { text: string }) {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 12,
      color: C.muted, padding: 40,
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: 16,
        background: C.blueLight, display: 'flex',
        alignItems: 'center', justifyContent: 'center', color: C.blue,
      }}>
        <MessageSquare size={24} />
      </div>
      <p style={{ margin: 0, fontSize: 13.5, color: C.muted, textAlign: 'center', maxWidth: 220, lineHeight: 1.6 }}>
        {text}
      </p>
    </div>
  )
}

// ─── Conversation List Item ─────────────────────────────────────────────────────
function ConvItem({
  conv, active, onClick,
}: { conv: Conversation; active: boolean; onClick: () => void }) {
  const contact = conv.meta.sender
  const preview = conv.last_non_activity_message?.content || ''
  const ts      = conv.last_non_activity_message?.created_at || conv.last_activity_at
  const isOut   = conv.last_non_activity_message?.message_type === 1

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 11,
        padding: '10px 14px', cursor: 'pointer',
        background: active ? C.listActive : 'transparent',
        borderLeft: active ? `3px solid ${C.blue}` : '3px solid transparent',
        transition: 'background 0.12s',
        borderBottom: `1px solid ${C.borderLight}`,
      }}
      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = C.listHover }}
      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
    >
      <Avatar contact={contact} size={38} channelType={conv.inbox?.channel_type} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
          <span style={{
            fontSize: 13, fontWeight: conv.unread_count > 0 ? 700 : 600,
            color: C.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {contact.name}
          </span>
          <span style={{ fontSize: 11, color: C.muted, flexShrink: 0, marginLeft: 6 }}>
            {formatTime(ts)}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
          <span style={{
            fontSize: 12, color: conv.unread_count > 0 ? C.inkSoft : C.muted,
            fontWeight: conv.unread_count > 0 ? 500 : 400,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
          }}>
            {isOut && <span style={{ color: C.blue, marginRight: 3 }}>↗</span>}
            {preview || <em>Pas de message</em>}
          </span>
          {conv.unread_count > 0 && (
            <span style={{
              background: C.blue, color: '#fff',
              fontSize: 10.5, fontWeight: 700, padding: '1px 6px',
              borderRadius: 100, flexShrink: 0,
            }}>
              {conv.unread_count}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Message Bubble ─────────────────────────────────────────────────────────────
function Bubble({ msg }: { msg: Message }) {
  const isOut      = msg.message_type === 1
  const isActivity = msg.message_type === 2

  if (isActivity) {
    return (
      <div style={{ textAlign: 'center', margin: '6px 0' }}>
        <span style={{
          fontSize: 11, color: C.muted,
          background: 'rgba(0,0,0,0.05)',
          padding: '3px 12px', borderRadius: 100,
        }}>
          {msg.content}
        </span>
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: isOut ? 'row-reverse' : 'row',
      alignItems: 'flex-end', gap: 7, marginBottom: 2,
    }}>
      <div style={{
        maxWidth: '70%',
        background: isOut ? C.bubbleOut : C.bubbleIn,
        color: isOut ? '#fff' : C.ink,
        borderRadius: isOut ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
        padding: '9px 13px',
        fontSize: 13.5, lineHeight: 1.5,
        boxShadow: isOut ? '0 2px 8px rgba(26,107,255,0.2)' : '0 1px 4px rgba(0,0,0,0.08)',
        wordBreak: 'break-word',
      }}>
        {msg.attachments?.length ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {msg.attachments.map(a => (
              a.file_type === 'image' ? (
                <img key={a.id} src={a.thumb_url || a.data_url} alt="attachment"
                  style={{ maxWidth: 200, borderRadius: 10, display: 'block' }} />
              ) : (
                <a key={a.id} href={a.data_url} target="_blank" rel="noreferrer"
                  style={{ color: isOut ? 'rgba(255,255,255,0.9)' : C.blue, fontSize: 12, textDecoration: 'underline' }}>
                  📎 Pièce jointe
                </a>
              )
            ))}
            {msg.content && <span>{msg.content}</span>}
          </div>
        ) : msg.content}
        <div style={{
          fontSize: 10.5,
          color: isOut ? 'rgba(255,255,255,0.55)' : C.muted,
          textAlign: 'right', marginTop: 3,
        }}>
          {formatTime(msg.created_at)}
        </div>
      </div>
    </div>
  )
}

// ─── Date Separator ────────────────────────────────────────────────────────────
function DateSep({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '12px 0 8px' }}>
      <div style={{ flex: 1, height: 1, background: C.borderLight }} />
      <span style={{ fontSize: 11, color: C.muted, fontWeight: 500, whiteSpace: 'nowrap' }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: C.borderLight }} />
    </div>
  )
}

// ─── Status Tab ────────────────────────────────────────────────────────────────
type TabStatus = 'open' | 'resolved'
function Tab({ label, active, onClick, count }: { label: string; active: boolean; onClick: () => void; count?: number }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, padding: '7px 4px', border: 'none', cursor: 'pointer',
        background: active ? C.cardBgSolid : 'transparent',
        color: active ? C.blue : C.muted,
        fontSize: 12.5, fontWeight: active ? 700 : 500,
        borderRadius: 8,
        boxShadow: active ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
        transition: 'all 0.15s',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
      }}
    >
      {label}
      {count !== undefined && count > 0 && (
        <span style={{
          background: active ? C.blue : 'rgba(0,0,0,0.1)',
          color: active ? '#fff' : C.muted,
          fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 100,
        }}>
          {count}
        </span>
      )}
    </button>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────────
export default function Messagerie() {
  const [tabStatus, setTabStatus]       = useState<TabStatus>('open')
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [convLoading, setConvLoading]   = useState(true)
  const [convError, setConvError]       = useState<string | null>(null)

  const [activeConvId, setActiveConvId] = useState<number | null>(null)
  const [messages, setMessages]         = useState<Message[]>([])
  const [msgLoading, setMsgLoading]     = useState(false)

  const [search, setSearch]             = useState('')
  const [reply, setReply]               = useState('')
  const [sending, setSending]           = useState(false)
  const [statusLoading, setStatusLoading] = useState(false)

  const [openCount, setOpenCount]       = useState(0)
  const [resolvedCount, setResolvedCount] = useState(0)

  const messagesEndRef  = useRef<HTMLDivElement>(null)
  const textareaRef     = useRef<HTMLTextAreaElement>(null)
  const convPollRef     = useRef<ReturnType<typeof setInterval> | null>(null)
  const msgPollRef      = useRef<ReturnType<typeof setInterval> | null>(null)

  const activeConv = conversations.find(c => c.id === activeConvId) || null

  // ── Fetch conversations ──────────────────────────────────────────────────────
  const fetchConversations = useCallback(async (status: TabStatus) => {
    try {
      const res  = await fetch(`/api/chatwoot/conversations?status=${status}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur réseau')
      const list: Conversation[] = data.data?.payload || []
      setConversations(list)
      setConvError(null)
      // update counts
      if (status === 'open')     setOpenCount(list.length)
      if (status === 'resolved') setResolvedCount(list.length)
    } catch (err: any) {
      setConvError(err.message)
    } finally {
      setConvLoading(false)
    }
  }, [])

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

  // ── Initial + tab change ─────────────────────────────────────────────────────
  useEffect(() => {
    setConvLoading(true)
    setConversations([])
    setActiveConvId(null)
    fetchConversations(tabStatus)

    // Poll conversation list every 10s
    if (convPollRef.current) clearInterval(convPollRef.current)
    convPollRef.current = setInterval(() => fetchConversations(tabStatus), 10_000)
    return () => { if (convPollRef.current) clearInterval(convPollRef.current) }
  }, [tabStatus, fetchConversations])

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
    const newStatus = activeConv.status === 'open' ? 'resolved' : 'open'
    setStatusLoading(true)
    try {
      await fetch('/api/chatwoot/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: activeConv.id, status: newStatus }),
      })
      await fetchConversations(tabStatus)
      if (tabStatus !== newStatus) setActiveConvId(null)
    } finally {
      setStatusLoading(false)
    }
  }

  // ── Filtered conversations ────────────────────────────────────────────────────
  const filtered = conversations.filter(c => {
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
  return (
    <div style={{
      display: 'flex', height: '100%', overflow: 'hidden',
      background: C.mainBg, fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
    }}>

      {/* ══ LEFT: Conversation List ══════════════════════════════════════════════ */}
      <div style={{
        width: 290, flexShrink: 0,
        background: C.cardBgSolid,
        borderRight: `1px solid ${C.borderLight}`,
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '14px 14px 10px', borderBottom: `1px solid ${C.borderLight}` }}>
          <h2 style={{ margin: '0 0 10px', fontSize: 15, fontWeight: 700, color: C.ink, letterSpacing: '-0.02em' }}>
            Messagerie
          </h2>

          {/* Tabs */}
          <div style={{
            display: 'flex', background: C.mainBg,
            borderRadius: 10, padding: 3, gap: 2, marginBottom: 10,
          }}>
            <Tab label="Ouvertes"  active={tabStatus === 'open'}     onClick={() => setTabStatus('open')}     count={openCount} />
            <Tab label="Résolues" active={tabStatus === 'resolved'} onClick={() => setTabStatus('resolved')} count={resolvedCount} />
          </div>

          {/* Search */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: C.mainBg, border: `1px solid ${C.borderLight}`,
            borderRadius: 10, padding: '7px 11px',
          }}>
            <Search size={13} color={C.muted} strokeWidth={2.5} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher..."
              style={{
                flex: 1, border: 'none', background: 'transparent',
                fontSize: 13, color: C.ink, outline: 'none',
              }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: C.muted }}>
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {convLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 120 }}>
              <Loader2 size={20} color={C.blue} style={{ animation: 'spin 1s linear infinite' }} />
            </div>
          ) : convError ? (
            <div style={{ padding: 20, textAlign: 'center' }}>
              <WifiOff size={20} color={C.red} style={{ marginBottom: 8 }} />
              <p style={{ margin: 0, fontSize: 12, color: C.red }}>{convError}</p>
              <button onClick={() => fetchConversations(tabStatus)}
                style={{ marginTop: 8, fontSize: 12, color: C.blue, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                Réessayer
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState text={search ? 'Aucun résultat' : tabStatus === 'open' ? 'Aucune conversation ouverte' : 'Aucune conversation résolue'} />
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
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* ══ RIGHT: Message Thread ════════════════════════════════════════════════ */}
      {!activeConv ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 20,
            background: C.blueLight, display: 'flex',
            alignItems: 'center', justifyContent: 'center', color: C.blue,
          }}>
            <MessageSquare size={28} />
          </div>
          <p style={{ margin: 0, fontSize: 14, color: C.muted, fontWeight: 500 }}>
            Sélectionnez une conversation
          </p>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* ── Thread Header ── */}
          <div style={{
            padding: '12px 20px',
            background: C.cardBgSolid,
            borderBottom: `1px solid ${C.borderLight}`,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <Avatar
              contact={activeConv.meta.sender}
              size={38}
              channelType={activeConv.inbox?.channel_type}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.ink, letterSpacing: '-0.01em' }}>
                {activeConv.meta.sender.name}
              </div>
              <div style={{ fontSize: 11.5, color: C.muted, display: 'flex', alignItems: 'center', gap: 5, marginTop: 1 }}>
                <ChannelDot channelType={activeConv.inbox?.channel_type} size={13} />
                <span>{activeConv.inbox?.name || 'Inbox'}</span>
                {activeConv.meta.sender.phone_number && (
                  <span>· {activeConv.meta.sender.phone_number}</span>
                )}
              </div>
            </div>

            {/* Resolve / Reopen button */}
            <button
              onClick={toggleStatus}
              disabled={statusLoading}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', borderRadius: 10, border: 'none',
                background: activeConv.status === 'open' ? C.greenBg : C.blueLight,
                color: activeConv.status === 'open' ? C.green : C.blue,
                fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.15s',
                opacity: statusLoading ? 0.6 : 1,
              }}
            >
              {statusLoading ? (
                <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
              ) : activeConv.status === 'open' ? (
                <><CheckCheck size={14} /> Résoudre</>
              ) : (
                <><RotateCcw size={13} /> Rouvrir</>
              )}
            </button>
          </div>

          {/* ── Messages ── */}
          <div style={{
            flex: 1, overflowY: 'auto',
            padding: '16px 20px',
            display: 'flex', flexDirection: 'column',
          }}>
            {msgLoading && messages.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Loader2 size={22} color={C.blue} style={{ animation: 'spin 1s linear infinite' }} />
              </div>
            ) : messages.length === 0 ? (
              <EmptyState text="Aucun message dans cette conversation" />
            ) : (
              <>
                {grouped.map((item, i) =>
                  item.type === 'sep' ? (
                    <DateSep key={item.key} label={item.label} />
                  ) : (
                    <Bubble key={item.msg.id} msg={item.msg} />
                  )
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* ── Reply Box (only for open conversations) ── */}
          {activeConv.status === 'open' && (
            <div style={{
              padding: '12px 16px',
              borderTop: `1px solid ${C.borderLight}`,
              background: C.cardBgSolid,
              display: 'flex', gap: 10, alignItems: 'flex-end',
            }}>
              <textarea
                ref={textareaRef}
                value={reply}
                onChange={e => setReply(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Écrire un message… (Entrée pour envoyer)"
                rows={1}
                style={{
                  flex: 1, resize: 'none', border: `1px solid ${C.borderLight}`,
                  borderRadius: 12, padding: '9px 13px',
                  fontSize: 13.5, color: C.ink,
                  background: C.mainBg, outline: 'none',
                  fontFamily: 'inherit', lineHeight: 1.5,
                  maxHeight: 120, overflowY: 'auto',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => (e.target.style.borderColor = C.blue)}
                onBlur={e => (e.target.style.borderColor = C.borderLight)}
              />
              <button
                onClick={handleSend}
                disabled={!reply.trim() || sending}
                style={{
                  width: 38, height: 38, flexShrink: 0,
                  borderRadius: '50%', border: 'none',
                  background: reply.trim() ? C.blue : C.blueLight,
                  color: reply.trim() ? '#fff' : C.muted,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: reply.trim() ? 'pointer' : 'default',
                  transition: 'all 0.15s',
                  boxShadow: reply.trim() ? '0 3px 10px rgba(26,107,255,0.3)' : 'none',
                }}
              >
                {sending
                  ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                  : <Send size={15} strokeWidth={2.5} />
                }
              </button>
            </div>
          )}

          {/* Resolved banner */}
          {activeConv.status === 'resolved' && (
            <div style={{
              padding: '10px 20px',
              borderTop: `1px solid ${C.borderLight}`,
              background: C.greenBg,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: 12.5, color: C.green, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCheck size={14} /> Conversation résolue
              </span>
              <button onClick={toggleStatus} disabled={statusLoading}
                style={{
                  fontSize: 12, fontWeight: 600, color: C.green,
                  background: 'none', border: 'none', cursor: 'pointer',
                  textDecoration: 'underline',
                }}>
                Rouvrir
              </button>
            </div>
          )}
        </div>
      )}

      {/* Spin keyframe */}
      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}