'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Inbox } from 'lucide-react'
import type { Conversation, ConversationStatus } from '@/types'
import { ContactPanel } from '@/components/ContactPanel'
import { ConversationCard } from '@/components/ConversationCard'
import { InboxThread } from '@/components/InboxThread'
import { Badge } from '@/components/ui/Badge'
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
    <div className="flex h-full min-h-0 flex-col gap-4 md:gap-5">
      <section className="hidden items-end justify-between md:flex">
        <div>
          <p className="rp-section-label">Messagerie</p>
          <h1 className="rp-page-title">Inbox opérateur</h1>
          <p className="rp-page-subtitle">
            Filtrer vite, garder le contexte et répondre sans rupture entre liste, thread et fiche contact.
          </p>
        </div>
        <Badge variant={`${filteredConversations.length} conversations`} tone="brand" />
      </section>

      <section className="flex min-h-0 flex-1 overflow-hidden rounded-[4px] border border-[color:var(--surface-border)] bg-[color:var(--surface-0)] shadow-[var(--shadow-elevated)]">
        <div className="flex w-full min-h-0 flex-col border-r-0 border-[color:var(--surface-border)] md:w-[360px] md:shrink-0 md:border-r">
          <div className="border-b border-[color:var(--surface-border)] px-4 py-4 md:px-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="rp-section-label">Messagerie</p>
                <h2 className="mt-1 text-sm font-semibold text-[color:var(--text-primary)]">Inbox</h2>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-[4px] border border-[color:var(--surface-border)] bg-[color:var(--surface-0)] text-[color:var(--text-secondary)] shadow-[var(--shadow-card)]">
                <Inbox className="h-4 w-4" aria-hidden="true" />
              </div>
            </div>
            <p className="mt-3 text-sm text-[color:var(--text-secondary)]">
              {mockConversations.length} conversations dans la boîte, triées par statut opérationnel.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {tabs.map((tab) => {
                const active = tab.status === activeTab
                const count = counts[tab.status]

                return (
                  <button
                    key={tab.status}
                    type="button"
                    data-active={active}
                    onClick={() => setActiveTab(tab.status)}
                    className="rp-tab-trigger"
                  >
                    <span>{tab.label}</span>
                    <span className={active ? 'text-[color:var(--brand)]' : 'text-[color:var(--text-muted)]'}>
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto bg-[color:var(--surface-1)] p-2">
            <div className="space-y-1">
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
            </div>
          </div>
        </div>

        <section className="hidden min-h-0 flex-1 bg-[color:var(--surface-1)] md:flex">
          <div className="flex min-h-0 flex-1 flex-col">
            {selectedConversation ? (
              <InboxThread conversation={selectedConversation} />
            ) : (
              <div className="flex flex-1 items-center justify-center px-6">
                <div className="rp-panel-muted max-w-sm p-6 text-center">
                  <p className="text-sm font-medium text-[color:var(--text-primary)]">
                    Sélectionnez une conversation
                  </p>
                  <p className="mt-2 text-sm text-[color:var(--text-secondary)]">
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
