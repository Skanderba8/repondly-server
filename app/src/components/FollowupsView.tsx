'use client'

import { useMemo, useState } from 'react'
import { Check, Plus, Search } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import type { FollowUp } from '@/types'

type FollowUpFilter = 'ALL' | 'OVERDUE' | 'TODAY' | 'UPCOMING'
type FollowUpStatus = 'OVERDUE' | 'TODAY' | 'UPCOMING'

const filters: Array<{ id: FollowUpFilter; label: string }> = [
  { id: 'ALL', label: 'Toutes' },
  { id: 'OVERDUE', label: 'En retard' },
  { id: 'TODAY', label: "Aujourd'hui" },
  { id: 'UPCOMING', label: 'A venir' },
]

const columns = '1.6fr 1fr 1fr auto'

function getDateKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

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
  return <Badge variant="Planifiee" tone="success" />
}

type FollowupsViewProps = {
  followUps: FollowUp[]
}

export function FollowupsView({ followUps }: FollowupsViewProps) {
  const [rowsState, setRowsState] = useState(followUps)
  const [activeFilter, setActiveFilter] = useState<FollowUpFilter>('ALL')
  const [query, setQuery] = useState('')
  const [pendingId, setPendingId] = useState<string | null>(null)

  async function handleComplete(id: string) {
    setPendingId(id)

    try {
      const response = await fetch(`/api/followups/${id}/complete`, {
        method: 'POST',
      })

      if (!response.ok) {
        return
      }

      setRowsState((current) => current.filter((followUp) => followUp.id !== id))
    } finally {
      setPendingId(null)
    }
  }

  const rows = useMemo(() => {
    const now = new Date()
    const normalizedQuery = query.trim().toLowerCase()

    return rowsState
      .map((followUp) => ({
        followUp,
        status: getFollowUpStatus(followUp.followUpAt, followUp.overdue, now),
        plannedLabel: formatPlannedLabel(followUp.followUpAt, now),
      }))
      .filter((row) => {
        if (activeFilter !== 'ALL' && row.status !== activeFilter) return false
        if (!normalizedQuery) return true

        return [row.followUp.contact.name, row.followUp.contact.phone, row.followUp.intent]
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery)
      })
  }, [activeFilter, query, rowsState])

  const counts = useMemo(() => {
    const now = new Date()

    return {
      ALL: rowsState.length,
      OVERDUE: rowsState.filter((item) => getFollowUpStatus(item.followUpAt, item.overdue, now) === 'OVERDUE').length,
      TODAY: rowsState.filter((item) => getFollowUpStatus(item.followUpAt, item.overdue, now) === 'TODAY').length,
      UPCOMING: rowsState.filter((item) => getFollowUpStatus(item.followUpAt, item.overdue, now) === 'UPCOMING').length,
    }
  }, [rowsState])

  return (
    <div className="nx-page">
      <header className="nx-page-header">
        <button type="button" className="nx-btn nx-btn-primary ml-auto">
          <Plus size={16} aria-hidden="true" />
          Nouvelle relance
        </button>
      </header>

      <section className="nx-card">
        <div style={{ padding: 20, borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'space-between' }}>
            <div className="nx-no-scrollbar" style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
              {filters.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setActiveFilter(filter.id)}
                  className={activeFilter === filter.id ? 'nx-filter-chip is-active' : 'nx-filter-chip'}
                >
                  <span>{filter.label}</span>
                  <span>{counts[filter.id]}</span>
                </button>
              ))}
            </div>

            <label className="nx-input" style={{ display: 'flex', alignItems: 'center', gap: 8, maxWidth: 320 }}>
              <Search size={16} aria-hidden="true" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Rechercher une relance"
                aria-label="Rechercher une relance"
                style={{ border: 0, background: 'transparent', width: '100%' }}
              />
            </label>
          </div>
        </div>

        {rows.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <div className="nx-table-head" style={{ gridTemplateColumns: columns }}>
              <span>Contact</span>
              <span>Intent</span>
              <span>Date prevue</span>
              <span>Action</span>
            </div>
            {rows.map(({ followUp, status, plannedLabel }) => (
              <div key={followUp.id} className="nx-table-row" style={{ gridTemplateColumns: columns }}>
                <div className="nx-table-cell" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Avatar initials={followUp.contact.initials} size="sm" />
                  <div style={{ overflow: 'hidden' }}>
                    <div>{followUp.contact.name ?? followUp.contact.phone ?? followUp.contact.initials}</div>
                    <div>{followUp.contact.phone ?? 'Non renseigne'}</div>
                  </div>
                </div>
                <div className="nx-table-cell" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Badge intent={followUp.intent} />
                  {getStatusBadge(status)}
                </div>
                <span className="nx-table-cell">{plannedLabel}</span>
                <button
                  type="button"
                  className="nx-btn nx-btn-secondary"
                  onClick={() => void handleComplete(followUp.id)}
                  disabled={pendingId === followUp.id}
                >
                  <Check size={14} aria-hidden="true" />
                  Marquer fait
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="nx-empty">
            <div className="nx-empty-icon">
              <Check size={16} aria-hidden="true" />
            </div>
            <p className="nx-card-title">Aucune relance visible</p>
            <p className="nx-page-sub">Essayez un autre filtre ou une autre recherche.</p>
          </div>
        )}
      </section>
    </div>
  )
}
