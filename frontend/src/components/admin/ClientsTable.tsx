'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Business } from '@prisma/client'
import { filterBusinesses } from '@/lib/admin'

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
  STARTER:  { bg: '#e2e8f0', color: '#5a6a80' },
  PRO:      { bg: '#e8f0ff', color: '#1a6bff' },
  BUSINESS: { bg: '#0d1b2e', color: '#ffffff' },
}

const STATUS_BADGE: Record<string, { bg: string; color: string }> = {
  TRIAL:         { bg: '#fff7ed', color: '#ea580c' },
  ACTIVE:        { bg: '#f0fdf4', color: '#16a34a' },
  SUSPENDED:     { bg: '#fef2f2', color: '#dc2626' },
  SETUP_PENDING: { bg: '#fefce8', color: '#ca8a04' },
}

const CHANNEL_COLORS: Record<string, string> = {
  WHATSAPP:  '#22c55e',
  INSTAGRAM: '#ec4899',
  FACEBOOK:  '#3b82f6',
}

function PlanBadge({ plan }: { plan: string }) {
  const s = PLAN_BADGE[plan] ?? { bg: '#f1f5f9', color: '#5a6a80' }
  return (
    <span style={{
      background: s.bg,
      color: s.color,
      padding: '2px 10px',
      borderRadius: 99,
      fontSize: 12,
      fontWeight: 600,
    }}>
      {plan}
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_BADGE[status] ?? { bg: '#f1f5f9', color: '#5a6a80' }
  return (
    <span style={{
      background: s.bg,
      color: s.color,
      padding: '2px 10px',
      borderRadius: 99,
      fontSize: 12,
      fontWeight: 600,
    }}>
      {status}
    </span>
  )
}

function ChannelDots({ channels }: { channels: string[] }) {
  return (
    <span style={{ display: 'flex', gap: 4 }}>
      {channels.map(ch => (
        <span
          key={ch}
          title={ch}
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: CHANNEL_COLORS[ch] ?? '#cbd5e1',
            display: 'inline-block',
          }}
        />
      ))}
    </span>
  )
}

function fmt(date: Date | null | undefined) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('fr-FR')
}

const PLANS = ['', 'FREE', 'STARTER', 'PRO', 'BUSINESS']

export default function ClientsTable({ businesses }: { businesses: Business[] }) {
  const [query, setQuery] = useState('')
  const [planFilter, setPlanFilter] = useState('')
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const filtered = filterBusinesses(businesses, query, planFilter || undefined)

  return (
    <div>
      {/* Controls */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Rechercher par nom ou email…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={{
            flex: 1,
            padding: '8px 12px',
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            fontSize: 14,
            color: C.ink,
            outline: 'none',
          }}
        />
        <select
          value={planFilter}
          onChange={e => setPlanFilter(e.target.value)}
          style={{
            padding: '8px 12px',
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            fontSize: 14,
            color: C.ink,
            background: C.bg,
            cursor: 'pointer',
          }}
        >
          {PLANS.map(p => (
            <option key={p} value={p}>{p || 'Tous les plans'}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto', borderRadius: 12, border: `1px solid ${C.border}` }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: C.bgAlt, borderBottom: `1px solid ${C.border}` }}>
              {['Nom / Email', 'Plan', 'Statut', "Fin d'essai", 'Canaux', 'Dernière connexion', 'Actions'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: C.mid, whiteSpace: 'nowrap' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: '24px 16px', textAlign: 'center', color: C.mid }}>
                  Aucun client trouvé.
                </td>
              </tr>
            )}
            {filtered.map(b => (
              <tr
                key={b.id}
                onMouseEnter={() => setHoveredId(b.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  borderBottom: `1px solid ${C.border}`,
                  background: hoveredId === b.id ? C.bgAlt : C.bg,
                  transition: 'background 0.15s',
                }}
              >
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ fontWeight: 600, color: C.ink }}>{b.name}</div>
                  <div style={{ color: C.mid, fontSize: 12 }}>{b.email}</div>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <PlanBadge plan={b.plan} />
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <StatusBadge status={b.status} />
                </td>
                <td style={{ padding: '12px 16px', color: C.mid }}>
                  {fmt(b.trialEndsAt)}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <ChannelDots channels={b.channels} />
                </td>
                <td style={{ padding: '12px 16px', color: C.mid }}>
                  {fmt(b.lastLoginAt)}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <Link
                    href={`/admin/clients/${b.id}`}
                    style={{
                      color: C.blue,
                      fontWeight: 600,
                      fontSize: 13,
                      textDecoration: 'none',
                      padding: '4px 12px',
                      border: `1px solid ${C.blue}`,
                      borderRadius: 6,
                    }}
                  >
                    Voir
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
