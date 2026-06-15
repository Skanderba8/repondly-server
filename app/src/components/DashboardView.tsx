'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ArrowRight, X } from 'lucide-react'
import { ConversationCard } from '@/components/ConversationCard'
import { Badge } from '@/components/ui/Badge'
import type { DashboardStats } from '@/lib/dashboard'
import type { Conversation } from '@/types'

type DashboardViewProps = {
  stats: DashboardStats
  recentConversations: Conversation[]
  followUpConversations: Conversation[]
}

function getTodayLabel() {
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', weekday: 'long' }).format(new Date())
}

export function DashboardView({ stats, recentConversations, followUpConversations }: DashboardViewProps) {
  const [showBanner, setShowBanner] = useState(true)

  const kpis = useMemo(
    () => [
      { label: 'Nouveaux messages', value: stats.newCount, badge: <Badge status="NEW" />, changeClass: 'nx-kpi-change-up', hint: 'A traiter' },
      { label: 'Relances en attente', value: stats.followUpCount, badge: <Badge status="FOLLOW_UP" />, changeClass: 'nx-kpi-change-dn', hint: 'A suivre' },
      { label: 'Conversations actives', value: stats.activeCount, badge: <Badge status="IN_PROGRESS" />, changeClass: 'nx-kpi-change-up', hint: 'En cours' },
      { label: 'Conversations resolues', value: stats.resolvedCount, badge: <Badge status="RESOLVED" />, changeClass: 'nx-kpi-change-up', hint: 'Terminees' },
    ],
    [stats],
  )

  return (
    <div className="nx-page">
      <header className="nx-page-header">
        <div>
          <p className="nx-section-label">Vue d&apos;ensemble</p>
          <h1 className="nx-page-title">Tableau de bord</h1>
          <p className="nx-page-sub">Une vue dense et calme pour prioriser les conversations et les relances de la journee.</p>
        </div>
        <p className="nx-page-sub">{getTodayLabel()}</p>
      </header>

      {showBanner ? (
        <section className="nx-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: 20, alignItems: 'center' }}>
            <div>
              <p className="nx-section-label">Focus</p>
              <p className="nx-card-title">Les relances prioritaires et les nouvelles conversations sont synchronisees depuis la base.</p>
            </div>
            <button type="button" className="nx-btn nx-btn-secondary nx-btn-icon-md" onClick={() => setShowBanner(false)} aria-label="Fermer la banniere">
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        </section>
      ) : null}

      <section className="nx-kpi-grid">
        {kpis.map((item) => (
          <article key={item.label} className="nx-kpi-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
              <p className="nx-section-label">{item.label}</p>
              {item.badge}
            </div>
            <p className="nx-kpi-value">{item.value}</p>
            <span className={item.changeClass}>{item.hint}</span>
          </article>
        ))}
      </section>

      <section className="nx-card">
        <div className="nx-card-header">
          <div>
            <p className="nx-section-label">Relances prioritaires</p>
            <h2 className="nx-card-title">Conversations a reprendre</h2>
          </div>
          <Link href="/inbox" className="nx-btn nx-btn-secondary">
            Ouvrir l&apos;inbox
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
        <div>
          {(followUpConversations.length ? followUpConversations : recentConversations).map((conversation) => (
            <ConversationCard key={conversation.id} conversation={conversation} isSelected={false} onClick={() => undefined} />
          ))}
        </div>
      </section>

      <section className="nx-card">
        <div className="nx-card-header">
          <div>
            <p className="nx-section-label">Activite recente</p>
            <h2 className="nx-card-title">Dernieres conversations</h2>
          </div>
        </div>
        <div>
          {recentConversations.map((conversation) => (
            <ConversationCard key={conversation.id} conversation={conversation} isSelected={false} onClick={() => undefined} />
          ))}
        </div>
      </section>
    </div>
  )
}
