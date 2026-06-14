'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Inbox } from 'lucide-react'
import type { Conversation, ConversationStatus } from '@/types'
import { ContactPanel } from '@/components/ContactPanel'
import { ConversationCard } from '@/components/ConversationCard'
import { InboxThread } from '@/components/InboxThread'
import { mockConversations } from '@/lib/mock'

const tabs: Array<{ label: string; status: ConversationStatus }> = [
  { label: 'Nouveau', status: 'NEW' },
  { label: 'En cours', status: 'IN_PROGRESS' },
  { label: 'Confirmé', status: 'CONFIRMED' },
  { label: 'Relance', status: 'FOLLOW_UP' },
  { label: 'Résolu', status: 'RESOLVED' },
]

export default function InboxPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<ConversationStatus>('NEW')
  const [selectedId, setSelectedId] = useState<string | null>(mockConversations[0]?.id ?? null)

  const counts = useMemo(
    () =>
      tabs.reduce<Record<ConversationStatus, number>>(
        (accumulator, tab) => {
          accumulator[tab.status] = mockConversations.filter(
            (conversation) => conversation.status === tab.status,
          ).length
          return accumulator
        },
        {
          NEW: 0,
          IN_PROGRESS: 0,
          CONFIRMED: 0,
          FOLLOW_UP: 0,
          RESOLVED: 0,
        },
      ),
    [],
  )

  const filteredConversations = useMemo(
    () => mockConversations.filter((conversation) => conversation.status === activeTab),
    [activeTab],
  )

  useEffect(() => {
    if (!filteredConversations.some((conversation) => conversation.id === selectedId)) {
      setSelectedId(filteredConversations[0]?.id ?? null)
    }
  }, [filteredConversations, selectedId])

  const selectedConversation: Conversation | null =
    filteredConversations.find((conversation) => conversation.id === selectedId) ?? null

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col md:rounded-[var(--radius-sm)] md:border md:border-[color:var(--surface-border)] md:bg-[color:var(--surface-0)] md:shadow-[var(--shadow-card)]">
      <section className="flex min-h-0 flex-1 overflow-hidden">
        <div className="flex min-h-0 w-full flex-col border-r-0 border-[color:var(--surface-border)] bg-[color:var(--surface-0)] md:w-[300px] md:shrink-0 md:border-r">
          <div className="border-b border-[color:var(--surface-border)] px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-[13px] font-semibold text-[color:var(--text-primary)]">Inbox</h1>
                <p className="mt-1 text-[12px] leading-[1.5] text-[color:var(--text-muted)]">
                  {mockConversations.length} conversations triées par statut
                </p>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] border border-[color:var(--surface-border)] bg-[color:var(--surface-0)] text-[color:var(--text-secondary)]">
                <Inbox className="h-4 w-4" aria-hidden="true" />
              </div>
            </div>
          </div>

          <div className="border-b border-[color:var(--surface-border)] px-3 py-[10px]">
            <div className="flex gap-2 overflow-x-auto">
              {tabs.map((tab) => {
                const active = tab.status === activeTab
                const count = counts[tab.status]

                return (
                  <button
                    key={tab.status}
                    type="button"
                    onClick={() => setActiveTab(tab.status)}
                    className={active ? 'rp-filter-chip is-active shrink-0' : 'rp-filter-chip shrink-0'}
                  >
                    <span>{tab.label}</span>
                    <span className="rp-filter-chip-count">{count}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto bg-[color:var(--surface-0)]">
            {filteredConversations.map((conversation) => (
              <div key={conversation.id}>
                <div className="block md:hidden">
                  <ConversationCard
                    conversation={conversation}
                    isSelected={false}
                    onClick={() => router.push(`/inbox/${conversation.id}`)}
                  />
                </div>
                <div className="hidden md:block">
                  <ConversationCard
                    conversation={conversation}
                    isSelected={conversation.id === selectedId}
                    onClick={() => setSelectedId(conversation.id)}
                  />
                </div>
              </div>
            ))}
            {filteredConversations.length === 0 ? (
              <div className="flex h-full min-h-40 items-center justify-center px-6 py-8 text-center">
                <div>
                  <p className="text-[13px] font-medium text-[color:var(--text-primary)]">Aucune conversation</p>
                  <p className="mt-1 text-[12px] text-[color:var(--text-muted)]">Ce filtre est vide pour le moment.</p>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <section className="hidden min-h-0 flex-1 bg-[color:var(--surface-0)] md:flex">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            {selectedConversation ? (
              <InboxThread conversation={selectedConversation} />
            ) : (
              <div className="flex flex-1 items-center justify-center px-6">
                <div className="text-center">
                  <p className="text-[14px] font-semibold text-[color:var(--text-primary)]">Sélectionnez une conversation</p>
                  <p className="mt-2 text-[13px] text-[color:var(--text-secondary)]">
                    Le thread détaillé et la fiche contact apparaîtront ici.
                  </p>
                </div>
              </div>
            )}
          </div>
          {selectedConversation ? <ContactPanel contact={selectedConversation.contact} /> : null}
        </section>
      </section>
    </div>
  )
}
