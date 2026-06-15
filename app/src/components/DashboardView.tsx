'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Filter,
  MessageSquare,
  Send,
  Share2,
  Sparkles,
  TriangleAlert,
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

const channels = [
  { name: 'WhatsApp', color: 'green', icon: 'whatsapp' },
  { name: 'Instagram', color: 'pink', icon: 'instagram' },
  { name: 'Messenger', color: 'indigo', icon: 'messenger' },
]

function WhatsAppIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7.2 19.4 3.8 20.5l1.1-3.3A8.2 8.2 0 1 1 7.2 19.4Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M9.1 8.1c.2-.5.4-.5.8-.5h.5c.2 0 .4.1.5.4l.8 1.8c.1.3.1.5-.1.7l-.5.6c-.1.2-.2.4 0 .6.5.9 1.3 1.7 2.3 2.2.2.1.4.1.6-.1l.7-.8c.2-.2.4-.2.7-.1l1.7.8c.3.1.4.3.4.6 0 .7-.5 1.4-1.1 1.6-.8.3-2.5.1-4.5-1.1-2.2-1.4-3.6-3.7-3.9-4.8-.2-.8.2-1.5.5-1.9Z"
        fill="currentColor"
      />
    </svg>
  )
}

function MessengerIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 4C7.2 4 3.5 7.4 3.5 11.8c0 2.5 1.2 4.7 3.2 6.1v2.7l2.9-1.6c.8.2 1.6.4 2.4.4 4.8 0 8.5-3.4 8.5-7.6S16.8 4 12 4Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="m7.9 13 2.7-2.8 2.3 2.1 3.2-3.2-2.8 4.7-2.3-2.1L7.9 13Z" fill="currentColor" />
    </svg>
  )
}

function InstagramIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4.5" y="4.5" width="15" height="15" rx="4.5" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="3.3" stroke="currentColor" strokeWidth="2" />
      <circle cx="16.7" cy="7.4" r="1.1" fill="currentColor" />
    </svg>
  )
}

function ChannelIcon({ name, size = 14 }: { name: string; size?: number }) {
  if (name === 'whatsapp') return <WhatsAppIcon size={size} />
  if (name === 'instagram') return <InstagramIcon size={size} />
  return <MessengerIcon size={size} />
}

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
        <Sparkles size={18} aria-hidden="true" />
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
      <Sparkles size={16} aria-hidden="true" />
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

  const recommendation = overdueCount > 0
    ? {
        title: `${overdueCount} relance${overdueCount > 1 ? 's' : ''} à reprendre en priorité`,
        text: "Ouvrez les relances pour réduire le temps d'attente et garder un suivi clair.",
        href: '/followups',
        action: 'Ouvrir les relances',
      }
    : stats.newCount + stats.activeCount + stats.followUpCount === 0
      ? {
          title: 'Votre espace de suivi est prêt.',
          text: 'Connectez WhatsApp, Instagram ou Facebook pour centraliser vos premières conversations.',
          href: '/settings',
          action: 'Configurer la boîte',
        }
      : {
          title: 'Votre boîte est sous contrôle.',
          text: 'Consultez les conversations récentes pour garder un rythme de réponse régulier.',
          href: '/inbox',
          action: 'Voir la boîte',
        }

  const summaryCards = [
    {
      label: 'À traiter maintenant',
      value: stats.newCount,
      context: stats.newCount > 0 ? `${stats.newCount} conversation${stats.newCount > 1 ? 's' : ''} non lue${stats.newCount > 1 ? 's' : ''}` : 'Aucune urgence',
      href: '/inbox',
      action: 'Voir la boîte',
      tone: 'blue',
      icon: MessageSquare,
    },
    {
      label: 'Relances à risque',
      value: stats.followUpCount,
      context: overdueCount > 0 ? `Dont ${overdueCount} en retard` : 'Aucune relance en retard',
      href: '/followups',
      action: 'Ouvrir les relances',
      tone: 'orange',
      icon: TriangleAlert,
    },
    {
      label: 'IA & automatisation',
      value: '-',
      context: 'Données IA indisponibles',
      href: '/settings',
      action: "Voir l'aperçu",
      tone: 'purple',
      icon: Sparkles,
    },
    {
      label: 'Canaux connectés',
      value: '0/3',
      context: 'Configuration à terminer',
      href: '/settings',
      action: 'Gérer les canaux',
      tone: 'green',
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
              <div className={`nx-summary-icon is-${card.tone}`}>
                <Icon size={21} aria-hidden="true" />
              </div>
              <div>
                <p className="nx-summary-label">{card.label}</p>
                <strong>{card.value}</strong>
                <span className={`nx-summary-context is-${card.tone}`}>{card.context}</span>
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
              <CompactEmptyState text="L'activité apparaîtra ici dès que vos canaux recevront des messages." />
            )}
          </div>
          {recentConversations.length ? (
            <Link href="/inbox" className="nx-panel-link">
              Voir toute l'activité
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          ) : null}
        </section>

        <aside className="nx-side-stack">
          <section className="nx-panel">
            <div className="nx-panel-header">
              <h2>Configuration des canaux</h2>
              <Link href="/settings">Tout gérer</Link>
            </div>
            <div className="nx-channel-list">
              {channels.map((channel) => (
                <Link href="/settings" key={channel.name} className="nx-channel-row">
                  <span className={`nx-channel-icon is-${channel.color}`}>
                    <ChannelIcon name={channel.icon} size={14} />
                  </span>
                  <span>
                    <strong>{channel.name}</strong>
                  </span>
                  <em>À configurer</em>
                  <ChevronRight size={14} aria-hidden="true" />
                </Link>
              ))}
            </div>
          </section>

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

            <section className="nx-panel nx-mini-recommendation">
              <div className="nx-panel-header">
                <h2>Recommandation du jour</h2>
              </div>
              <div className="nx-mini-recommendation-body">
                <h3>{recommendation.title}</h3>
                <p>{recommendation.text}</p>
                <Link href={recommendation.href}>
                  {recommendation.action}
                  <ArrowRight size={14} aria-hidden="true" />
                </Link>
              </div>
            </section>
          </div>
        </aside>
      </div>
    </div>
  )
}
