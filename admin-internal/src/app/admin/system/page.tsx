'use client'
/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  RefreshCw, Server, Database, Globe, Bot, Activity,
  HardDrive, Cpu, ShieldCheck, Megaphone, LayoutDashboard,
  MessageSquare, Workflow,
} from 'lucide-react'
import RoutingMap from '@/components/admin/RoutingMap'
import { getMetricColor, sslColor as sslColorLevel } from '@/lib/system-utils'

// ─── Palette ──────────────────────────────────────────────────────────────────

const C = {
  bg: '#ffffff', bgAlt: '#f4f7fb', blue: '#1a6bff', blueLight: '#e8f0ff',
  ink: '#0d1b2e', mid: '#5a6a80', border: '#e2e8f0',
  green: '#16a34a', greenBg: '#dcfce7', red: '#dc2626', redBg: '#fee2e2',
  yellow: '#d97706', yellowBg: '#fef3c7',
}

// ─── Types ────────────────────────────────────────────────────────────────────

type ServiceStatus  = { online: boolean; latency: number | null }
type DbStatus       = { connected: boolean; latency: number | null }
type Pm2Process     = { name: string; status: string; cpu: number; memory: number; uptime: number | null }

type SystemData = {
  services: {
    bot:        ServiceStatus
    app:        ServiceStatus
    n8n:        ServiceStatus
    chatwoot:   ServiceStatus
    marketing:  ServiceStatus
    dashboard:  ServiceStatus
    prismaDb:   DbStatus
    chatwootDb: DbStatus
    redis:      DbStatus
  }
  disk:   { used: number; total: number; percent: number }
  memory: { used: number; total: number; percent: number }
  ssl:    Record<string, number | null>
  pm2:    Pm2Process[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`
  return `${bytes} B`
}

function formatUptime(ms: number | null): string {
  if (ms === null) return '—'
  const s = Math.floor((Date.now() - ms) / 1000)
  if (s < 60) return `${s}s`
  if (s < 3600) return `${Math.floor(s / 60)}m`
  if (s < 86400) return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`
  return `${Math.floor(s / 86400)}j ${Math.floor((s % 86400) / 3600)}h`
}

/** Resolve a service entry (HTTP or DB/Redis) to a simple online boolean. */
function resolveOnline(svc: ServiceStatus | DbStatus): boolean {
  if ('online' in svc) return svc.online
  return svc.connected
}

/** Resolve latency from either service shape. */
function resolveLatency(svc: ServiceStatus | DbStatus): number | null {
  return svc.latency
}

function sslColorHex(days: number | null): string {
  if (days === null) return C.mid
  const level = sslColorLevel(days)
  if (level === 'green') return C.green
  if (level === 'yellow') return C.yellow
  return C.red
}

function sslBgHex(days: number | null): string {
  if (days === null) return C.bgAlt
  const level = sslColorLevel(days)
  if (level === 'green') return C.greenBg
  if (level === 'yellow') return C.yellowBg
  return C.redBg
}

function metricColorHex(pct: number): string {
  const level = getMetricColor(pct)
  if (level === 'red') return C.red
  if (level === 'yellow') return C.yellow
  return C.blue
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProgressBar({ percent, warn = 70, danger = 90 }: { percent: number; warn?: number; danger?: number }) {
  const color = percent >= danger ? C.red : percent >= warn ? C.yellow : C.blue
  return (
    <div style={{ background: C.border, borderRadius: 99, height: 8, overflow: 'hidden', marginTop: 10 }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(percent, 100)}%` }}
        transition={{ duration: 0.7, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
        style={{ height: '100%', background: color, borderRadius: 99 }}
      />
    </div>
  )
}

function StatusBadge({ online, latency }: { online: boolean; latency?: number | null }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        background: online ? C.greenBg : C.redBg,
        color: online ? C.green : C.red,
        borderRadius: 99, padding: '4px 11px', fontSize: 12, fontWeight: 700,
      }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: online ? C.green : C.red, display: 'inline-block' }} />
        {online ? 'En ligne' : 'Hors ligne'}
      </span>
      {latency !== null && latency !== undefined && (
        <span style={{ fontSize: 11, color: C.mid }}>{latency}ms</span>
      )}
    </div>
  )
}

function Pm2Badge({ status }: { status: string }) {
  const online = status === 'online'
  const color = online ? C.green : status === 'stopped' ? C.mid : C.red
  const bg = online ? C.greenBg : status === 'stopped' ? C.bgAlt : C.redBg
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: bg, color, borderRadius: 99, padding: '3px 10px', fontSize: 12, fontWeight: 700 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, display: 'inline-block' }} />
      {status}
    </span>
  )
}

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.07, duration: 0.3, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] },
  }),
}

// ─── Service card definitions ─────────────────────────────────────────────────

type ServiceCardDef = {
  label: string
  icon: React.ElementType
  key: keyof SystemData['services']
}

const SERVICE_CARDS: ServiceCardDef[] = [
  { label: 'Marketing',          icon: Megaphone,       key: 'marketing'  },
  { label: 'Dashboard',          icon: LayoutDashboard, key: 'dashboard'  },
  { label: 'Admin (app)',        icon: Globe,           key: 'app'        },
  { label: 'Bot WhatsApp',       icon: Bot,             key: 'bot'        },
  { label: 'Chatwoot',           icon: MessageSquare,   key: 'chatwoot'   },
  { label: 'n8n',                icon: Workflow,        key: 'n8n'        },
  { label: 'Prisma DB',          icon: Database,        key: 'prismaDb'   },
  { label: 'Chatwoot DB',        icon: Database,        key: 'chatwootDb' },
  { label: 'Redis',              icon: Activity,        key: 'redis'      },
]

// ─── Page component ───────────────────────────────────────────────────────────

export default function SystemPage() {
  const [data, setData] = useState<SystemData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  async function fetchData(showRefresh = false) {
    if (showRefresh) setRefreshing(true)
    try {
      const res = await fetch('/api/admin/system', { cache: 'no-store' })
      if (res.ok) {
        setData(await res.json())
        setLastUpdated(new Date())
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    void fetchData()
    const interval = setInterval(() => { void fetchData() }, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{ padding: '32px 36px', background: C.bgAlt, minHeight: '100vh' }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}
      >
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: C.ink, margin: 0 }}>Santé du système</h1>
          {lastUpdated && (
            <p style={{ fontSize: 12, color: C.mid, margin: '4px 0 0' }}>
              Mis à jour à {lastUpdated.toLocaleTimeString('fr-FR')} · Actualisation auto toutes les 30s
            </p>
          )}
        </div>
        <button
          onClick={() => { void fetchData(true) }}
          disabled={refreshing}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8,
            padding: '8px 14px', fontSize: 13, color: C.mid, cursor: 'pointer', fontWeight: 500,
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = C.blue
            ;(e.currentTarget as HTMLButtonElement).style.color = C.blue
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = C.border
            ;(e.currentTarget as HTMLButtonElement).style.color = C.mid
          }}
        >
          <RefreshCw size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          Actualiser
        </button>
      </motion.div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '40vh' }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            style={{ width: 28, height: 28, border: `2px solid ${C.border}`, borderTopColor: C.blue, borderRadius: '50%' }}
          />
        </div>
      ) : !data ? (
        <div style={{ color: C.red, fontSize: 14, textAlign: 'center', padding: 40 }}>Erreur de chargement.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* ── Services (9 cards, 3-column grid) ── */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 14,
          }}>
            {SERVICE_CARDS.map(({ label, icon: Icon, key }, i) => {
              const svc = data.services[key]
              const online = resolveOnline(svc)
              const latency = resolveLatency(svc)
              return (
                <motion.div key={key} custom={i} variants={fadeUp} initial="hidden" animate="show">
                  <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, padding: '18px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: online ? C.greenBg : C.redBg,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Icon size={15} color={online ? C.green : C.red} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: C.mid }}>{label}</span>
                    </div>
                    <StatusBadge online={online} latency={latency} />
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* ── Resources ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {[
              { label: 'Disque',      icon: HardDrive, pct: data.disk.percent,   used: data.disk.used,   total: data.disk.total   },
              { label: 'Mémoire RAM', icon: Cpu,       pct: data.memory.percent, used: data.memory.used, total: data.memory.total },
            ].map(({ label, icon: Icon, pct, used, total }, i) => (
              <motion.div key={label} custom={i + SERVICE_CARDS.length} variants={fadeUp} initial="hidden" animate="show">
                <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, padding: '20px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <Icon size={14} color={C.mid} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: C.mid, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontSize: 24, fontWeight: 700, color: metricColorHex(pct) }}>{pct}%</span>
                    <span style={{ fontSize: 12, color: C.mid }}>{formatBytes(used)} / {formatBytes(total)}</span>
                  </div>
                  <ProgressBar percent={pct} />
                </div>
              </motion.div>
            ))}
          </div>

          {/* ── PM2 ── */}
          {data.pm2.length > 0 && (
            <motion.div custom={SERVICE_CARDS.length + 2} variants={fadeUp} initial="hidden" animate="show">
              <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ padding: '14px 22px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Server size={14} color={C.mid} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.mid, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Processus PM2</span>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${C.border}`, background: C.bgAlt }}>
                      {['Nom', 'Statut', 'CPU', 'Mémoire', 'Uptime'].map(h => (
                        <th key={h} style={{ padding: '9px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: C.mid, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.pm2.map((p, i) => (
                      <tr
                        key={p.name}
                        style={{ borderBottom: i < data.pm2.length - 1 ? `1px solid ${C.border}` : 'none', transition: 'background 0.12s' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = C.bgAlt }}
                        onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent' }}
                      >
                        <td style={{ padding: '11px 16px', fontWeight: 600, color: C.ink }}>{p.name}</td>
                        <td style={{ padding: '11px 16px' }}><Pm2Badge status={p.status} /></td>
                        <td style={{ padding: '11px 16px', color: p.cpu > 80 ? C.red : C.mid }}>{p.cpu}%</td>
                        <td style={{ padding: '11px 16px', color: C.mid }}>{formatBytes(p.memory)}</td>
                        <td style={{ padding: '11px 16px', color: C.mid }}>{formatUptime(p.uptime)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* ── SSL Certificates ── */}
          <motion.div custom={SERVICE_CARDS.length + 3} variants={fadeUp} initial="hidden" animate="show">
            <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <ShieldCheck size={14} color={C.mid} />
                <span style={{ fontSize: 11, fontWeight: 700, color: C.mid, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Certificats SSL</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {Object.entries(data.ssl).map(([domain, days]) => (
                  <div key={domain} style={{
                    background: sslBgHex(days),
                    borderRadius: 10,
                    padding: '14px 16px',
                    border: `1px solid ${sslColorHex(days)}20`,
                  }}>
                    <div style={{ fontSize: 12, color: C.mid, marginBottom: 8, fontWeight: 500 }}>{domain}</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: sslColorHex(days) }}>
                      {days === null ? '—' : `${days}j`}
                    </div>
                    <div style={{ fontSize: 11, color: sslColorHex(days), marginTop: 3, fontWeight: 600 }}>
                      {days === null ? 'Introuvable' : days > 30 ? '✓ Valide' : days > 7 ? '⚠ Expire bientôt' : '✗ Critique'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* ── Routing Map ── */}
          <motion.div custom={SERVICE_CARDS.length + 4} variants={fadeUp} initial="hidden" animate="show">
            <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, padding: '20px 24px' }}>
              <RoutingMap services={data.services} ssl={data.ssl} />
            </div>
          </motion.div>

        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
