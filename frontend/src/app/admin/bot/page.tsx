'use client'
/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { groupNoRuleEvents } from '@/lib/admin'
import { RefreshCw, RotateCcw, Filter, CheckCircle, XCircle, Wifi, WifiOff } from 'lucide-react'

const C = {
  bg: '#ffffff', bgAlt: '#f4f7fb', blue: '#1a6bff', blueLight: '#e8f0ff',
  ink: '#0d1b2e', mid: '#5a6a80', border: '#e2e8f0',
  green: '#16a34a', greenBg: '#dcfce7', red: '#dc2626', redBg: '#fee2e2',
  yellow: '#d97706', yellowBg: '#fef3c7',
}

type BotEvent = {
  id: string; eventType: string; channel: string | null; message: string | null
  ruleMatched: string | null; wasHandled: boolean; createdAt: string
  businessId: string | null; business: { id: string; name: string } | null
}
type SystemStatus = { bot: { online: boolean; latency: number | null } }

const CHANNEL_META: Record<string, { label: string; bg: string; color: string }> = {
  WHATSAPP:  { label: 'WhatsApp', bg: '#dcfce7', color: '#16a34a' },
  INSTAGRAM: { label: 'Instagram', bg: '#fce7f3', color: '#db2777' },
  FACEBOOK:  { label: 'Facebook', bg: '#dbeafe', color: '#2563eb' },
}

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.3, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] } }),
}

