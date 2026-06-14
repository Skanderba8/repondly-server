'use client'

import Link from 'next/link'
import { ArrowRight, BellRing, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ConversationCard } from '@/components/ConversationCard'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
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
        .map((followUp) =>
          mockConversations.find((conversation) => conversation.contact.id === followUp.contact.id),
        )
        .filter((conversation) => conversation !== undefined)
        .slice(0, 3),
    [],
  )

  const newCount = mockConversations.filter((conversation) => conversation.status === 'NEW').length
  const activeCount = mockConversations.filter(
    (conversation) => conversation.status === 'IN_PROGRESS',
  ).length
  const resolvedCount = mockConversations.filter(
    (conversation) => conversation.status === 'RESOLVED',
  ).length

  return (
    <div className="rp-page">
      <section className="rp-page-header">
        <div>
          <p className="rp-section-label">Vue d'ensemble</p>
          <h1 className="rp-page-title">Tableau de bord messagerie</h1>
          <p className="rp-page-subtitle">
            Un espace plus dense pour prioriser les conversations, les relances et les actions à faire.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden text-right md:block">
            <p className="text-[11px] uppercase tracking-[0.12em] text-[color:var(--text-muted)]">
              Aujourd'hui
            </p>
            <p className="mt-1 text-sm font-medium text-[color:var(--text-primary)]">{getTodayLabel()}</p>
          </div>
          <Link href="/inbox">
            <Button>
              Ouvrir l'inbox
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </Link>
        </div>
      </section>

      <section className="rp-kpi-grid">
        <article className="rp-kpi-card">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="rp-section-label">Nouveaux messages</p>
              <p className="mt-3 text-3xl font-semibold text-[color:var(--text-primary)]">{newCount}</p>
            </div>
            <Badge status="NEW" />
          </div>
          <p className="mt-4 text-sm text-[color:var(--text-secondary)]">
            Conversations entrantes à traiter en priorité ce matin.
          </p>
        </article>

        <article className="rp-kpi-card">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="rp-section-label">Relances planifiées</p>
              <p className="mt-3 text-3xl font-semibold text-[color:var(--text-primary)]">
                {mockFollowUps.length}
              </p>
            </div>
            <Badge status="FOLLOW_UP" />
          </div>
          <p className="mt-4 text-sm text-[color:var(--text-secondary)]">
            Suivis à reprendre sans perdre le contexte client.
          </p>
        </article>

        <article className="rp-kpi-card">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="rp-section-label">Conversations actives</p>
              <p className="mt-3 text-3xl font-semibold text-[color:var(--text-primary)]">{activeCount}</p>
            </div>
            <Badge status="IN_PROGRESS" />
          </div>
          <p className="mt-4 text-sm text-[color:var(--text-secondary)]">
            Discussions en cours avec attente de réponse ou devis.
          </p>
        </article>

        <article className="rp-kpi-card">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="rp-section-label">Dossiers résolus</p>
              <p className="mt-3 text-3xl font-semibold text-[color:var(--text-primary)]">{resolvedCount}</p>
            </div>
            <Badge status="RESOLVED" />
          </div>
          <p className="mt-4 text-sm text-[color:var(--text-secondary)]">
            Conversations closes proprement, avec suivi terminé.
          </p>
        </article>
      </section>

      {!dismissed ? (
        <section className="rp-banner">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-[4px] bg-[color:var(--brand-primary-soft)] text-[color:var(--brand)]">
              <BellRing className="h-4 w-4" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-[color:var(--text-primary)]">
                  Reprise du flux nocturne
                </p>
                <Badge tone="brand" variant="5 nouveaux messages" />
              </div>
              <p className="mt-2 text-sm text-[color:var(--text-secondary)]">
                Deux demandes de rendez-vous et une relance urgente demandent une réponse rapide depuis l'inbox.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/inbox">
              <Button variant="secondary">Voir l'inbox</Button>
            </Link>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="inline-flex h-10 items-center rounded-[4px] px-3 text-sm font-medium text-[color:var(--text-secondary)] transition-colors duration-200 hover:text-[color:var(--text-primary)]"
            >
              Masquer
            </button>
          </div>
        </section>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <article className="rp-panel overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-[color:var(--surface-border)] px-4 py-4">
            <div>
              <p className="rp-section-label">Relances prioritaires</p>
              <h2 className="mt-1 text-sm font-semibold text-[color:var(--text-primary)]">
                Conversations à reprendre
              </h2>
            </div>
            <Sparkles className="h-4 w-4 text-[color:var(--text-muted)]" aria-hidden="true" />
          </div>
          <div className="space-y-1 p-2">
            {followUpConversations.map((conversation) => (
              <ConversationCard
                key={conversation.id}
                conversation={conversation}
                isSelected={false}
                onClick={() => undefined}
              />
            ))}
          </div>
        </article>

        <article className="rp-panel overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-[color:var(--surface-border)] px-4 py-4">
            <div>
              <p className="rp-section-label">Activité récente</p>
              <h2 className="mt-1 text-sm font-semibold text-[color:var(--text-primary)]">
                Derniers échanges visibles
              </h2>
            </div>
            <Link href="/inbox" className="text-xs font-medium text-[color:var(--brand)]">
              Ouvrir
            </Link>
          </div>
          <div className="space-y-1 p-2">
            {mockConversations.slice(0, 4).map((conversation) => (
              <ConversationCard
                key={conversation.id}
                conversation={conversation}
                isSelected={false}
                onClick={() => undefined}
              />
            ))}
          </div>
        </article>
      </section>
    </div>
  )
}
