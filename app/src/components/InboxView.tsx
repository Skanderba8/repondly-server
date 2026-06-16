'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Inbox, Search } from 'lucide-react'
import type { Conversation, ConversationStatus } from '@/types'
import { ContactPanel } from '@/components/ContactPanel'
import { ConversationCard } from '@/components/ConversationCard'
import { InboxThread } from '@/components/InboxThread'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { playNotificationSound } from '@/lib/realtime/sounds'
import { useInboxRealtime } from '@/lib/realtime/useInboxRealtime'

const tabs: Array<{ label: string; status: ConversationStatus }> = [
  { label: 'Nouveau', status: 'NEW' },
  { label: 'En cours', status: 'IN_PROGRESS' },
  { label: 'Confirmé', status: 'CONFIRMED' },
  { label: 'Relance', status: 'FOLLOW_UP' },
  { label: 'Résolu', status: 'RESOLVED' },
]

interface InboxViewProps {
  businessId: string
  conversations: Conversation[]
}

function formatListTime(date: Date) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function InboxView({ businessId, conversations }: InboxViewProps) {
  const router = useRouter()
  const [localConversations, setLocalConversations] = useState<Conversation[]>(conversations)
  const [activeTab, setActiveTab] = useState<ConversationStatus>('NEW')
  const [selectedId, setSelectedId] = useState<string | null>(conversations[0]?.id ?? null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    setLocalConversations(conversations)
  }, [conversations])

  const handleNewMessage = useCallback((conversationId: string, preview: string) => {
    const conversationExists = localConversations.some((conversation) => conversation.id === conversationId)

    if (!conversationExists) {
      router.refresh()
    } else {
      setLocalConversations((current) => {
        const conversation = current.find((item) => item.id === conversationId)

        if (!conversation) {
          return current
        }

        const updatedConversation: Conversation = {
          ...conversation,
          lastMessage: preview,
          time: formatListTime(new Date()),
          unread: true,
        }

        return [updatedConversation, ...current.filter((item) => item.id !== conversationId)]
      })
    }

    if (selectedId !== conversationId) {
      playNotificationSound()
    }
  }, [localConversations, router, selectedId])

  const { connected } = useInboxRealtime(businessId, handleNewMessage)

  const counts = useMemo(
    () => tabs.reduce<Record<ConversationStatus, number>>((accumulator, tab) => {
      accumulator[tab.status] = localConversations.filter((conversation) => conversation.status === tab.status).length
      return accumulator
    }, { NEW: 0, IN_PROGRESS: 0, CONFIRMED: 0, FOLLOW_UP: 0, RESOLVED: 0 }),
    [localConversations],
  )

  const filteredConversations = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return localConversations.filter((conversation) => {
      if (conversation.status !== activeTab) return false
      if (!normalizedQuery) return true
      return [conversation.contact.name, conversation.contact.phone, conversation.intent, conversation.summary, conversation.lastMessage].join(' ').toLowerCase().includes(normalizedQuery)
    })
  }, [activeTab, localConversations, query])

  useEffect(() => {
    if (!filteredConversations.some((conversation) => conversation.id === selectedId)) {
      setSelectedId(filteredConversations[0]?.id ?? null)
    }
  }, [filteredConversations, selectedId])

  const selectedConversation: Conversation | null = filteredConversations.find((conversation) => conversation.id === selectedId) ?? null

  return (
    <div className="nx-card flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <section className="flex min-h-0 flex-1 overflow-hidden">
        {/* Left pane — conversation list */}
        <div className="flex min-h-0 w-full flex-col bg-[color:var(--bg-card)] md:w-[300px] md:shrink-0 md:border-r md:border-[color:var(--border)]">
          <div className="border-b border-[color:var(--border)] px-4 py-3">
            <div>
              <h1 className="text-[14px] font-semibold text-[color:var(--text-primary)]">Messages</h1>
              <div className="mt-0.5 flex items-center gap-2">
                <p className="text-[12.5px] leading-[1.4] text-[color:var(--text-muted)]">{localConversations.length} conversations</p>
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: connected ? 'var(--success)' : 'var(--text-muted)' }}
                  aria-label={connected ? 'Temps reel connecte' : 'Temps reel deconnecte'}
                />
              </div>
            </div>
            <div className="relative mt-3">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--text-muted)]" aria-hidden="true" />
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher" className="pl-9" aria-label="Rechercher une conversation" />
            </div>
          </div>

          <div className="border-b border-[color:var(--border)] px-3 py-2.5">
            <div className="nx-no-scrollbar flex gap-2 overflow-x-auto">
              {tabs.map((tab) => {
                const active = tab.status === activeTab
                return (
                  <button key={tab.status} type="button" onClick={() => setActiveTab(tab.status)} className={active ? 'nx-filter-chip is-active shrink-0' : 'nx-filter-chip shrink-0'}>
                    <span>{tab.label}</span>
                    <span className="text-[11px] opacity-70">{counts[tab.status]}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto bg-[color:var(--bg-card)]">
            {filteredConversations.map((conversation) => (
              <div key={conversation.id}>
                <div className="block md:hidden"><ConversationCard conversation={conversation} isSelected={false} onClick={() => router.push(`/inbox/${conversation.id}`)} /></div>
                <div className="hidden md:block"><ConversationCard conversation={conversation} isSelected={conversation.id === selectedId} onClick={() => setSelectedId(conversation.id)} /></div>
              </div>
            ))}
            {filteredConversations.length === 0 ? <EmptyState icon={<Inbox className="h-4 w-4" aria-hidden="true" />} title="Aucune conversation" description="Ce filtre ne contient pas encore de message correspondant." /> : null}
          </div>
        </div>

        {/* Center pane — thread */}
        <div className="hidden min-h-0 min-w-0 flex-1 flex-col bg-[color:var(--bg-card)] md:flex">
          {selectedConversation ? <InboxThread conversation={selectedConversation} /> : <EmptyState title="Sélectionnez une conversation" description="Le thread détaillé et la fiche contact apparaîtront ici." />}
        </div>

        {/* Right pane — contact info */}
        {selectedConversation ? <ContactPanel contact={selectedConversation.contact} /> : null}
      </section>
    </div>
  )
}
