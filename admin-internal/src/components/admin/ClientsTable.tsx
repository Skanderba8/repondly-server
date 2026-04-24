'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import type { Business } from '@prisma/client'
import { filterBusinesses } from '@/lib/admin'
import { Search, SlidersHorizontal, ArrowUpRight, ChevronUp, ChevronDown } from 'lucide-react'

const C = {
  bg: '#ffffff',
  bgAlt: '#f4f7fb',
  blue: '#1a6bff',
  blueLight: '#e8f0ff',
  ink: '#0d1b2e',
  mid: '#5a6a80',
  border: '#e2e8f0',
}

const PLAN_BADGE: Record<string, { bg: string; color: string }> = {
  FREE:     { bg: '#f1f5f9', color: '#5a6a80' },
  STARTER:  { bg: '#e2e8f0', color: '#475569' },
  PRO:      { bg: '#e8f0ff', color: '#1a6bff' },
  BUSINESS: { bg: '#0d1b2e', color: '#ffffff' },
}

const STATUS_BADGE: Record<string, { bg: string; color: string; dot: string }> = {
  TRIAL:         { bg: '#fff7ed', color: '#ea580c', dot: '#f97316' },
  ACTIVE:        { bg: '#f0fdf4', color: '#16a34a', dot: '#22c55e' },
  SUSPENDED:     { bg: '#fef2f2', color: '#dc2626', dot: '#ef4444' },
  SETUP_PENDING: { bg: '#fefce8', color: '#ca8a04', dot: '#eab308' },
}

const CHANNEL_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  WHATSAPP:  { bg: '#dcfce7', color: '#16a34a', label: 'WA' },
  INSTAGRAM: { bg: '#fce7f3', color: '#db2777', label: 'IG' },
  FACEBOOK:  { bg: '#dbeafe', color: '#2563eb', label: 'FB' },
}

function PlanBadge({ plan }: { plan: string }) {
  const s = PLAN_BADGE[plan] ?? { bg: '#f1f5f9', color: '#5a6a80' }
  return (
    <span style={{
      background: s.bg, color: s.color,
      padding: '3px 10px', borderRadius: 99,
      fontSize: 11, fontWeight: 700, letterSpacing: '0.03em',
    }}>
      {plan}
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_BADGE[status] ?? { bg: '#f1f5f9', color: '#5a6a80', dot: '#94a3b8' }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: s.bg, color: s.color,
      padding: '3px 10px', borderRadius: 99,
      fontSize: 11, fontWeight: 600,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, display: 'inline-block' }} />
      {status}
    </span>
  )
}

function ChannelTags({ channels }: { channels: string[] }) {
  if (!channels.length) return <span style={{ color: C.mid, fontSize: 12 }}>—</span>
  return (
    <span style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
      {channels.map(ch => {
        const s = CHANNEL_COLORS[ch] ?? { bg: '#f1f5f9', color: '#5a6a80', label: ch.slice(0, 2) }
        return (
          <span key={ch} title={ch} style={{
            background: s.bg, color: s.color,
            fontSize: 10, fontWeight: 700,
            padding: '2px 6px', borderRadius: 5,
          }}>
            {s.label}
          </span>
        )
      })}
    </span>
  )
}

function fmt(date: Date | null | undefined) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('fr-FR')
}

const PLANS = ['', 'FREE', 'STARTER', 'PRO', 'BUSINESS']
const STATUSES = ['', 'TRIAL', 'ACTIVE', 'SUSPENDED', 'SETUP_PENDING']

type SortKey = 'name' | 'plan' | 'status' | 'createdAt' | 'lastLoginAt'

