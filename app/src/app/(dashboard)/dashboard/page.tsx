'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ConversationCard } from '@/components/ConversationCard'
import { mockConversations, mockFollowUps } from '@/lib/mock'

function getTodayLabel() {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    weekday: 'long',
  }).format(new Date())
}

export default function DashboardHomePage() {
  const [dismissed, setDismissed] = useState(false)

  const followUpConversations = useMemo(
    () =>
      mockFollowUps
        .map((followUp) => mockConversations.find((conversation) => conversation.contact.id === followUp.contact.id))
        .filter((conversation) => conversation !== undefined)
        .slice(0, 3),
    [],
  )

  const newCount = mockConversations.filter((conversation) => conversation.status === 'NEW').length
  const activeCount = mockConversations.filter((conversation) => conversation.status === 'IN_PROGRESS').length

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-6">
      <section className="flex items-start justify-between gap-4">
        <h1 className="text-lg font-semibold text-[var(--text-primary)]">Bonjour 👋</h1>
        <p className="text-right text-sm text-[var(--text-secondary)]">{getTodayLabel()}</p>
      </section>

      <section className="grid grid-cols-3 gap-3">
        <div className="rounded-[4px] border border-[var(--border)] bg-white p-4">
          <p className="text-2xl font-semibold text-[var(--text-primary)]">{newCount}</p>
          <p className="mt-1 text-xs uppercase tracking-wide text-[var(--text-muted)]">Messages aujourd'hui</p>
        </div>
        <div className="rounded-[4px] border border-[var(--border)] bg-white p-4">
          <p className="text-2xl font-semibold text-[var(--text-primary)]">{mockFollowUps.length}</p>
          <p className="mt-1 text-xs uppercase tracking-wide text-[var(--text-muted)]">Relances en attente</p>
        </div>
        <div className="rounded-[4px] border border-[var(--border)] bg-white p-4">
          <p className="text-2xl font-semibold text-[var(--text-primary)]">{activeCount}</p>
          <p className="mt-1 text-xs uppercase tracking-wide text-[var(--text-muted)]">Conversations actives</p>
        </div>
      </section>

      {!dismissed ? (
        <section className="relative rounded-[4px] border border-[var(--border)] border-l-[3px] border-l-[var(--brand)] bg-[var(--brand-soft)] p-4">
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="absolute right-3 top-3 text-sm text-[var(--text-secondary)] transition-colors duration-100 hover:text-[var(--text-primary)]"
          >
            ×
          </button>
          <p className="text-sm font-medium text-[var(--text-primary)]">🌙 Pendant la nuit</p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">5 nouveaux messages · 2 demandes de RDV</p>
          <Link href="/inbox" className="mt-3 inline-flex text-sm font-medium text-[var(--brand)]">
            Voir l'inbox →
          </Link>
        </section>
      ) : null}

      <section>
        <h2 className="mb-2 text-xs uppercase tracking-wide text-[var(--text-muted)]">Relances</h2>
        <div className="overflow-hidden rounded-[4px] border border-[var(--border)] bg-white">
          {followUpConversations.map((conversation) => (
            <ConversationCard
              key={conversation.id}
              conversation={conversation}
              isSelected={false}
              onClick={() => undefined}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-xs uppercase tracking-wide text-[var(--text-muted)]">Récent</h2>
        <div className="overflow-hidden rounded-[4px] border border-[var(--border)] bg-white">
          {mockConversations.slice(0, 4).map((conversation) => (
            <ConversationCard
              key={conversation.id}
              conversation={conversation}
              isSelected={false}
              onClick={() => undefined}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