export default function BotMonitorPage() {
  const [events, setEvents] = useState<BotEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [businessFilter, setBusinessFilter] = useState('')
  const [noRuleOnly, setNoRuleOnly] = useState(false)
  const [botStatus, setBotStatus] = useState<{ online: boolean; latency: number | null } | null>(null)
  const [restarting, setRestarting] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  async function fetchEvents(showRefresh = false) {
    if (showRefresh) setRefreshing(true)
    const r = await fetch('/api/admin/bot/events', { cache: 'no-store' })
    if (r.ok) setEvents(await r.json())
    setLoading(false); setRefreshing(false)
  }

  async function fetchStatus() {
    const r = await fetch('/api/admin/system', { cache: 'no-store' })
    if (r.ok) { const d: SystemStatus = await r.json(); setBotStatus(d.bot) }
  }

  useEffect(() => {
    void fetchEvents(); void fetchStatus()
    const interval = setInterval(() => { void fetchStatus() }, 30000)
    return () => clearInterval(interval)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleRestart() {
    if (!confirm('Redémarrer le bot ?')) return
    setRestarting(true); setBotStatus(null)
    await fetch('/api/admin/bot/restart', { method: 'POST' })
    await new Promise(r => setTimeout(r, 4000))
    await fetchStatus(); setRestarting(false)
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
  const handledCount = events.filter(e => e.wasHandled).length
  const noRuleCount = events.filter(e => e.ruleMatched === null).length
  const handledPct = events.length > 0 ? Math.round((handledCount / events.length) * 100) : 0

  const botOnline = botStatus?.online
  const botColor = restarting ? C.yellow : botStatus === null ? C.yellow : botOnline ? C.green : C.red
  const botBg = restarting ? C.yellowBg : botStatus === null ? C.yellowBg : botOnline ? C.greenBg : C.redBg

  return (
    <div style={{ padding: '32px 36px', background: C.bgAlt, minHeight: '100vh' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: C.ink, margin: 0 }}>Monitoring Bot</h1>
        <button
          onClick={() => { void fetchEvents(true) }}
          disabled={refreshing}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8,
            padding: '8px 14px', fontSize: 13, color: C.mid, cursor: 'pointer', fontWeight: 500,
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = C.blue; (e.currentTarget as HTMLButtonElement).style.color = C.blue }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = C.border; (e.currentTarget as HTMLButtonElement).style.color = C.mid }}
        >
          <RefreshCw size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          Actualiser
        </button>
      </motion.div>

      {/* Status + stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 14, marginBottom: 20 }}>
        {/* Bot status */}
        <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show">
          <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, padding: '18px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: botBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {botOnline ? <Wifi size={20} color={botColor} /> : <WifiOff size={20} color={botColor} />}
              </div>
              <div>
                <div style={{ fontSize: 11, color: C.mid, fontWeight: 600, marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bot WhatsApp</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: botColor }}>
                  {restarting ? 'Redémarrage…' : botStatus === null ? 'Vérification…' : botOnline ? 'En ligne' : 'Hors ligne'}
                </div>
                {botStatus?.latency !== null && botStatus?.latency !== undefined && (
                  <div style={{ fontSize: 11, color: C.mid }}>{botStatus.latency}ms</div>
                )}
              </div>
            </div>
            <button
              onClick={handleRestart}
              disabled={restarting}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: restarting ? C.bgAlt : C.ink, color: restarting ? C.mid : '#fff',
                border: 'none', borderRadius: 8, padding: '8px 14px',
                fontSize: 12, fontWeight: 600, cursor: restarting ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s',
              }}
            >
              <RotateCcw size={12} style={{ animation: restarting ? 'spin 1s linear infinite' : 'none' }} />
              Redémarrer
            </button>
          </div>
        </motion.div>

        {[
          { label: 'Événements', value: events.length, color: C.ink, sub: 'total' },
          { label: 'Traités', value: `${handledPct}%`, color: C.green, sub: `${handledCount} événements` },
          { label: 'Sans règle', value: noRuleCount, color: noRuleCount > 0 ? C.red : C.mid, sub: noRuleCount > 0 ? 'à traiter' : 'aucun' },
        ].map((s, i) => (
          <motion.div key={s.label} custom={i + 1} variants={fadeUp} initial="hidden" animate="show">
            <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, padding: '18px 22px' }}>
              <div style={{ fontSize: 11, color: C.mid, fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: C.mid, marginTop: 4 }}>{s.sub}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ marginBottom: 14 }}>
        <div style={{
          background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10,
          padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <button
            onClick={() => setShowFilters(f => !f)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: showFilters ? C.blueLight : 'transparent',
              border: `1px solid ${showFilters ? C.blue : C.border}`,
              borderRadius: 7, padding: '5px 10px',
              fontSize: 12, color: showFilters ? C.blue : C.mid,
              cursor: 'pointer', fontWeight: 500, transition: 'all 0.15s',
            }}
          >
            <Filter size={12} /> Filtres
          </button>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                style={{ display: 'flex', alignItems: 'center', gap: 12, overflow: 'hidden' }}
              >
                <select
                  value={businessFilter}
                  onChange={e => setBusinessFilter(e.target.value)}
                  style={{ border: `1px solid ${C.border}`, borderRadius: 7, padding: '5px 10px', fontSize: 13, color: C.ink, background: C.bg, outline: 'none' }}
                >
                  <option value="">Tous les business</option>
                  {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: C.mid, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  <input type="checkbox" checked={noRuleOnly} onChange={e => setNoRuleOnly(e.target.checked)} style={{ width: 14, height: 14, cursor: 'pointer', accentColor: C.blue }} />
                  Sans règle uniquement
                </label>
              </motion.div>
            )}
          </AnimatePresence>

          <span style={{ fontSize: 12, color: C.mid, marginLeft: 'auto', fontWeight: 500 }}>
            {filtered.length} événement{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Events table */}
      <motion.div custom={4} variants={fadeUp} initial="hidden" animate="show"
        style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: C.mid, fontSize: 14 }}>Chargement…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: C.mid, fontSize: 14 }}>Aucun événement</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: C.bgAlt, borderBottom: `1px solid ${C.border}` }}>
                {['Horodatage', 'Business', 'Canal', 'Message', 'Règle', 'Traité'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: C.mid, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((e, i) => (
                <tr key={e.id} style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : 'none', transition: 'background 0.12s' }}
                  onMouseEnter={ev => { (ev.currentTarget as HTMLTableRowElement).style.background = C.bgAlt }}
                  onMouseLeave={ev => { (ev.currentTarget as HTMLTableRowElement).style.background = 'transparent' }}
                >
                  <td style={{ padding: '10px 14px', color: C.mid, whiteSpace: 'nowrap', fontSize: 12 }}>
                    {new Date(e.createdAt).toLocaleString('fr-FR')}
                  </td>
                  <td style={{ padding: '10px 14px', fontWeight: 600, color: C.ink }}>
                    {e.business?.name ?? <span style={{ color: C.mid }}>—</span>}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    {e.channel ? (() => {
                      const m = CHANNEL_META[e.channel] ?? { label: e.channel, bg: C.bgAlt, color: C.mid }
                      return (
                        <span style={{ fontSize: 11, fontWeight: 700, background: m.bg, color: m.color, padding: '2px 8px', borderRadius: 99 }}>
                          {m.label}
                        </span>
                      )
                    })() : <span style={{ color: C.mid }}>—</span>}
                  </td>
                  <td style={{ padding: '10px 14px', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: C.ink }}>
                    {e.message ? e.message.slice(0, 60) : <span style={{ color: C.mid }}>—</span>}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    {e.ruleMatched ? (
                      <span style={{ background: C.blueLight, color: C.blue, borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
                        {e.ruleMatched}
                      </span>
                    ) : (
                      <span style={{ background: C.redBg, color: C.red, borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
                        Aucune
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                    {e.wasHandled
                      ? <CheckCircle size={16} color={C.green} />
                      : <XCircle size={16} color={C.red} />
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </motion.div>

      {/* No-rule groups */}
      <AnimatePresence>
        {noRuleGroups.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}
          >
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: C.red, display: 'inline-block' }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>Messages sans règle associée</span>
              <span style={{ fontSize: 11, fontWeight: 600, background: C.redBg, color: C.red, padding: '1px 7px', borderRadius: 99 }}>
                {noRuleGroups.length}
              </span>
            </div>
            <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {noRuleGroups.map((g, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '9px 14px', background: C.bgAlt, borderRadius: 8, fontSize: 13,
                }}>
                  <span style={{ color: C.ink, flex: 1, marginRight: 16 }}>
                    {g.message || <em style={{ color: C.mid }}>(vide)</em>}
                  </span>
                  <span style={{ background: C.redBg, color: C.red, borderRadius: 99, padding: '2px 10px', fontWeight: 700, fontSize: 12, whiteSpace: 'nowrap' }}>
                    {g.count}×
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
