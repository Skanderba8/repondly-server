'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Filter,
  MessageSquare,
  Send,
  Share2,
  Users,
} from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import type { DashboardStats } from '@/lib/dashboard'
import type { Conversation } from '@/types'

type DashboardViewProps = {
  stats: DashboardStats
  recentConversations: Conversation[]
  followUpConversations: Conversation[]
  userName?: string
}

type PriorityFilter = 'all' | 'urgent' | 'late' | 'hot'

function isOverdue(conversation: Conversation) {
  if (!conversation.followUpAt) return false
  return new Date(conversation.followUpAt).getTime() < Date.now()
}

function getContactName(conversation: Conversation) {
  return conversation.contact.name ?? conversation.contact.phone ?? conversation.contact.initials
}

function EmptyState() {
  return (
    <div className="nx-dashboard-empty">
      <div className="nx-dashboard-empty-icon">
        <MessageSquare size={18} aria-hidden="true" />
      </div>
      <h3>Aucune priorité pour le moment</h3>
      <p>Connectez vos canaux ou créez une relance pour commencer.</p>
      <div className="nx-empty-actions">
        <Link href="/settings" className="nx-btn nx-btn-primary">
          Connecter un canal
        </Link>
        <Link href="/followups" className="nx-btn nx-btn-secondary">
          Créer une relance
        </Link>
      </div>
    </div>
  )
}

function CompactEmptyState({ text }: { text: string }) {
  return (
    <div className="nx-compact-empty">
      <MessageSquare size={16} aria-hidden="true" />
      <p>{text}</p>
    </div>
  )
}

function PriorityRow({ conversation }: { conversation: Conversation }) {
  return (
    <Link href={`/inbox/${conversation.id}`} className="nx-priority-row">
      <div className="nx-priority-person">
        <Avatar initials={conversation.contact.initials} size="md" />
        <div>
          <p>{getContactName(conversation)}</p>
          <span>{conversation.intent}</span>
        </div>
      </div>
      <p className="nx-priority-message">{(conversation.summary ?? conversation.lastMessage) || 'Conversation sans message.'}</p>
      <div className="nx-priority-meta">
        <span>{conversation.time || '-'}</span>
        {isOverdue(conversation) ? <Badge variant="En retard" tone="warning" /> : null}
        {conversation.unread ? <Badge variant="Urgent" tone="danger" /> : null}
      </div>
    </Link>
  )
}

function ActivityRow({ conversation }: { conversation: Conversation }) {
  return (
    <Link href={`/inbox/${conversation.id}`} className="nx-activity-row">
      <Avatar initials={conversation.contact.initials} size="md" />
      <div>
        <p>
          <strong>{getContactName(conversation)}</strong> a envoyé un message
        </p>
        <span>{(conversation.summary ?? conversation.lastMessage) || 'Conversation sans message.'}</span>
      </div>
      <time>{conversation.time || '-'}</time>
    </Link>
  )
}

