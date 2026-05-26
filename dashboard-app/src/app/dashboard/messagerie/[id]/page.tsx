'use client'

import { use, useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Send, MoreVertical, CheckCheck, Bot, Trash2, FileText, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Message {
  id: number
  content: string
  content_type: string
  created_at: number
  message_type: number
  sender?: { name: string; type: string }
}

interface ConvMeta {
  name: string
  inboxName: string
  channelType: string
  avatarUrl: string | null
  botEnabled: boolean
  status: string
}

function timeStr(ts: number) {
  return new Date(ts * 1000).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function dateSep(ts: number) {
  const d = new Date(ts * 1000)
  const today = new Date(); today.setHours(0,0,0,0)
  const yesterday = new Date(today); yesterday.setDate(today.getDate()-1)
  if (d >= today) return 'Aujourd\'hui'
  if (d >= yesterday) return 'Hier'
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
}

function channelColor(ct: string) {
  if (ct === 'Channel::Whatsapp') return '#22C55E'
  if (ct === 'Channel::Instagram') return '#EC4899'
  return 'var(--color-accent)'
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

export default function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const convId = parseInt(id, 10)
  const router = useRouter()

  const [messages, setMessages] = useState<Message[]>([])
  const [meta, setMeta] = useState<ConvMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [actionOpen, setActionOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  // sendBarH tracks actual rendered height of the send bar for correct scroll padding
  const [sendBarH, setSendBarH] = useState(76)
  const endRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const sendBarRef = useRef<HTMLDivElement>(null)
  const esRef = useRef<EventSource | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  // ── Fix invisible bottom bar: lock height to visualViewport ──────────────────
  useEffect(() => {
    const setH = () => {
      const h = window.visualViewport?.height ?? window.innerHeight
      if (wrapRef.current) wrapRef.current.style.height = `${h}px`
    }
    setH()
    window.visualViewport?.addEventListener('resize', setH)
    window.addEventListener('resize', setH)
    return () => {
      window.visualViewport?.removeEventListener('resize', setH)
      window.removeEventListener('resize', setH)
    }
  }, [])

  // ── Track send bar height for messages padding ────────────────────────────────
  useEffect(() => {
    if (!sendBarRef.current) return
    const ro = new ResizeObserver(entries => {
      const h = entries[0]?.contentRect.height
      if (h) setSendBarH(h + 8)
    })
    ro.observe(sendBarRef.current)
    return () => ro.disconnect()
  }, [])

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/chatwoot/messages/${convId}`)
      const d = await res.json()
      if (res.ok) setMessages(d.payload || [])
    } catch {}
  }, [convId])

  useEffect(() => {
    if (isNaN(convId)) return
    setLoading(true)
    Promise.all([
      fetch(`/api/chatwoot/messages/${convId}`).then(r => r.json()),
      fetch('/api/chatwoot/conversations?status=open').then(r => r.json()),
    ]).then(([msgs, convs]) => {
      setMessages(msgs.payload || [])
      const conv = (convs.data?.payload || []).find((c: { id: number }) => c.id === convId)
      if (conv) {
        setMeta({
          name: conv.meta?.sender?.name || 'Client',
          inboxName: conv.inbox?.name || '',
          channelType: conv.inbox?.channel_type || '',
          avatarUrl: conv.meta?.sender?.avatar_url || null,
          botEnabled: conv.botEnabled ?? false,
          status: conv.status || 'open',
        })
      }
      fetch('/api/chatwoot/conversation-view', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: convId }),
      }).catch(() => {})
    }).catch(() => {}).finally(() => setLoading(false))
  }, [convId])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'instant' })
  }, [loading])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const es = new EventSource('/api/sse')
    esRef.current = es
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        if (data.type === 'message_created' && data.data?.conversationId === convId) {
          fetchMessages()
        }
      } catch {}
    }
    return () => { es.close(); esRef.current = null }
  }, [convId, fetchMessages])

  const handleSend = async () => {
    if (!reply.trim() || sending) return
    const content = reply.trim()
    setReply('')
    if (textareaRef.current) { textareaRef.current.style.height = 'auto' }
    setSending(true)
    const optimistic: Message = { id: Date.now(), content, content_type: 'text', created_at: Math.floor(Date.now()/1000), message_type: 1 }
    setMessages(prev => [...prev, optimistic])
    try {
      await fetch(`/api/chatwoot/messages/${convId}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
    } catch {
      setMessages(prev => prev.filter(m => m.id !== optimistic.id))
      setReply(content)
    } finally {
      setSending(false)
      textareaRef.current?.focus()
    }
  }

  const handleToggleBot = async () => {
    if (!meta || actionLoading) return
    setActionLoading(true)
    try {
      await fetch('/api/conversation-bot', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: convId, botEnabled: !meta.botEnabled }),
      })
      setMeta(m => m ? { ...m, botEnabled: !m.botEnabled } : m)
    } catch {} finally {
      setActionLoading(false)
      setActionOpen(false)
    }
  }

  const handleToggleStatus = async () => {
    if (!meta || actionLoading) return
    setActionLoading(true)
    const isResolved = meta.status === 'resolved'
    try {
      await fetch('/api/chatwoot/conversation-status', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: convId, status: isResolved ? 'open' : 'resolved' }),
      })
      setMeta(m => m ? { ...m, status: isResolved ? 'open' : 'resolved' } : m)
    } catch {} finally {
      setActionLoading(false)
      setActionOpen(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Supprimer cette conversation ? Cette action est irréversible.')) return
    setActionLoading(true)
    try {
      await fetch('/api/chatwoot/conversations', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: convId }),
      })
      router.push('/dashboard/messagerie')
    } catch { setActionLoading(false) }
  }

  const color = channelColor(meta?.channelType || '')
  const ini = meta ? initials(meta.name) : '…'

  const grouped: Array<{ type: 'sep'; label: string } | { type: 'msg'; msg: Message }> = []
  let lastLabel = ''
  for (const msg of messages) {
    if (msg.message_type === 2) { grouped.push({ type: 'msg', msg }); continue }
    const label = dateSep(msg.created_at)
    if (label !== lastLabel) { grouped.push({ type: 'sep', label }); lastLabel = label }
    grouped.push({ type: 'msg', msg })
  }

  const ACTIONS = [
    {
      label: meta?.status === 'resolved' ? 'Rouvrir la conversation' : 'Résoudre',
      icon: <CheckCheck size={18} color="#30D158" />,
      iconBg: 'rgba(48,209,88,0.12)',
      onClick: handleToggleStatus,
      danger: false,
    },
    {
      label: meta?.botEnabled ? 'Pause bot' : 'Reprendre le bot',
      icon: <Bot size={18} color={meta?.botEnabled ? '#30D158' : 'var(--color-text-3)'} />,
      iconBg: meta?.botEnabled ? 'rgba(48,209,88,0.12)' : 'rgba(100,116,139,0.12)',
      onClick: handleToggleBot,
      danger: false,
    },
    {
      label: 'Notes du bot',
      icon: <FileText size={18} color="var(--color-accent)" />,
      iconBg: 'var(--color-accent-soft)',
      onClick: () => setActionOpen(false),
      danger: false,
    },
    {
      label: 'Supprimer la conversation',
      icon: <Trash2 size={18} color="var(--color-danger)" />,
      iconBg: 'rgba(255,59,48,0.10)',
      onClick: handleDelete,
      danger: true,
    },
  ]

  return (
    <div
      ref={wrapRef}
      style={{
        display: 'flex', flexDirection: 'column',
        height: '100dvh',
        background: 'var(--color-bg)',
        overflow: 'hidden',
        position: 'fixed', inset: 0,
      }}
    >
      {/* ── TopBar ── */}
      <div style={{
        background: 'var(--color-surface-glass)',
        backdropFilter: 'blur(32px) saturate(180%)',
        WebkitBackdropFilter: 'blur(32px) saturate(180%)',
        borderBottom: '1px solid var(--color-border)',
        flexShrink: 0,
        paddingTop: 'env(safe-area-inset-top)',
      }}>
        <div style={{ height: 56, display: 'flex', alignItems: 'center', paddingLeft: 4, paddingRight: 8, gap: 4 }}>
          <button
            onClick={() => router.push('/dashboard/messagerie')}
            style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-accent)', borderRadius: 10, WebkitTapHighlightColor: 'transparent', flexShrink: 0 }}
          >
            <ChevronLeft size={24} strokeWidth={2.5} />
          </button>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: `${color}20`, border: `2px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 700, color, flexShrink: 0 }}>
            {ini}
          </div>
          <div style={{ flex: 1, minWidth: 0, marginLeft: 6 }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 15, fontWeight: 700, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>
              {meta?.name || '…'}
            </div>
            {meta?.inboxName && (
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {meta.inboxName}
              </div>
            )}
          </div>
          <button
            onClick={() => setActionOpen(true)}
            style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-3)', borderRadius: 8, WebkitTapHighlightColor: 'transparent', flexShrink: 0 }}
          >
            <MoreVertical size={20} />
          </button>
        </div>
      </div>

      {/* ── Messages ── */}
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain', padding: '12px 14px', paddingBottom: `${sendBarH + 8}px` }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 8 }}>
            {([0.55, 0.75, 0.45, 0.65, 0.5] as number[]).map((w, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: i % 2 ? 'flex-end' : 'flex-start' }}>
                <div className="rp-shimmer" style={{ height: i % 3 === 0 ? 56 : 40, width: `${w * 100}%`, maxWidth: 260, borderRadius: 16 }} />
              </div>
            ))}
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {grouped.map((item, idx) => {
              if (item.type === 'sep') return (
                <div key={`sep-${idx}`} style={{ textAlign: 'center', margin: '16px 0 8px' }}>
                  <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: 'var(--color-text-3)', background: 'var(--color-surface-2)', padding: '4px 14px', borderRadius: 20, border: '1px solid var(--color-border)' }}>
                    {item.label}
                  </span>
                </div>
              )
              const msg = item.msg
              const isOut = msg.message_type === 1
              const isActivity = msg.message_type === 2
              if (isActivity) return (
                <div key={msg.id} style={{ textAlign: 'center', margin: '6px 0' }}>
                  <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: 'var(--color-text-3)' }}>{msg.content}</span>
                </div>
              )
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 24 }}
                  style={{ display: 'flex', justifyContent: isOut ? 'flex-end' : 'flex-start', marginBottom: 3 }}
                >
                  <div style={{
                    maxWidth: '80%',
                    background: isOut ? 'var(--color-accent)' : 'var(--color-surface)',
                    color: isOut ? '#fff' : 'var(--color-text)',
                    borderRadius: isOut ? '20px 20px 5px 20px' : '20px 20px 20px 5px',
                    padding: '10px 14px 7px',
                    border: isOut ? 'none' : '1px solid var(--color-border)',
                    boxShadow: 'var(--shadow-card)',
                  }}>
                    <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 15, lineHeight: 1.5, margin: 0, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                      {msg.content}
                    </p>
                    <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, color: isOut ? 'rgba(255,255,255,0.6)' : 'var(--color-text-3)', display: 'block', textAlign: 'right', marginTop: 4 }}>
                      {timeStr(msg.created_at)}
                    </span>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        )}
        <div ref={endRef} style={{ height: 1 }} />
      </div>

      {/* ── Send bar (in flow, not fixed) ── */}
      <div
        ref={sendBarRef}
        style={{
          flexShrink: 0,
          background: 'var(--color-surface-glass)',
          backdropFilter: 'blur(32px) saturate(180%)',
          WebkitBackdropFilter: 'blur(32px) saturate(180%)',
          borderTop: '1px solid var(--color-border)',
          padding: '10px 12px',
          paddingBottom: 'calc(10px + env(safe-area-inset-bottom))',
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'flex-end', gap: 8,
          background: 'var(--color-surface-2)',
          borderRadius: 26,
          padding: '8px 6px 8px 16px',
          border: '1px solid var(--color-border)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        }}>
          <textarea
            ref={textareaRef}
            value={reply}
            onChange={e => {
              setReply(e.target.value)
              const el = e.target
              el.style.height = 'auto'
              el.style.height = `${Math.min(el.scrollHeight, 100)}px`
            }}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
            placeholder="Écrire un message…"
            rows={1}
            style={{
              flex: 1, resize: 'none', border: 'none', background: 'transparent', outline: 'none',
              fontFamily: "'DM Sans',sans-serif", fontSize: 16, lineHeight: 1.45,
              color: 'var(--color-text)', overflowY: 'hidden', maxHeight: 100, minHeight: 26,
              paddingTop: 2,
            }}
          />
          <motion.button
            onClick={handleSend}
            disabled={!reply.trim() || sending}
            animate={{ scale: reply.trim() ? 1 : 0.85, opacity: reply.trim() ? 1 : 0.35 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            style={{
              width: 38, height: 38, borderRadius: '50%',
              background: reply.trim() ? 'var(--color-accent)' : 'var(--color-surface-3)',
              border: 'none', cursor: reply.trim() ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, transition: 'background 0.15s',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <Send size={16} color={reply.trim() ? '#fff' : 'var(--color-text-3)'} style={{ transform: 'translateX(1px)' }} />
          </motion.button>
        </div>
      </div>

      {/* ── Action Sheet ── */}
      <AnimatePresence>
        {actionOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setActionOpen(false)}
              style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              style={{
                position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 201,
                background: 'var(--color-surface)',
                borderRadius: '24px 24px 0 0',
                border: '1px solid var(--color-border)',
                borderBottom: 'none',
                paddingBottom: 'env(safe-area-inset-bottom)',
                boxShadow: '0 -8px 40px rgba(0,0,0,0.3)',
              }}
            >
              {/* Handle */}
              <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 6px' }}>
                <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--color-border-2)' }} />
              </div>

              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 20px 14px', borderBottom: '1px solid var(--color-border)' }}>
                <div>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>{meta?.name}</div>
                  <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color, marginTop: 2 }}>{meta?.inboxName}</div>
                </div>
                <button onClick={() => setActionOpen(false)} style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--color-surface-2)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--color-text-3)' }}>
                  <X size={16} />
                </button>
              </div>

              {/* Actions */}
              <div style={{ padding: '6px 0 8px' }}>
                {ACTIONS.map((action, i) => (
                  <button
                    key={i}
                    onClick={action.onClick}
                    disabled={actionLoading}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 16,
                      padding: '13px 20px', border: 'none', background: 'transparent',
                      color: action.danger ? 'var(--color-danger)' : 'var(--color-text)',
                      fontFamily: "'DM Sans',sans-serif", fontSize: 16,
                      cursor: actionLoading ? 'default' : 'pointer',
                      opacity: actionLoading ? 0.5 : 1,
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    <div style={{ width: 38, height: 38, borderRadius: 12, background: action.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {action.icon}
                    </div>
                    {action.label}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes rp-pulse { 0%,100%{opacity:.35} 50%{opacity:.8} }
        .rp-shimmer { animation: rp-pulse 1.5s ease-in-out infinite; background: var(--color-surface-2) !important; }
      `}</style>
    </div>
  )
}
