'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Workflow,
  ExternalLink,
  RefreshCw,
  Play,
  Pause,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Activity,
} from 'lucide-react'

// ─── Palette ──────────────────────────────────────────────────────────────────

const C = {
  bg: '#ffffff', bgAlt: '#f4f7fb', blue: '#1a6bff', blueLight: '#e8f0ff',
  ink: '#0d1b2e', mid: '#5a6a80', border: '#e2e8f0',
  green: '#16a34a', greenBg: '#dcfce7', red: '#dc2626', redBg: '#fee2e2',
  yellow: '#d97706', yellowBg: '#fef3c7',
}

// ─── Types ────────────────────────────────────────────────────────────────────

type N8nWorkflow = {
  id: string
  name: string
  active: boolean
  updatedAt: string
}

type N8nData = {
  serviceOnline: boolean
  latency: number | null
  workflows: N8nWorkflow[]
  stats: { total: number; active: number; inactive: number }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return iso
  }
}

// ─── Animation variants ───────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.28, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] },
  }),
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ online, latency }: { online: boolean; latency: number | null }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        background: online ? C.greenBg : C.redBg,
        color: online ? C.green : C.red,
        borderRadius: 99, padding: '4px 12px', fontSize: 12, fontWeight: 700,
      }}>
        <span style={{
          width: 7, height: 7, borderRadius: '50%',
          background: online ? C.green : C.red,
          display: 'inline-block',
        }} />
        {online ? 'En ligne' : 'Hors ligne'}
      </span>
      {latency !== null && (
        <span style={{ fontSize: 11, color: C.mid }}>{latency}ms</span>
      )}
    </div>
  )
}

