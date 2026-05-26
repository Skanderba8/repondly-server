'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Search } from 'lucide-react'
import ConversationItem from '@/components/messagerie/ConversationItem'
import ChannelFilter from '@/components/messagerie/ChannelFilter'
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
}

type ChannelFilterValue = 'all' | 'whatsapp' | 'facebook'

export default function ConversationList() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [channelFilter, setChannelFilter] = useState<ChannelFilterValue>('all')
  const [channelCounts, setChannelCounts] = useState({ whatsapp: 0, facebook_instagram: 0 })

  const convPollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  const fetchConversations = useCallback(async () => {
    try {
      const [convRes, inboxesRes] = await Promise.all([
        fetch('/api/chatwoot/conversations?status=open'),
        fetch('/api/chatwoot/inboxes'),
      ])
      const data = await convRes.json()
      if (!convRes.ok) throw new Error(data.error || 'Erreur réseau')
      const list: Conversation[] = data.data?.payload || []

      const inboxesData = await inboxesRes.json()
      const inboxesMap = new Map<number, string>(
        (inboxesData.payload ?? []).map((i: { id: number; channel_type: string }) => [i.id, i.channel_type])
      )

      const withChannel = list.map(c => ({
        ...c,
        inbox: { ...c.inbox, channel_type: inboxesMap.get(c.inbox_id) || c.inbox?.channel_type || '' },
      }))

      const whatsappCount = withChannel.filter(c => c.inbox?.channel_type === 'Channel::Whatsapp').length
      const fbInstaCount = withChannel.filter(c =>
        c.inbox?.channel_type === 'Channel::FacebookPage' || c.inbox?.channel_type === 'Channel::Instagram'
      ).length
      setChannelCounts({ whatsapp: whatsappCount, facebook_instagram: fbInstaCount })

      // Show conversations immediately with Chatwoot's unread counts
      setConversations(withChannel)
      setError(null)
      setLoading(false)

      // Refine unread counts in background without blocking render
      try {
        const viewsRes = await fetch('/api/chatwoot/conversation-view')
        const viewsData = await viewsRes.json()
        const viewsMap = new Map<number, Date>()
        viewsData?.forEach((v: { conversationId: number; lastViewedAt: string }) => {
          viewsMap.set(v.conversationId, new Date(v.lastViewedAt))
        })

        const refined = await Promise.all(
          withChannel.map(async (conv) => {
            const lastViewedAt = viewsMap.get(conv.id)
            if (!lastViewedAt || conv.unread_count === 0) return conv
            try {
              const msgsRes = await fetch(`/api/chatwoot/messages/${conv.id}`)
              const msgsData = await msgsRes.json()
              const msgs: Array<{ message_type: number; created_at: number }> = msgsData.payload || []
              const unreadCount = msgs.slice(-20).filter(
                m => m.message_type === 0 && new Date(m.created_at * 1000) > lastViewedAt
              ).length
              return { ...conv, unread_count: unreadCount }
            } catch {
              return conv
            }
          })
        )
        setConversations(refined)
      } catch {
        // background refinement failed, keep Chatwoot counts
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
      setLoading(false)
    }
  }, [])

  // SSE
  useEffect(() => {
    const es = new EventSource('/api/sse')
    eventSourceRef.current = es
    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (
          data.type === 'message_created' ||
          data.type === 'conversation_created' ||
          data.type === 'conversation_status_changed'
        ) {
          fetchConversations()
        }
      } catch {}
    }
    es.onerror = () => es.close()
    return () => { es.close(); eventSourceRef.current = null }
  }, [fetchConversations])

  // Initial load + 30s poll
  useEffect(() => {
    setLoading(true)
    fetchConversations()
    convPollRef.current = setInterval(fetchConversations, 30_000)
    return () => { if (convPollRef.current) clearInterval(convPollRef.current) }
  }, [fetchConversations])

  // Visibility change
  useEffect(() => {
    const handleVisibility = () => {
      if (!document.hidden) fetchConversations()
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [fetchConversations])

  const filtered = conversations.filter(conv => {
    if (channelFilter === 'whatsapp' && conv.inbox?.channel_type !== 'Channel::Whatsapp') return false
    if (channelFilter === 'facebook' && conv.inbox?.channel_type !== 'Channel::FacebookPage' && conv.inbox?.channel_type !== 'Channel::Instagram') return false
    if (search) {
      const q = search.toLowerCase()
      const name = conv.meta.sender.name.toLowerCase()
      const preview = (conv.last_non_activity_message?.content ?? '').toLowerCase()
      if (!name.includes(q) && !preview.includes(q)) return false
    }
    return true
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--color-bg)' }}>
      {/* Channel filter */}
      <ChannelFilter
        value={channelFilter}
        onChange={setChannelFilter}
        counts={{ all: conversations.length, whatsapp: channelCounts.whatsapp, facebook_instagram: channelCounts.facebook_instagram }}
      />

      {/* Search */}
      <div style={{
        padding: '8px 16px',
        background: 'var(--color-bg)',
        borderBottom: '1px solid var(--color-border)',
        flexShrink: 0,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'var(--color-surface-2)',
          borderRadius: 'var(--radius-input)',
          padding: '8px 12px',
          border: '1px solid var(--color-border)',
        }}>
          <Search size={15} color="var(--color-text-3)" style={{ flexShrink: 0 }} />
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
              color: 'var(--color-text)',
            }}
          />
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' as React.CSSProperties['WebkitOverflowScrolling'], overscrollBehavior: 'contain' }}>
        {loading ? (
          <ConversationSkeleton />
        ) : error ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--color-text-3)', fontFamily: "'DM Sans', sans-serif", fontSize: 14 }}>
            {error}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--color-text-3)', fontFamily: "'DM Sans', sans-serif", fontSize: 14 }}>
            Aucune conversation
          </div>
        ) : (
          filtered.map(conv => <ConversationItem key={conv.id} conv={conv} />)
        )}
      </div>
    </div>
  )
}
