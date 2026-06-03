'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Search, Inbox, Bot, AlertCircle, Archive } from 'lucide-react'
import { motion } from 'framer-motion'
import ConversationItem from '@/components/messagerie/ConversationItem'
import ConversationSkeleton from '@/components/messagerie/ConversationSkeleton'

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
  // Enriched from Repondly
  needsHuman: boolean
  botActive: boolean
  isArchived: boolean
}

type FilterTab = 'all' | 'pending' | 'bot_active' | 'archived'

interface ConversationListProps {
  activeId?: number | null
  onSelect: (id: number) => void
}

function channelFromInboxType(type: string): 'whatsapp' | 'facebook' | 'instagram' {
  if (type === 'Channel::Whatsapp') return 'whatsapp'
  if (type === 'Channel::FacebookPage') return 'facebook'
  if (type === 'Channel::Instagram') return 'instagram'
  return 'whatsapp'
}

function truncate(str: string, n: number): string {
  return str.length > n ? str.slice(0, n - 1) + '…' : str
}

export default function ConversationList({ activeId, onSelect }: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const eventSourceRef = useRef<EventSource | null>(null)

  const fetchConversations = useCallback(async () => {
    try {
      const [openRes, resolvedRes] = await Promise.all([
        fetch('/api/chatwoot/conversations?status=open'),
        fetch('/api/chatwoot/conversations?status=resolved'),
      ])
      const openJson = openRes.ok ? await openRes.json() : { data: { payload: [] } }
      const resolvedJson = resolvedRes.ok ? await resolvedRes.json() : { data: { payload: [] } }
      const openList: Conversation[] = openJson.data?.payload || []
      const resolvedList: Conversation[] = resolvedJson.data?.payload || []
      // Merge and deduplicate
      const merged = [...openList]
      for (const conv of resolvedList) {
        if (!merged.some(c => c.id === conv.id)) {
          merged.push(conv)
        }
      }
      setConversations(merged)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setLoading(false)
    }
  }, [])

  // SSE with reconnect
  useEffect(() => {
    let es: EventSource
    let retryTimeout: ReturnType<typeof setTimeout>

    function connect() {
      es = new EventSource('/api/sse')
      eventSourceRef.current = es

      es.addEventListener('message_created', () => fetchConversations())
      es.addEventListener('conversation_created', () => fetchConversations())
      es.addEventListener('conversation_updated', () => fetchConversations())

      es.onerror = () => {
        es.close()
        retryTimeout = setTimeout(connect, 3000)
      }
    }

    connect()
    return () => {
      es.close()
      clearTimeout(retryTimeout)
      eventSourceRef.current = null
    }
  }, [fetchConversations])

  // Initial load
  useEffect(() => {
    setLoading(true)
    fetchConversations()
  }, [fetchConversations])

  // Visibility change refetch
  useEffect(() => {
    const handleVisibility = () => {
      if (!document.hidden) fetchConversations()
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [fetchConversations])

  const handleSelect = useCallback(
    (id: number) => {
      // Optimistic unread clearing
      setConversations(prev =>
        prev.map(c => (c.id === id ? { ...c, unread_count: 0 } : c))
      )
      // Record view
      fetch('/api/chatwoot/conversation-view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: id }),
      }).catch(() => {})
      onSelect(id)
    },
    [onSelect]
  )

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'Tous' },
    { key: 'pending', label: 'En attente' },
    { key: 'bot_active', label: 'Bot actif' },
    { key: 'archived', label: 'Archivés' },
  ]

  const filtered = conversations.filter(conv => {
    if (activeTab === 'pending') return conv.needsHuman
    if (activeTab === 'bot_active') return conv.botActive && !conv.isArchived
    if (activeTab === 'archived') return conv.isArchived
    return true
  })

  const searched = filtered.filter(conv => {
    if (!search) return true
    const q = search.toLowerCase()
    const name = conv.meta?.sender?.name?.toLowerCase() || ''
    const preview = (conv.last_non_activity_message?.content ?? '').toLowerCase()
    return name.includes(q) || preview.includes(q)
  })

  // Sort: needsHuman pinned to top, then by last_activity_at desc
  const sorted = [...searched].sort((a, b) => {
    if (a.needsHuman && !b.needsHuman) return -1
    if (!a.needsHuman && b.needsHuman) return 1
    return b.last_activity_at - a.last_activity_at
  })

  const pendingCount = conversations.filter(c => c.needsHuman).length

  const emptyState = () => {
    const icons = {
      all: <Inbox size={40} color="var(--text-muted)" />,
      pending: <AlertCircle size={40} color="var(--brand-danger)" />,
      bot_active: <Bot size={40} color="var(--brand-success)" />,
      archived: <Archive size={40} color="var(--text-muted)" />,
    }
    const messages = {
      all: 'Aucune conversation',
      pending: 'Aucun message en attente',
      bot_active: 'Aucune conversation avec le bot actif',
      archived: 'Aucune conversation archivée',
    }
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 48,
        gap: 12,
        textAlign: 'center',
      }}>
        {icons[activeTab]}
        <span style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 14,
          color: 'var(--text-muted)',
        }}>
          {messages[activeTab]}
        </span>
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'var(--surface-1)',
    }}>
      {/* Sticky filter tabs */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        background: 'var(--surface-1)',
        borderBottom: '1px solid var(--surface-border)',
        flexShrink: 0,
      }}>
        <div style={{
          display: 'flex',
          gap: 6,
          padding: '10px 16px',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
        }}>
          {tabs.map(tab => {
            const isActive = activeTab === tab.key
            const count = tab.key === 'pending' ? pendingCount : undefined
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-pill)',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  flexShrink: 0,
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                {isActive && (
                  <motion.div
                    layoutId="filter-pill"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: 'var(--radius-pill)',
                      background: 'var(--brand-primary)',
                      zIndex: 0,
                    }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  />
                )}
                {!isActive && (
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: 'var(--radius-pill)',
                    background: 'var(--surface-2)',
                    zIndex: 0,
                  }} />
                )}
                <span style={{
                  position: 'relative',
                  zIndex: 1,
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? '#fff' : 'var(--text-muted)',
                }}>
                  {tab.label}
                </span>
                {count !== undefined && count > 0 && (
                  <span style={{
                    position: 'relative',
                    zIndex: 1,
                    minWidth: 18,
                    height: 18,
                    borderRadius: 9,
                    background: isActive ? 'rgba(255,255,255,0.25)' : 'var(--brand-danger-soft)',
                    color: isActive ? '#fff' : 'var(--brand-danger)',
                    fontSize: 10,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 4px',
                  }}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Search */}
        <div style={{
          padding: '8px 16px',
          background: 'var(--surface-1)',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'var(--surface-2)',
            borderRadius: 'var(--radius-input)',
            padding: '8px 12px',
            border: '1px solid var(--surface-border)',
          }}>
            <Search size={15} color="var(--text-muted)" style={{ flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Rechercher…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                flex: 1,
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14,
                color: 'var(--text-primary)',
              }}
            />
          </div>
        </div>
      </div>

      {/* List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'contain',
      }}>
        {loading ? (
          <ConversationSkeleton />
        ) : error ? (
          <div style={{
            padding: 32,
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 14,
          }}>
            {error}
          </div>
        ) : sorted.length === 0 ? (
          emptyState()
        ) : (
          sorted.map(conv => (
            <ConversationItem
              key={conv.id}
              id={conv.id}
              contactName={conv.meta?.sender?.name || 'Client'}
              channel={channelFromInboxType(conv.inbox?.channel_type)}
              lastMessage={truncate(conv.last_non_activity_message?.content || '', 40)}
              timestamp={new Date(
                (conv.last_non_activity_message?.created_at || conv.last_activity_at) * 1000
              )}
              unreadCount={conv.unread_count}
              needsHuman={conv.needsHuman}
              botActive={conv.botActive}
              isActive={activeId === conv.id}
              onClick={() => handleSelect(conv.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}
