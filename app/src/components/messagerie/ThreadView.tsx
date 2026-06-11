'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, CheckCheck, Trash2, FileText, X, Bot } from 'lucide-react'
import ConversationTopBar from '@/components/messagerie/ConversationTopBar'
import SendBar from '@/components/messagerie/SendBar'
import MessageBubble from '@/components/messagerie/MessageBubble'

interface Message {
  id: number
  content: string
  content_type: string
  created_at: number
  message_type: number
  sender?: { id: number; name: string; type: string; avatar_url?: string }
  status?: string
  error_message?: string
  isBot?: boolean
}

interface ConvMeta {
  name: string
  inboxName: string
  channelType: string
  avatarUrl: string | null
  botEnabled: boolean
  status: string
  needsHuman: boolean
}

function timeStr(ts: number) {
  return new Date(ts * 1000).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function dateSep(ts: number) {
  const d = new Date(ts * 1000)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (d >= today) return "Aujourd'hui"
  if (d >= yesterday) return 'Hier'
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
}

function sameGroup(a: Message, b: Message): boolean {
  if (a.message_type === 2 || b.message_type === 2) return false
  // Group by direction and bot-ness
  const aIsOut = a.message_type === 1
  const bIsOut = b.message_type === 1
  if (aIsOut !== bIsOut) return false
  if (aIsOut && a.isBot !== b.isBot) return false
  // Within 15 minutes
  return Math.abs(a.created_at - b.created_at) < 15 * 60
}

interface ThreadViewProps {
  conversationId: number
  onBack?: () => void
}

export default function ThreadView({ conversationId, onBack }: ThreadViewProps) {
  const convId = conversationId
  const router = useRouter()

  const [messages, setMessages] = useState<Message[]>([])
  const [meta, setMeta] = useState<ConvMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [actionOpen, setActionOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [sendBarH, setSendBarH] = useState(76)
  const endRef = useRef<HTMLDivElement>(null)
  const sendBarRef = useRef<HTMLDivElement>(null)
  const esRef = useRef<EventSource | null>(null)
  // Track manually sent message IDs to distinguish human from bot
  const manualSendIdsRef = useRef<Set<number>>(new Set())

  // Track send bar height for scroll padding
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
      if (res.ok) {
        const msgs: Message[] = d.payload || []
        // Determine isBot for each outgoing message
        const enriched = msgs.map((msg: Message) => {
          if (msg.message_type !== 1) return msg
          // Trust Chatwoot sender.type if it says bot
          if (msg.sender?.type === 'bot') return { ...msg, isBot: true }
          return msg
        })
        setMessages(enriched)
      }
    } catch {}
  }, [convId])

  const fetchMeta = useCallback(async () => {
    try {
      const res = await fetch('/api/chatwoot/conversations?status=open')
      const d = await res.json()
      const conv = (d.data?.payload || []).find((c: { id: number }) => c.id === convId)
      if (conv) {
        setMeta({
          name: conv.meta?.sender?.name || 'Client',
          inboxName: conv.inbox?.name || '',
          channelType: conv.inbox?.channel_type || '',
          avatarUrl: conv.meta?.sender?.avatar_url || null,
          botEnabled: conv.botActive ?? true,
          status: conv.status || 'open',
          needsHuman: conv.needsHuman ?? false,
        })
      }
    } catch {}
  }, [convId])

  useEffect(() => {
    if (isNaN(convId)) return
    setLoading(true)
    Promise.all([fetchMessages(), fetchMeta()]).finally(() => setLoading(false))
    // Record view
    fetch('/api/chatwoot/conversation-view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId: convId }),
    }).catch(() => {})
  }, [convId, fetchMessages, fetchMeta])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'instant' })
  }, [loading])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // SSE for real-time messages
  useEffect(() => {
    let es: EventSource
    let retryTimeout: ReturnType<typeof setTimeout>

    function connect() {
      es = new EventSource('/api/sse')
      esRef.current = es

      es.addEventListener('message_created', (e) => {
        try {
          const data = JSON.parse(e.data)
          if (data.conversationId !== convId) return
          const newMsg: Message = {
            id: data.messageId,
            content: data.content || '',
            content_type: 'text',
            created_at: Math.floor(data.timestamp / 1000) || Math.floor(Date.now() / 1000),
            message_type: data.messageType === 'outgoing' ? 1 : 0,
            sender: data.sender,
            isBot:
              data.messageType === 'outgoing' &&
              data.senderType !== 'agent' &&
              meta?.botEnabled,
          }
          // If it's an outgoing message and we just sent one optimistically, don't duplicate
          setMessages(prev => {
            const exists = prev.some(m => m.id === newMsg.id)
            if (exists) return prev
            return [...prev, newMsg]
          })
        } catch {}
      })

      es.onerror = () => {
        es.close()
        retryTimeout = setTimeout(connect, 3000)
      }
    }

    connect()
    return () => {
      es.close()
      clearTimeout(retryTimeout)
      esRef.current = null
    }
  }, [convId, meta?.botEnabled])

  const handleSend = async () => {
    if (!reply.trim() || sending) return
    const content = reply.trim()
    setReply('')
    setSending(true)

    // Optimistic human message
    const optimisticId = Date.now()
    const optimistic: Message = {
      id: optimisticId,
      content,
      content_type: 'text',
      created_at: Math.floor(Date.now() / 1000),
      message_type: 1,
      isBot: false,
      status: 'sending',
    }
    manualSendIdsRef.current.add(optimisticId)
    setMessages(prev => [...prev, optimistic])

    try {
      // Pause bot if active
      if (meta?.botEnabled) {
        await fetch(`/api/chatwoot/conversations/${convId}/bot-mode`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ botEnabled: false }),
        })
        setMeta(m => (m ? { ...m, botEnabled: false } : m))
      }

      const res = await fetch(`/api/chatwoot/messages/${convId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      const data = await res.json()
      if (res.ok && data.id) {
        manualSendIdsRef.current.add(data.id)
        setMessages(prev =>
          prev.map(m =>
            m.id === optimisticId
              ? { ...data, isBot: false, status: 'sent' }
              : m
          )
        )
      } else {
        throw new Error('Failed to send')
      }
    } catch {
      setMessages(prev => prev.filter(m => m.id !== optimisticId))
      setReply(content)
    } finally {
      setSending(false)
    }
  }

  const handleToggleBot = async () => {
    if (!meta || actionLoading) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/chatwoot/conversations/${convId}/bot-mode`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botEnabled: !meta.botEnabled }),
      })
      if (res.ok) {
        setMeta(m => (m ? { ...m, botEnabled: !m.botEnabled } : m))
      }
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
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: convId, status: isResolved ? 'open' : 'resolved' }),
      })
      setMeta(m => (m ? { ...m, status: isResolved ? 'open' : 'resolved' } : m))
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
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: convId }),
      })
      if (onBack) onBack()
      else router.push('/dashboard/messagerie')
    } catch {
      setActionLoading(false)
    }
  }

  // Group messages by date + sender
  const groups: Array<
    | { type: 'sep'; label: string }
    | { type: 'group'; messages: Message[] }
  > = []

  let currentGroup: Message[] = []
  let lastLabel = ''

  for (const msg of messages) {
    if (msg.message_type === 2) {
      if (currentGroup.length) {
        groups.push({ type: 'group', messages: currentGroup })
        currentGroup = []
      }
      groups.push({ type: 'group', messages: [msg] })
      continue
    }

    const label = dateSep(msg.created_at)
    if (label !== lastLabel) {
      if (currentGroup.length) {
        groups.push({ type: 'group', messages: currentGroup })
        currentGroup = []
      }
      groups.push({ type: 'sep', label })
      lastLabel = label
    }

    if (currentGroup.length === 0 || sameGroup(currentGroup[currentGroup.length - 1], msg)) {
      currentGroup.push(msg)
    } else {
      groups.push({ type: 'group', messages: currentGroup })
      currentGroup = [msg]
    }
  }
  if (currentGroup.length) {
    groups.push({ type: 'group', messages: currentGroup })
  }

  const ACTIONS = [
    {
      label: meta?.status === 'resolved' ? 'Rouvrir la conversation' : 'Résoudre',
      icon: <CheckCheck size={18} color="#22C55E" />,
      iconBg: 'rgba(48,209,88,0.12)',
      onClick: handleToggleStatus,
      danger: false,
    },
    {
      label: meta?.botEnabled ? 'Pause bot' : 'Reprendre le bot',
      icon: <Bot size={18} color={meta?.botEnabled ? '#22C55E' : 'var(--text-muted)'} />,
      iconBg: meta?.botEnabled ? 'rgba(48,209,88,0.12)' : 'rgba(100,116,139,0.12)',
      onClick: handleToggleBot,
      danger: false,
    },
    {
      label: 'Notes du bot',
      icon: <FileText size={18} color="var(--brand-primary)" />,
      iconBg: 'var(--brand-primary-soft)',
      onClick: () => setActionOpen(false),
      danger: false,
    },
    {
      label: 'Supprimer la conversation',
      icon: <Trash2 size={18} color="var(--brand-danger)" />,
      iconBg: 'rgba(255,59,48,0.10)',
      onClick: handleDelete,
      danger: true,
    },
  ]

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--surface-1)',
        overflow: 'hidden',
      }}
    >
      {/* TopBar */}
      <ConversationTopBar
        contact={{
          id: convId,
          name: meta?.name || '…',
          phone_number: null,
          email: null,
          avatar_url: meta?.avatarUrl || null,
        }}
        channelType={meta?.channelType || ''}
        botEnabled={meta?.botEnabled ?? true}
        onToggleBot={handleToggleBot}
        onBack={onBack}
        onMenu={() => setActionOpen(true)}
      />

      {/* Handoff banner */}
      <AnimatePresence>
        {meta?.needsHuman && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            style={{
              backgroundColor: 'var(--brand-danger-soft)',
              border: '1px solid var(--brand-danger)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              margin: '8px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexShrink: 0,
            }}
          >
            <AlertCircle color="var(--brand-danger)" size={16} />
            <span style={{
              fontSize: 13,
              color: 'var(--brand-danger)',
              fontWeight: 500,
              fontFamily: "'DM Sans', sans-serif",
            }}>
              Ce client a demandé à parler à un humain
            </span>
            <button
              onClick={() => {
                if (meta?.botEnabled) handleToggleBot()
              }}
              disabled={actionLoading}
              style={{
                marginLeft: 'auto',
                padding: '4px 10px',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                background: 'var(--brand-danger)',
                color: '#fff',
                fontSize: 12,
                fontWeight: 600,
                fontFamily: "'DM Sans', sans-serif",
                cursor: 'pointer',
                opacity: actionLoading ? 0.5 : 1,
              }}
            >
              Prendre en charge
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'contain',
        padding: '12px 14px',
        paddingBottom: `${sendBarH + 8}px`,
      }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 8 }}>
            {([0.55, 0.75, 0.45, 0.65, 0.5] as number[]).map((w, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: i % 2 ? 'flex-end' : 'flex-start' }}>
                <div className="rp-shimmer" style={{
                  height: i % 3 === 0 ? 56 : 40,
                  width: `${w * 100}%`,
                  maxWidth: 260,
                  borderRadius: 16,
                }} />
              </div>
            ))}
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {groups.map((group, gIdx) => {
              if (group.type === 'sep') {
                return (
                  <div key={`sep-${gIdx}`} style={{ textAlign: 'center', margin: '16px 0 8px' }}>
                    <span style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 11,
                      color: 'var(--text-muted)',
                      background: 'var(--surface-2)',
                      padding: '4px 14px',
                      borderRadius: 20,
                      border: '1px solid var(--surface-border)',
                    }}>
                      {group.label}
                    </span>
                  </div>
                )
              }

              const msgs = group.messages
              const first = msgs[0]
              const isActivity = first.message_type === 2

              if (isActivity) {
                return (
                  <div key={`act-${first.id}`} style={{ textAlign: 'center', margin: '6px 0' }}>
                    <span style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 11,
                      color: 'var(--text-muted)',
                    }}>
                      {first.content}
                    </span>
                  </div>
                )
              }

              return (
                <div key={`grp-${gIdx}`} style={{ marginBottom: 4 }}>
                  <div style={{
                    textAlign: first.message_type === 1 ? 'right' : 'left',
                    marginBottom: 2,
                    padding: '0 4px',
                  }}>
                    <span style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 10,
                      color: 'var(--text-muted)',
                    }}>
                      {timeStr(first.created_at)}
                    </span>
                  </div>
                  {msgs.map((msg, mIdx) => {
                    const isFirst = mIdx === 0
                    const isLast = mIdx === msgs.length - 1
                    return (
                      <MessageBubble
                        key={msg.id}
                        msg={msg}
                        isFirst={isFirst}
                        isLast={isLast}
                      />
                    )
                  })}
                </div>
              )
            })}
          </AnimatePresence>
        )}
        <div ref={endRef} style={{ height: 1 }} />
      </div>

      {/* Send bar */}
      <div
        ref={sendBarRef}
        style={{
          flexShrink: 0,
          background: 'var(--surface-glass)',
          backdropFilter: 'blur(32px) saturate(180%)',
          WebkitBackdropFilter: 'blur(32px) saturate(180%)',
          borderTop: '1px solid var(--surface-border)',
          padding: '10px 12px',
          paddingBottom: 'calc(10px + env(safe-area-inset-bottom))',
        }}
      >
        <SendBar
          value={reply}
          onChange={setReply}
          onSend={handleSend}
          disabled={sending}
          botActive={meta?.botEnabled ?? true}
          onPauseBot={() => handleToggleBot()}
        />
      </div>

      {/* Action Sheet */}
      <AnimatePresence>
        {actionOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setActionOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 200,
                background: 'rgba(0,0,0,0.45)',
                backdropFilter: 'blur(4px)',
                WebkitBackdropFilter: 'blur(4px)',
              }}
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 201,
                background: 'var(--surface-0)',
                borderRadius: '24px 24px 0 0',
                border: '1px solid var(--surface-border)',
                borderBottom: 'none',
                paddingBottom: 'env(safe-area-inset-bottom)',
                boxShadow: '0 -8px 40px rgba(0,0,0,0.3)',
              }}
            >
              {/* Handle */}
              <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 6px' }}>
                <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--surface-border)' }} />
              </div>

              {/* Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '4px 20px 14px',
                borderBottom: '1px solid var(--surface-border)',
              }}>
                <div>
                  <div style={{
                    fontFamily: "'Syne', sans-serif",
                    fontSize: 14,
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                  }}>
                    {meta?.name}
                  </div>
                  <div style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 12,
                    color: 'var(--text-muted)',
                    marginTop: 2,
                  }}>
                    {meta?.inboxName}
                  </div>
                </div>
                <button
                  onClick={() => setActionOpen(false)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: 'var(--surface-2)',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                  }}
                >
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
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      padding: '13px 20px',
                      border: 'none',
                      background: 'transparent',
                      color: action.danger ? 'var(--brand-danger)' : 'var(--text-primary)',
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 16,
                      cursor: actionLoading ? 'default' : 'pointer',
                      opacity: actionLoading ? 0.5 : 1,
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    <div style={{
                      width: 38,
                      height: 38,
                      borderRadius: 12,
                      background: action.iconBg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
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
    </div>
  )
}
