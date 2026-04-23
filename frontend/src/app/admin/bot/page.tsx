'use client'

import { useState, useEffect } from 'react'
import { groupNoRuleEvents } from '@/lib/admin'

const C = {
  bg: '#ffffff',
  bgAlt: '#f4f7fb',
  blue: '#1a6bff',
  blueLight: '#e8f0ff',
  ink: '#0d1b2e',
  mid: '#5a6a80',
  border: '#e2e8f0',
}

type BotEvent = {
  id: string
  eventType: string
  channel: string | null
  message: string | null
  ruleMatched: string | null
  wasHandled: boolean
  createdAt: string
  businessId: string | null
  business: { id: string; name: string } | null
}

const CHANNEL_ICONS: Record<string, string> = {
  WHATSAPP: '📱',
  INSTAGRAM: '📸',
  FACEBOOK: '👤',
}

export default function BotMonitorPage() {
  const [events, setEvents] = useState<BotEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [businessFilter, setBusinessFilter] = useState('')
  const [noRuleOnly, setNoRuleOnly] = useState(false)
  const [botOnline, setBotOnline] = useState<boolean | null>(null)
  const [restarting, setRestarting] = useState(false)

  useEffect(() => {
    fetch('/api/admin/bot/events')
      .then(r => r.json())
      .then(data => { setEvents(data); setLoading(false) })

    fetch('http://127.0.0.1:3001/health', { cache: 'no-store' })
      .then(r => setBotOnline(r.ok))
      .catch(() => setBotOnline(false))
  }, [])

  async function handleRestart() {
    if (!confirm('Redémarrer le bot ?')) return
    setRestarting(true)
    await fetch('/api/admin/bot/restart', { method: 'POST' })
    setRestarting(false)
    setBotOnline(null)
    setTimeout(() => {
      fetch('http://127.0.0.1:3001/health', { cache: 'no-store' })
        .then(r => setBotOnline(r.ok))
        .catch(() => setBotOnline(false))
    }, 3000)
  }

  const businesses = Array.from(
    new Map(events.filter(e => e.business).map(e => [e.business!.id, e.business!.name])).entries()
  ).map(([id, name]) => ({ id, name }))

  const filtered = events.filter(e => {
    if (businessFilter && e.businessId !== businessFilter) return false
    if (noRuleOnly && e.ruleMatched !== null) return false
    return true
  })

  const noRuleGroups = groupNoRuleEvents(events)

  return (
    <div style={{ padding: '2rem', background: C.bgAlt, minHeight: '100vh', color: C.ink }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>
        Monitoring Bot
      </h1>

      {/* Bot status card */}
      <div style={{
        background: C.bg,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        padding: '1.25rem 1.5rem',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
          <span style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: botOnline === null ? '#f59e0b' : botOnline ? '#22c55e' : '#ef4444',
            display: 'inline-block',
          }} />
          <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>
            Statut bot :&nbsp;
            <span style={{ color: botOnline === null ? '#f59e0b' : botOnline ? '#22c55e' : '#ef4444' }}>
              {botOnline === null ? 'Vérification…' : botOnline ? 'En ligne' : 'Hors ligne'}
            </span>
          </span>
        </div>
        <button
          onClick={handleRestart}
          disabled={restarting}
          style={{
            background: restarting ? C.mid : C.blue,
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '0.5rem 1.25rem',
            fontWeight: 600,
            fontSize: '0.875rem',
            cursor: restarting ? 'not-allowed' : 'pointer',
          }}
        >
          {restarting ? 'Redémarrage…' : 'Redémarrer le bot'}
        </button>
      </div>

      {/* Filters */}
      <div style={{
        background: C.bg,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        padding: '1rem 1.5rem',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1.5rem',
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.875rem', color: C.mid, fontWeight: 500 }}>Business :</label>
          <select
            value={businessFilter}
            onChange={e => setBusinessFilter(e.target.value)}
            style={{
              border: `1px solid ${C.border}`,
              borderRadius: 6,
              padding: '0.35rem 0.75rem',
              fontSize: '0.875rem',
              color: C.ink,
              background: C.bg,
            }}
          >
            <option value="">Tous</option>
            {businesses.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: C.mid, fontWeight: 500, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={noRuleOnly}
            onChange={e => setNoRuleOnly(e.target.checked)}
            style={{ width: 16, height: 16, cursor: 'pointer' }}
          />
          Sans règle uniquement
        </label>
        <span style={{ fontSize: '0.8rem', color: C.mid, marginLeft: 'auto' }}>
          {filtered.length} événement{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Events table */}
      <div style={{
        background: C.bg,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: '1.5rem',
      }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: C.mid }}>Chargement…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: C.mid }}>Aucun événement</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: C.bgAlt, borderBottom: `1px solid ${C.border}` }}>
                {['Horodatage', 'Business', 'Canal', 'Message', 'Règle', 'Traité'].map(h => (
                  <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: C.mid, whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((e, i) => (
                <tr
                  key={e.id}
                  style={{
                    borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : 'none',
                    background: i % 2 === 0 ? C.bg : C.bgAlt,
                  }}
                >
                  <td style={{ padding: '0.65rem 1rem', color: C.mid, whiteSpace: 'nowrap' }}>
                    {new Date(e.createdAt).toLocaleString('fr-FR')}
                  </td>
                  <td style={{ padding: '0.65rem 1rem' }}>
                    {e.business?.name ?? <span style={{ color: C.mid }}>—</span>}
                  </td>
                  <td style={{ padding: '0.65rem 1rem', fontSize: '1.1rem' }}>
                    {e.channel ? (CHANNEL_ICONS[e.channel] ?? e.channel) : <span style={{ color: C.mid }}>—</span>}
                  </td>
                  <td style={{ padding: '0.65rem 1rem', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {e.message ? e.message.slice(0, 50) : <span style={{ color: C.mid }}>—</span>}
                  </td>
                  <td style={{ padding: '0.65rem 1rem' }}>
                    {e.ruleMatched ? (
                      <span style={{
                        background: C.blueLight,
                        color: C.blue,
                        borderRadius: 6,
                        padding: '0.2rem 0.6rem',
                        fontSize: '0.8rem',
                        fontWeight: 500,
                      }}>
                        {e.ruleMatched}
                      </span>
                    ) : (
                      <span style={{
                        background: '#fee2e2',
                        color: '#ef4444',
                        borderRadius: 6,
                        padding: '0.2rem 0.6rem',
                        fontSize: '0.8rem',
                        fontWeight: 500,
                      }}>
                        Aucune règle
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '0.65rem 1rem', textAlign: 'center', fontSize: '1rem' }}>
                    {e.wasHandled ? (
                      <span style={{ color: '#22c55e' }}>✓</span>
                    ) : (
                      <span style={{ color: '#ef4444' }}>✗</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* No-rule groups section */}
      {noRuleGroups.length > 0 && (
        <div style={{
          background: C.bg,
          border: `1px solid ${C.border}`,
          borderRadius: 12,
          padding: '1.25rem 1.5rem',
        }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: C.ink }}>
            Messages sans règle associée
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {noRuleGroups.map((g, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.6rem 1rem',
                  background: C.bgAlt,
                  borderRadius: 8,
                  fontSize: '0.875rem',
                }}
              >
                <span style={{ color: C.ink, flex: 1, marginRight: '1rem' }}>
                  {g.message || <em style={{ color: C.mid }}>(vide)</em>}
                </span>
                <span style={{
                  background: '#fee2e2',
                  color: '#ef4444',
                  borderRadius: 20,
                  padding: '0.15rem 0.65rem',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  whiteSpace: 'nowrap',
                }}>
                  {g.count}×
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