function StatCard({ label, value, color, bg, icon: Icon }: {
  label: string
  value: number
  color: string
  bg: string
  icon: React.ElementType
}) {
  return (
    <div style={{
      background: bg,
      border: `1px solid ${color}20`,
      borderRadius: 12,
      padding: '16px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: 14,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 9,
        background: `${color}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon size={16} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 700, color, lineHeight: 1.1 }}>{value}</div>
        <div style={{ fontSize: 11, color: C.mid, marginTop: 2, fontWeight: 500 }}>{label}</div>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function N8nPanel() {
  const [data, setData] = useState<N8nData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  // Map of workflowId → 'activating' | 'deactivating' | null
  const [toggling, setToggling] = useState<Record<string, boolean>>({})

  const fetchData = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/n8n', { cache: 'no-store' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json() as N8nData
      setData(json)
      setLastUpdated(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  async function toggleWorkflow(id: string, currentActive: boolean) {
    if (!data?.serviceOnline) return
    setToggling(prev => ({ ...prev, [id]: true }))
    try {
      const res = await fetch(`/api/admin/n8n/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentActive }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      // Optimistically update local state
      setData(prev => {
        if (!prev) return prev
        const workflows = prev.workflows.map(wf =>
          wf.id === id ? { ...wf, active: !currentActive } : wf
        )
        const active = workflows.filter(wf => wf.active).length
        return {
          ...prev,
          workflows,
          stats: { total: workflows.length, active, inactive: workflows.length - active },
        }
      })
    } catch {
      // Silently fail — user can refresh
    } finally {
      setToggling(prev => ({ ...prev, [id]: false }))
    }
  }

  return (
    <div style={{ padding: '32px 36px', background: C.bgAlt, minHeight: '100vh' }}>

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 28, flexWrap: 'wrap', gap: 12,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 9,
              background: C.blueLight,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Workflow size={17} color={C.blue} />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: C.ink, margin: 0 }}>
              Workflows n8n
            </h1>
          </div>
          {lastUpdated && (
            <p style={{ fontSize: 12, color: C.mid, margin: 0 }}>
              Mis à jour à {lastUpdated.toLocaleTimeString('fr-FR')}
            </p>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Open n8n link */}
          <a
            href="https://n8n.repondly.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              background: C.blueLight, color: C.blue,
              border: `1px solid ${C.blue}30`,
              borderRadius: 8, padding: '8px 14px',
              fontSize: 13, fontWeight: 600, textDecoration: 'none',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLAnchorElement).style.background = C.blue
              ;(e.currentTarget as HTMLAnchorElement).style.color = '#fff'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLAnchorElement).style.background = C.blueLight
              ;(e.currentTarget as HTMLAnchorElement).style.color = C.blue
            }}
          >
            <ExternalLink size={13} />
            Ouvrir n8n
          </a>

          {/* Refresh button */}
          <button
            onClick={() => { void fetchData(true) }}
            disabled={refreshing || loading}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              background: C.bg, border: `1px solid ${C.border}`,
              borderRadius: 8, padding: '8px 14px',
              fontSize: 13, color: C.mid, cursor: 'pointer', fontWeight: 500,
              transition: 'all 0.15s',
              opacity: refreshing || loading ? 0.6 : 1,
            }}
            onMouseEnter={e => {
              if (!refreshing && !loading) {
                (e.currentTarget as HTMLButtonElement).style.borderColor = C.blue
                ;(e.currentTarget as HTMLButtonElement).style.color = C.blue
              }
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = C.border
              ;(e.currentTarget as HTMLButtonElement).style.color = C.mid
            }}
          >
            <RefreshCw
              size={13}
              style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }}
            />
            Actualiser les workflows
          </button>
        </div>
      </motion.div>

      {/* ── Loading ── */}
      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              minHeight: '40vh',
            }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              style={{
                width: 28, height: 28,
                border: `2px solid ${C.border}`,
                borderTopColor: C.blue,
                borderRadius: '50%',
              }}
            />
          </motion.div>
        )}

        {/* ── Error ── */}
        {!loading && error && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: C.redBg, border: `1px solid ${C.red}30`,
              borderRadius: 12, padding: '16px 20px',
              color: C.red, fontSize: 14,
            }}
          >
            <AlertCircle size={18} />
            <span>Impossible de charger les données n8n : <strong>{error}</strong></span>
          </motion.div>
        )}

        {/* ── Content ── */}
        {!loading && !error && data && (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
          >

            {/* ── Service health card ── */}
            <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show">
              <div style={{
                background: C.bg, border: `1px solid ${C.border}`,
                borderRadius: 14, padding: '20px 24px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                flexWrap: 'wrap', gap: 12,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 9,
                    background: data.serviceOnline ? C.greenBg : C.redBg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Activity size={16} color={data.serviceOnline ? C.green : C.red} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 4 }}>
                      Service n8n
                    </div>
                    <StatusBadge online={data.serviceOnline} latency={data.latency} />
                  </div>
                </div>

                {!data.serviceOnline && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    background: C.yellowBg, color: C.yellow,
                    border: `1px solid ${C.yellow}30`,
                    borderRadius: 8, padding: '7px 12px',
                    fontSize: 12, fontWeight: 600,
                  }}>
                    <AlertCircle size={13} />
                    Les contrôles sont désactivés — n8n est hors ligne
                  </div>
                )}
              </div>
            </motion.div>

            {/* ── Stats counters ── */}
            <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                <StatCard
                  label="Total"
                  value={data.stats.total}
                  color={C.blue}
                  bg={C.blueLight}
                  icon={Workflow}
                />
                <StatCard
                  label="Actifs"
                  value={data.stats.active}
                  color={C.green}
                  bg={C.greenBg}
                  icon={CheckCircle2}
                />
                <StatCard
                  label="Inactifs"
                  value={data.stats.inactive}
                  color={C.mid}
                  bg={C.bgAlt}
                  icon={XCircle}
                />
              </div>
            </motion.div>

            {/* ── Workflows list ── */}
            <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show">
              <div style={{
                background: C.bg, border: `1px solid ${C.border}`,
                borderRadius: 14, overflow: 'hidden',
              }}>
                {/* Table header */}
                <div style={{
                  padding: '14px 22px',
                  borderBottom: `1px solid ${C.border}`,
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <Workflow size={14} color={C.mid} />
                  <span style={{
                    fontSize: 11, fontWeight: 700, color: C.mid,
                    textTransform: 'uppercase', letterSpacing: '0.07em',
                  }}>
                    Workflows ({data.stats.total})
                  </span>
                </div>

                {data.workflows.length === 0 ? (
                  <div style={{
                    padding: '40px 24px', textAlign: 'center',
                    color: C.mid, fontSize: 14,
                  }}>
                    {data.serviceOnline
                      ? 'Aucun workflow trouvé.'
                      : 'Impossible de récupérer les workflows — service hors ligne.'}
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${C.border}`, background: C.bgAlt }}>
                        {['Nom', 'Statut', 'Dernière mise à jour', 'Actions'].map(h => (
                          <th
                            key={h}
                            style={{
                              padding: '9px 18px', textAlign: 'left',
                              fontSize: 11, fontWeight: 700, color: C.mid,
                              textTransform: 'uppercase', letterSpacing: '0.05em',
                            }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <AnimatePresence>
                        {data.workflows.map((wf, i) => (
                          <motion.tr
                            key={wf.id}
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.04, duration: 0.22 }}
                            style={{
                              borderBottom: i < data.workflows.length - 1
                                ? `1px solid ${C.border}`
                                : 'none',
                              transition: 'background 0.12s',
                            }}
                            onMouseEnter={e => {
                              (e.currentTarget as HTMLTableRowElement).style.background = C.bgAlt
                            }}
                            onMouseLeave={e => {
                              (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'
                            }}
                          >
                            {/* Name */}
                            <td style={{ padding: '13px 18px', fontWeight: 600, color: C.ink }}>
                              {wf.name}
                            </td>

                            {/* Status badge */}
                            <td style={{ padding: '13px 18px' }}>
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: 5,
                                background: wf.active ? C.greenBg : C.bgAlt,
                                color: wf.active ? C.green : C.mid,
                                border: `1px solid ${wf.active ? C.green : C.border}30`,
                                borderRadius: 99, padding: '3px 10px',
                                fontSize: 11, fontWeight: 700,
                              }}>
                                <span style={{
                                  width: 6, height: 6, borderRadius: '50%',
                                  background: wf.active ? C.green : C.mid,
                                  display: 'inline-block',
                                }} />
                                {wf.active ? 'Actif' : 'Inactif'}
                              </span>
                            </td>

                            {/* Last updated */}
                            <td style={{ padding: '13px 18px', color: C.mid, fontSize: 12 }}>
                              {formatDate(wf.updatedAt)}
                            </td>

                            {/* Toggle action */}
                            <td style={{ padding: '13px 18px' }}>
                              <button
                                onClick={() => { void toggleWorkflow(wf.id, wf.active) }}
                                disabled={!data.serviceOnline || toggling[wf.id]}
                                title={
                                  !data.serviceOnline
                                    ? 'n8n est hors ligne'
                                    : wf.active
                                    ? 'Désactiver ce workflow'
                                    : 'Activer ce workflow'
                                }
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: 6,
                                  background: wf.active ? C.redBg : C.greenBg,
                                  color: wf.active ? C.red : C.green,
                                  border: `1px solid ${wf.active ? C.red : C.green}30`,
                                  borderRadius: 7, padding: '6px 12px',
                                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                  transition: 'all 0.15s',
                                  opacity: !data.serviceOnline || toggling[wf.id] ? 0.5 : 1,
                                }}
                                onMouseEnter={e => {
                                  if (data.serviceOnline && !toggling[wf.id]) {
                                    const el = e.currentTarget as HTMLButtonElement
                                    el.style.opacity = '0.8'
                                  }
                                }}
                                onMouseLeave={e => {
                                  const el = e.currentTarget as HTMLButtonElement
                                  el.style.opacity = !data.serviceOnline || toggling[wf.id] ? '0.5' : '1'
                                }}
                              >
                                {toggling[wf.id] ? (
                                  <motion.span
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                                    style={{ display: 'inline-flex' }}
                                  >
                                    <RefreshCw size={11} />
                                  </motion.span>
                                ) : wf.active ? (
                                  <Pause size={11} />
                                ) : (
                                  <Play size={11} />
                                )}
                                {wf.active ? 'Désactiver' : 'Activer'}
                              </button>
                            </td>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                )}
              </div>
            </motion.div>

          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg) }
          to   { transform: rotate(360deg) }
        }
      `}</style>
    </div>
  )
}