export default function ClientsTable({ businesses }: { businesses: Business[] }) {
  const [query, setQuery] = useState('')
  const [planFilter, setPlanFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('createdAt')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const filtered = filterBusinesses(businesses, query, planFilter || undefined)
    .filter(b => !statusFilter || b.status === statusFilter)
    .sort((a, b) => {
      let av: string | number | Date | null = null
      let bv: string | number | Date | null = null
      if (sortKey === 'name') { av = a.name; bv = b.name }
      else if (sortKey === 'plan') { av = a.plan; bv = b.plan }
      else if (sortKey === 'status') { av = a.status; bv = b.status }
      else if (sortKey === 'createdAt') { av = a.createdAt; bv = b.createdAt }
      else if (sortKey === 'lastLoginAt') { av = a.lastLoginAt; bv = b.lastLoginAt }
      if (av === null) return 1
      if (bv === null) return -1
      const cmp = av < bv ? -1 : av > bv ? 1 : 0
      return sortDir === 'asc' ? cmp : -cmp
    })

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ChevronUp size={12} color={C.border} />
    return sortDir === 'asc' ? <ChevronUp size={12} color={C.blue} /> : <ChevronDown size={12} color={C.blue} />
  }

  const activeFilters = [planFilter, statusFilter].filter(Boolean).length

  return (
    <div>
      {/* Controls */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center' }}>
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', gap: 8,
          border: `1px solid ${C.border}`, borderRadius: 9, padding: '0 12px',
          background: C.bg, transition: 'border-color 0.15s, box-shadow 0.15s',
        }}
          onFocusCapture={e => {
            const el = e.currentTarget as HTMLDivElement
            el.style.borderColor = C.blue
            el.style.boxShadow = '0 0 0 3px rgba(26,107,255,0.1)'
          }}
          onBlurCapture={e => {
            const el = e.currentTarget as HTMLDivElement
            el.style.borderColor = C.border
            el.style.boxShadow = 'none'
          }}
        >
          <Search size={14} color={C.mid} />
          <input
            type="text"
            placeholder="Rechercher par nom ou email…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{
              flex: 1, border: 'none', outline: 'none',
              padding: '9px 0', fontSize: 13.5, color: C.ink,
              background: 'transparent',
            }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.mid, fontSize: 16, lineHeight: 1, padding: 0 }}
            >
              ×
            </button>
          )}
        </div>

        <button
          onClick={() => setShowFilters(f => !f)}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '9px 14px', borderRadius: 9,
            border: `1px solid ${showFilters || activeFilters > 0 ? C.blue : C.border}`,
            background: showFilters || activeFilters > 0 ? C.blueLight : C.bg,
            color: showFilters || activeFilters > 0 ? C.blue : C.mid,
            fontSize: 13, fontWeight: 500, cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          <SlidersHorizontal size={14} />
          Filtres
          {activeFilters > 0 && (
            <span style={{
              background: C.blue, color: '#fff',
              borderRadius: 99, fontSize: 10, fontWeight: 700,
              padding: '1px 6px', marginLeft: 2,
            }}>
              {activeFilters}
            </span>
          )}
        </button>
      </div>

      {/* Filter panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden', marginBottom: 12 }}
          >
            <div style={{
              display: 'flex', gap: 12, padding: '14px 16px',
              background: C.bg, border: `1px solid ${C.border}`,
              borderRadius: 10, alignItems: 'center', flexWrap: 'wrap',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.mid }}>Plan</label>
                <select
                  value={planFilter}
                  onChange={e => setPlanFilter(e.target.value)}
                  style={{
                    border: `1px solid ${C.border}`, borderRadius: 7,
                    padding: '6px 10px', fontSize: 13, color: C.ink,
                    background: C.bg, cursor: 'pointer', outline: 'none',
                  }}
                >
                  {PLANS.map(p => <option key={p} value={p}>{p || 'Tous'}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.mid }}>Statut</label>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  style={{
                    border: `1px solid ${C.border}`, borderRadius: 7,
                    padding: '6px 10px', fontSize: 13, color: C.ink,
                    background: C.bg, cursor: 'pointer', outline: 'none',
                  }}
                >
                  {STATUSES.map(s => <option key={s} value={s}>{s || 'Tous'}</option>)}
                </select>
              </div>
              {activeFilters > 0 && (
                <button
                  onClick={() => { setPlanFilter(''); setStatusFilter('') }}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 12, color: C.mid, textDecoration: 'underline',
                    marginLeft: 'auto',
                  }}
                >
                  Réinitialiser
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Count */}
      <div style={{ fontSize: 12, color: C.mid, marginBottom: 10, fontWeight: 500 }}>
        {filtered.length} client{filtered.length !== 1 ? 's' : ''}
        {(query || activeFilters > 0) && ` · filtré${filtered.length !== 1 ? 's' : ''}`}
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto', borderRadius: 12, border: `1px solid ${C.border}`, background: C.bg }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
          <thead>
            <tr style={{ background: C.bgAlt, borderBottom: `1px solid ${C.border}` }}>
              {[
                { label: 'Nom / Email', key: 'name' as SortKey },
                { label: 'Plan', key: 'plan' as SortKey },
                { label: 'Statut', key: 'status' as SortKey },
                { label: "Fin d'essai", key: null },
                { label: 'Canaux', key: null },
                { label: 'Dernière connexion', key: 'lastLoginAt' as SortKey },
                { label: '', key: null },
              ].map(h => (
                <th
                  key={h.label}
                  onClick={h.key ? () => toggleSort(h.key!) : undefined}
                  style={{
                    padding: '11px 16px', textAlign: 'left',
                    fontSize: 11, fontWeight: 700, color: C.mid,
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                    whiteSpace: 'nowrap',
                    cursor: h.key ? 'pointer' : 'default',
                    userSelect: 'none',
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    {h.label}
                    {h.key && <SortIcon col={h.key} />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: '40px 16px', textAlign: 'center', color: C.mid, fontSize: 14 }}>
                  Aucun client trouvé.
                </td>
              </tr>
            )}
            {filtered.map((b, i) => (
              <motion.tr
                key={b.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03, duration: 0.2 }}
                onMouseEnter={() => setHoveredId(b.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : 'none',
                  background: hoveredId === b.id ? C.bgAlt : C.bg,
                  transition: 'background 0.12s',
                }}
              >
                <td style={{ padding: '13px 16px' }}>
                  <div style={{ fontWeight: 600, color: C.ink }}>{b.name}</div>
                  <div style={{ color: C.mid, fontSize: 12, marginTop: 1 }}>{b.email}</div>
                </td>
                <td style={{ padding: '13px 16px' }}>
                  <PlanBadge plan={b.plan} />
                </td>
                <td style={{ padding: '13px 16px' }}>
                  <StatusBadge status={b.status} />
                </td>
                <td style={{ padding: '13px 16px', color: C.mid, fontSize: 13 }}>
                  {fmt(b.trialEndsAt)}
                </td>
                <td style={{ padding: '13px 16px' }}>
                  <ChannelTags channels={b.channels} />
                </td>
                <td style={{ padding: '13px 16px', color: C.mid, fontSize: 13 }}>
                  {fmt(b.lastLoginAt)}
                </td>
                <td style={{ padding: '13px 16px' }}>
                  <Link
                    href={`/admin/clients/${b.id}`}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      color: C.blue, fontWeight: 600, fontSize: 12,
                      textDecoration: 'none',
                      padding: '5px 12px',
                      border: `1px solid ${C.blueLight}`,
                      borderRadius: 7,
                      background: C.blueLight,
                      transition: 'background 0.15s, border-color 0.15s',
                    }}
                    onMouseEnter={e => {
                      const el = e.currentTarget as HTMLAnchorElement
                      el.style.background = C.blue
                      el.style.color = '#fff'
                      el.style.borderColor = C.blue
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget as HTMLAnchorElement
                      el.style.background = C.blueLight
                      el.style.color = C.blue
                      el.style.borderColor = C.blueLight
                    }}
                  >
                    Voir <ArrowUpRight size={12} />
                  </Link>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