export function DashboardView({ stats, recentConversations, followUpConversations }: DashboardViewProps) {
  const [filter, setFilter] = useState<PriorityFilter>('all')

  const overdueCount = useMemo(() => followUpConversations.filter(isOverdue).length, [followUpConversations])
  const priorities = followUpConversations.length ? followUpConversations : recentConversations

  const filteredPriorities = useMemo(() => {
    if (filter === 'urgent') return priorities.filter((conversation) => conversation.unread || conversation.status === 'NEW')
    if (filter === 'late') return priorities.filter(isOverdue)
    if (filter === 'hot') return priorities.filter((conversation) => conversation.intent === 'PRIX' || conversation.intent === 'COMMANDE')
    return priorities
  }, [filter, priorities])

  const summaryCards = [
    {
      label: 'À traiter maintenant',
      value: stats.newCount,
      href: '/inbox',
      action: 'Voir la boîte',
      icon: MessageSquare,
    },
    {
      label: 'Relances à risque',
      value: stats.followUpCount,
      href: '/followups',
      action: 'Ouvrir les relances',
      icon: Clock3,
    },
    {
      label: 'IA & automatisation',
      value: '-',
      href: '/settings',
      action: "Voir l'aperçu",
      icon: Bot,
    },
    {
      label: 'Canaux connectés',
      value: '0/3',
      href: '/settings',
      action: 'Gérer les canaux',
      icon: Share2,
    },
  ]

  return (
    <div className="nx-dashboard">
      <section className="nx-summary-grid">
        {summaryCards.map((card) => {
          const Icon = card.icon
          return (
            <article key={card.label} className="nx-summary-card">
              <div className="nx-summary-icon">
                <Icon size={21} aria-hidden="true" />
              </div>
              <div>
                <p className="nx-summary-label">{card.label}</p>
                <strong>{card.value}</strong>
              </div>
              <Link href={card.href} className="nx-summary-action">
                {card.action}
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </article>
          )
        })}
      </section>

      <div className="nx-dashboard-grid">
        <section className="nx-panel nx-priorities-panel">
          <div className="nx-panel-header">
            <h2>Priorités du jour</h2>
            <button type="button" className="nx-icon-button" aria-label="Filtrer les priorités">
              <Filter size={16} aria-hidden="true" />
            </button>
          </div>
          <div className="nx-tab-row" role="tablist" aria-label="Filtres de priorités">
            {[
              ['all', 'Toutes'],
              ['urgent', 'Urgent'],
              ['late', 'En retard'],
              ['hot', 'Hot leads'],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={filter === key ? 'is-active' : undefined}
                onClick={() => setFilter(key as PriorityFilter)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="nx-priority-list">
            {filteredPriorities.length ? filteredPriorities.map((conversation) => (
              <PriorityRow key={conversation.id} conversation={conversation} />
            )) : <EmptyState />}
          </div>
          {filteredPriorities.length ? (
            <Link href="/inbox" className="nx-panel-link">
              Voir toutes les conversations
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          ) : null}
        </section>

        <section className="nx-panel nx-activity-panel">
          <div className="nx-panel-header">
            <h2>Activité récente</h2>
            <Link href="/inbox">Voir tout</Link>
          </div>
          <div className="nx-activity-list">
            {recentConversations.length ? recentConversations.map((conversation) => (
              <ActivityRow key={conversation.id} conversation={conversation} />
            )) : (
              <CompactEmptyState text="L&apos;activité apparaîtra ici dès que vos canaux recevront des messages." />
            )}
          </div>
          {recentConversations.length ? (
            <Link href="/inbox" className="nx-panel-link">
              Voir toute l&apos;activité
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          ) : null}
        </section>

        <aside className="nx-side-stack">
          <section className="nx-panel nx-score-panel">
            <div className="nx-panel-header">
              <h2>Score de réactivité</h2>
              <span>Depuis 7 jours</span>
            </div>
            <div className="nx-score-body">
              <div className="nx-score-ring">-</div>
              <div>
                <strong>Données en attente</strong>
                <p>Connectez un canal pour mesurer le temps de réponse moyen.</p>
                <span><CheckCircle2 size={14} aria-hidden="true" /> Objectif &lt; 30 min</span>
              </div>
            </div>
          </section>

          <div className="nx-mini-grid">
            <section className="nx-panel">
              <div className="nx-panel-header">
                <h2>Actions rapides</h2>
              </div>
              <div className="nx-action-list">
                <Link href="/followups"><Clock3 size={15} aria-hidden="true" />Créer une relance<ChevronRight size={14} /></Link>
                <Link href="/inbox"><Send size={15} aria-hidden="true" />Nouveau message<ChevronRight size={14} /></Link>
                <Link href="/contacts"><Users size={15} aria-hidden="true" />Ajouter un contact<ChevronRight size={14} /></Link>
                <Link href="/orders"><MessageSquare size={15} aria-hidden="true" />Voir les commandes<ChevronRight size={14} /></Link>
              </div>
            </section>

          </div>
        </aside>
      </div>
    </div>
  )
}
