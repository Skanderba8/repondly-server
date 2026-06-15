'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { useMemo } from 'react'
import { ConversationCard } from '@/components/ConversationCard'
import { Badge } from '@/components/ui/Badge'
import { PageHeader } from '@/components/ui/PageHeader'
import { mockConversations, mockFollowUps } from '@/lib/mock'

function getTodayLabel() {
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', weekday: 'long' }).format(new Date())
}

export default function DashboardHomePage() {
  const priorityConversations = useMemo(
    () => mockFollowUps
      .map((followUp) => mockConversations.find((conversation) => conversation.contact.id === followUp.contact.id))
      .filter((conversation): conversation is NonNullable<typeof conversation> => conversation !== undefined)
      .slice(0, 5),
    [],
  )

  const newCount = mockConversations.filter((conversation) => conversation.status === 'NEW').length
  const pendingFollowUps = mockFollowUps.length
  const resolvedCount = mockConversations.filter((conversation) => conversation.status === 'RESOLVED').length

  const kpis = [
    { label: 'Nouveaux messages', value: newCount, badge: <Badge status="NEW" /> },
    { label: 'Relances en attente', value: pendingFollowUps, badge: <Badge status="FOLLOW_UP" /> },
    { label: 'Résolues aujourd’hui', value: resolvedCount, badge: <Badge status="RESOLVED" /> },
  ]

  return (
    <div className="rp-page">
      <PageHeader
        eyebrow="Vue d'ensemble"
        title="Tableau de bord"
        description="Une vue dense et calme pour prioriser les conversations et les relances de la journée."
        actions={<span className="text-[13px] font-medium text-[color:var(--color-text-muted)]">{getTodayLabel()}</span>}
      />

      <section className="rp-kpi-grid">
        {kpis.map((item) => (
          <article key={item.label} className="rp-kpi-card">
            <div className="flex items-start justify-between gap-3">
              <p className="rp-section-label">{item.label}</p>
              {item.badge}
            </div>
            <p className="rp-kpi-value mt-3">{item.value}</p>
          </article>
        ))}
      </section>

      <article className="rp-panel overflow-hidden p-0">
        <div className="rp-panel-header">
          <div>
            <p className="rp-section-label">Relances prioritaires</p>
            <h2 className="mt-1 text-[14px] font-semibold text-[color:var(--color-text-primary)]">Conversations à reprendre</h2>
          </div>
          <Link href="/inbox" className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[color:var(--color-text-primary)] transition-opacity duration-[var(--ease-fast)] hover:opacity-70">
            Ouvrir l'inbox
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
        <div>
          {priorityConversations.map((conversation) => (
            <ConversationCard key={conversation.id} conversation={conversation} isSelected={false} onClick={() => undefined} />
          ))}
        </div>
      </article>
    </div>
  )
}
