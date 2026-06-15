'use client'

// Suppress missing type declarations for next/link in this environment
// @ts-ignore: module declaration missing
import Link from 'next/link'
import { ArrowRight, BellRing, Clock, Inbox, MessageSquare, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ConversationCard } from '@/components/ConversationCard'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/PageHeader'
import { mockConversations, mockFollowUps } from '@/lib/mock'

function getTodayLabel() {
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', weekday: 'long' }).format(new Date())
}

export default function DashboardHomePage() {
  const [dismissed, setDismissed] = useState(false)
  const followUpConversations = useMemo(
    () => mockFollowUps.map((followUp) => mockConversations.find((conversation) => conversation.contact.id === followUp.contact.id)).filter((conversation) => conversation !== undefined).slice(0, 3),
    [],
  )
  const newCount = mockConversations.filter((conversation) => conversation.status === 'NEW').length
  const activeCount = mockConversations.filter((conversation) => conversation.status === 'IN_PROGRESS').length
  const resolvedCount = mockConversations.filter((conversation) => conversation.status === 'RESOLVED').length

  return (
    <div className="rp-page">
      <PageHeader
        eyebrow="Vue d'ensemble"
        title="Tableau de bord"
        description="Une vue dense et calme pour prioriser les conversations, les relances et les décisions de la journée."
        actions={
          <>
            <div className="hidden text-right md:block">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--text-muted)]">Aujourd'hui</p>
              <p className="mt-1 text-sm font-medium text-[color:var(--text-primary)]">{getTodayLabel()}</p>
            </div>
            <Link href="/inbox" className="inline-flex h-9 items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-[color:var(--brand-primary)] bg-[color:var(--brand-primary)] px-3.5 text-[13px] font-semibold text-[color:var(--text-on-brand)] transition-colors duration-[var(--transition-fast)] hover:bg-[color:var(--brand-primary-hover)]">
              Ouvrir l'inbox
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </>
        }
      />

      <section className="rp-kpi-grid">
        {[
          { label: 'Nouveaux messages', value: newCount, text: 'Conversations entrantes à traiter en priorité.', icon: Inbox, badge: <Badge status="NEW" /> },
          { label: 'Relances', value: mockFollowUps.length, text: 'Suivis à reprendre sans perdre le contexte.', icon: Clock, badge: <Badge status="FOLLOW_UP" /> },
          { label: 'Actives', value: activeCount, text: 'Discussions en cours avec attente de réponse.', icon: MessageSquare, badge: <Badge status="IN_PROGRESS" /> },
          { label: 'Résolues', value: resolvedCount, text: 'Conversations closes proprement.', icon: Sparkles, badge: <Badge status="RESOLVED" /> },
        ].map((item) => {
          const Icon = item.icon
          return (
            <article key={item.label} className="rp-kpi-card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="rp-section-label">{item.label}</p>
                  <p className="mt-3 text-3xl font-semibold leading-none text-[color:var(--text-primary)]">{item.value}</p>
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] border border-[color:var(--surface-border)] bg-[color:var(--surface-1)] text-[color:var(--text-secondary)]">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between gap-2">
                <p className="text-[12.5px] leading-[1.45] text-[color:var(--text-secondary)]">{item.text}</p>
                {item.badge}
              </div>
            </article>
          )
        })}
      </section>

      {!dismissed ? (
        <section className="rp-banner">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border border-[color:var(--brand-primary-border)] bg-[color:var(--surface-0)] text-[color:var(--brand-primary)]">
              <BellRing className="h-4 w-4" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-[color:var(--text-primary)]">Reprise du flux nocturne</p>
                <Badge tone="brand" variant="5 nouveaux messages" />
              </div>
              <p className="mt-2 text-sm leading-[1.5] text-[color:var(--text-secondary)]">Deux demandes de rendez-vous et une relance urgente demandent une réponse rapide depuis l'inbox.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/inbox" className="inline-flex h-9 items-center rounded-[var(--radius-sm)] border border-[color:var(--surface-border)] bg-[color:var(--surface-0)] px-3 text-[13px] font-semibold text-[color:var(--text-primary)] transition-colors duration-[var(--transition-fast)] hover:bg-[color:var(--surface-2)]">Voir l'inbox</Link>
            <Button variant="ghost" onClick={() => setDismissed(true)}>Masquer</Button>
          </div>
        </section>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <article className="rp-panel overflow-hidden p-0">
          <div className="rp-panel-header">
            <div>
              <p className="rp-section-label">Relances prioritaires</p>
              <h2 className="mt-1 text-sm font-semibold text-[color:var(--text-primary)]">Conversations à reprendre</h2>
            </div>
            <Sparkles className="h-4 w-4 text-[color:var(--text-muted)]" aria-hidden="true" />
          </div>
          <div>
            {followUpConversations.map((conversation) => <ConversationCard key={conversation.id} conversation={conversation} isSelected={false} onClick={() => undefined} />)}
          </div>
        </article>

        <article className="rp-panel overflow-hidden p-0">
          <div className="rp-panel-header">
            <div>
              <p className="rp-section-label">Activité récente</p>
              <h2 className="mt-1 text-sm font-semibold text-[color:var(--text-primary)]">Derniers échanges visibles</h2>
            </div>
            <Link href="/inbox" className="text-xs font-semibold text-[color:var(--brand-primary)] hover:text-[color:var(--brand-primary-hover)]">Ouvrir</Link>
          </div>
          <div>
            {mockConversations.slice(0, 4).map((conversation) => <ConversationCard key={conversation.id} conversation={conversation} isSelected={false} onClick={() => undefined} />)}
          </div>
        </article>
      </section>
    </div>
  )
}
