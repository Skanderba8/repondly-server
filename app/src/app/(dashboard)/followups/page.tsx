'use client'

import { useMemo, useState } from 'react'
import { Check, Plus, Search } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { PageHeader } from '@/components/ui/PageHeader'
import { mockConversations, mockFollowUps } from '@/lib/mock'

type FollowUpFilter = 'ALL' | 'OVERDUE' | 'TODAY' | 'UPCOMING'
type FollowUpStatus = 'OVERDUE' | 'TODAY' | 'UPCOMING'

const filters: Array<{ id: FollowUpFilter; label: string }> = [
  { id: 'ALL', label: 'toutes' },
  { id: 'OVERDUE', label: 'En retard' },
  { id: 'TODAY', label: "Aujourd'hui" },
  { id: 'UPCOMING', label: 'À venir' },
]

function getDateKey(date: Date) { return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}` }
function getFollowUpStatus(dateValue: string, overdue: boolean, now: Date): FollowUpStatus {
  if (overdue) return 'OVERDUE'
  const date = new Date(dateValue)
  if (getDateKey(date) === getDateKey(now)) return 'TODAY'
  return 'UPCOMING'
}
function formatPlannedLabel(dateValue: string, now: Date) {
  const date = new Date(dateValue)
  const diffHours = Math.round((date.getTime() - now.getTime()) / (1000 * 60 * 60))
  if (diffHours > 0 && diffHours < 24) return `Dans ${diffHours} h`
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(date)
}
function getStatusBadge(status: FollowUpStatus) {
  if (status === 'OVERDUE') return <Badge variant="En retard" tone="danger" />
  if (status === 'TODAY') return <Badge variant="Aujourd'hui" tone="warning" />
  return <Badge variant="Planifiée" tone="success" />
}

export default function FollowupsPage() {
  const [completedIds, setCompletedIds] = useState<string[]>([])
  const [activeFilter, setActiveFilter] = useState<FollowUpFilter>('ALL')
  const [query, setQuery] = useState('')

  const rows = useMemo(() => {
    const now = new Date()
    const normalizedQuery = query.trim().toLowerCase()
    return mockFollowUps.filter((followUp) => !completedIds.includes(followUp.id)).map((followUp) => {
      const conversation = mockConversations.find((item) => item.contact.id === followUp.contact.id) ?? mockConversations[0]
      const status = getFollowUpStatus(followUp.followUpAt, followUp.overdue, now)
      return { followUp, conversation, status, plannedLabel: formatPlannedLabel(followUp.followUpAt, now) }
    }).filter((row) => {
      if (activeFilter !== 'ALL' && row.status !== activeFilter) return false
      if (!normalizedQuery) return true
      return [row.followUp.contact.name, row.followUp.contact.phone, row.followUp.intent, row.conversation.summary, row.conversation.lastMessage].join(' ').toLowerCase().includes(normalizedQuery)
    })
  }, [activeFilter, completedIds, query])

  const counts = useMemo(() => {
    const now = new Date()
    const visible = mockFollowUps.filter((followUp) => !completedIds.includes(followUp.id))
    return {
      ALL: visible.length,
      OVERDUE: visible.filter((item) => getFollowUpStatus(item.followUpAt, item.overdue, now) === 'OVERDUE').length,
      TODAY: visible.filter((item) => getFollowUpStatus(item.followUpAt, item.overdue, now) === 'TODAY').length,
      UPCOMING: visible.filter((item) => getFollowUpStatus(item.followUpAt, item.overdue, now) === 'UPCOMING').length,
    }
  }, [completedIds])

  return (
    <div className="rp-page">
      <PageHeader eyebrow="Suivi client" title="Relances" description="Gérez vos rappels prioritaires et gardez une visibilité nette sur les prochaines actions." actions={<Button className="w-full sm:w-auto"><Plus className="h-4 w-4" aria-hidden="true" />Nouvelle relance</Button>} />
      <section className="rp-panel overflow-hidden p-0">
        <div className="border-b border-[color:var(--surface-border)] px-4 py-3 md:px-5 md:py-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-2 overflow-x-auto">{filters.map((filter) => <button key={filter.id} type="button" onClick={() => setActiveFilter(filter.id)} className={activeFilter === filter.id ? 'rp-filter-chip is-active shrink-0' : 'rp-filter-chip shrink-0'}><span>{filter.label}</span><span className="rp-filter-chip-count">{counts[filter.id]}</span></button>)}</div>
            <div className="relative md:w-[320px]"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--text-muted)]" aria-hidden="true" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher une relance" className="pl-9" /></div>
          </div>
        </div>

        <div className="hidden md:block">
          <div className="rp-table-head grid-cols-[1.8fr_2.2fr_1fr_1fr_1fr_auto]"><span>Contact</span><span>Message</span><span>Statut</span><span>Prévue</span><span>Dernière act.</span><span /></div>
          <div>{rows.map(({ followUp, conversation, status, plannedLabel }) => <div key={followUp.id} className="rp-table-row grid-cols-[1.8fr_2.2fr_1fr_1fr_1fr_auto]"><div className="flex min-w-0 items-center gap-3"><div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] border border-[color:var(--brand-primary-border)] bg-[color:var(--brand-primary-soft)] text-[11px] font-semibold text-[color:var(--brand-primary)]">{followUp.contact.initials}</div><div className="min-w-0"><p className="truncate text-[13px] font-semibold text-[color:var(--text-primary)]">{followUp.contact.name}</p><p className="truncate text-[12px] text-[color:var(--text-muted)]">{followUp.contact.phone}</p></div></div><p className="truncate text-[13px] text-[color:var(--text-secondary)]">{conversation.summary ?? conversation.lastMessage}</p><div>{getStatusBadge(status)}</div><p className="text-[13px] text-[color:var(--text-secondary)]">{plannedLabel}</p><p className="text-[13px] text-[color:var(--text-secondary)]">{followUp.contact.lastSeen ?? 'N/A'}</p><Button variant="secondary" size="sm" onClick={() => setCompletedIds((current) => [...current, followUp.id])}>Marquer fait</Button></div>)}</div>
        </div>

        <div className="divide-y divide-[color:var(--surface-border)] md:hidden">
          {rows.map(({ followUp, conversation, status, plannedLabel }) => <div key={followUp.id} className="space-y-3 px-4 py-4"><div className="flex items-start justify-between gap-3"><div><p className="text-[13px] font-semibold text-[color:var(--text-primary)]">{followUp.contact.name}</p><p className="text-[12px] text-[color:var(--text-muted)]">{followUp.contact.phone}</p></div>{getStatusBadge(status)}</div><p className="text-[13px] leading-[1.5] text-[color:var(--text-secondary)]">{conversation.summary ?? conversation.lastMessage}</p><div className="flex items-center justify-between gap-3"><p className="text-[12px] text-[color:var(--text-muted)]">{plannedLabel}</p><button type="button" onClick={() => setCompletedIds((current) => [...current, followUp.id])} className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[color:var(--brand-primary)]"><Check className="h-3.5 w-3.5" aria-hidden="true" />Marquer fait</button></div></div>)}
        </div>
        {rows.length === 0 ? <EmptyState icon={<Check className="h-4 w-4" aria-hidden="true" />} title="Aucune relance visible" description="Essayez un autre filtre ou une autre recherche." /> : null}
      </section>
    </div>
  )
}
