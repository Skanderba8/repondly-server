'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
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
      tabs.reduce<Record<ConversationStatus, number>>((accumulator, tab) => {
        accumulator[tab.status] = mockConversations.filter((conversation) => conversation.status === tab.status).length
        return accumulator
      }, {
        NEW: 0,
        IN_PROGRESS: 0,
        CONFIRMED: 0,
        FOLLOW_UP: 0,
        RESOLVED: 0,
      }),
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
    <div className="flex h-full min-h-0 bg-white">
      <section className="flex w-full min-h-0 flex-col border-r border-[var(--border)] md:w-[320px] md:shrink-0">
        <div className="border-b border-[var(--border)]">
          <div className="px-4 pb-2 pt-4">
            <h1 className="text-base font-semibold text-[var(--text-primary)]">Inbox</h1>
          </div>
          <div className="flex gap-4 overflow-x-auto px-4 pb-2 text-xs">
            {tabs.map((tab) => {
              const active = tab.status === activeTab
              const count = counts[tab.status]

              return (
                <button
                  key={tab.status}
                  type="button"
                  onClick={() => setActiveTab(tab.status)}
                  className={`inline-flex h-8 items-center gap-1 border-b-2 pb-1 transition-colors duration-100 ${
                    active
                      ? 'border-[var(--brand)] font-medium text-[var(--brand)]'
                      : 'border-transparent text-[var(--text-secondary)]'
                  }`}
                >
                  <span>{tab.label}</span>
                  {count > 0 ? <span className="text-[var(--brand)]">{count}</span> : null}
                </button>
              )
            })}
          </div>
        </div>

        <div className="min-h-0 overflow-y-auto">
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
      </section>

      <section className="hidden min-h-0 flex-1 md:flex">
        <div className="flex min-h-0 flex-1 flex-col">
          {selectedConversation ? (
            <InboxThread conversation={selectedConversation} />
          ) : (
            <div className="flex flex-1 items-center justify-center bg-[var(--surface-1)] px-6">
              <p className="text-sm text-[var(--text-muted)]">Sélectionnez une conversation</p>
            </div>
          )}
        </div>
        {selectedConversation ? <ContactPanel contact={selectedConversation.contact} /> : null}
      </section>
    </div>
  )
}
