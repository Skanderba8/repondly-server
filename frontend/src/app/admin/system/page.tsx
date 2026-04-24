'use client'
/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw, Server, Database, Globe, Bot, Activity, HardDrive, Cpu, ShieldCheck } from 'lucide-react'

const C = {
  bg: '#ffffff', bgAlt: '#f4f7fb', blue: '#1a6bff', blueLight: '#e8f0ff',
  ink: '#0d1b2e', mid: '#5a6a80', border: '#e2e8f0',
  green: '#16a34a', greenBg: '#dcfce7', red: '#dc2626', redBg: '#fee2e2',
  yellow: '#d97706', yellowBg: '#fef3c7',
}

type ServiceStatus = { online: boolean; latency: number | null }
type Pm2Process = { name: string; status: string; cpu: number; memory: number; uptime: number | null }
type SystemData = {
  bot: ServiceStatus; app: ServiceStatus; n8n: ServiceStatus; database: { online: boolean }
  disk: { used: number; total: number; percent: number }
  memory: { used: number; total: number; percent: number }
  ssl: Record<string, number | null>; pm2: Pm2Process[]
}

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

function sslColor(days: number | null) {
  if (days === null) return C.mid
  if (days > 30) return C.green
  if (days > 7) return C.yellow
  return C.red
}

function sslBg(days: number | null) {
  if (days === null) return C.bgAlt
  if (days > 30) return C.greenBg
  if (days > 7) return C.yellowBg
  return C.redBg
}

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

function StatusBadge({ online }: { online: boolean }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: online ? C.greenBg : C.redBg,
      color: online ? C.green : C.red,
      borderRadius: 99, padding: '4px 11px', fontSize: 12, fontWeight: 700,
    }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: online ? C.green : C.red, display: 'inline-block' }} />
      {online ? 'En ligne' : 'Hors ligne'}
    </span>
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
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.3, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] } }),
}

export default function SystemPage() {
  const [data, setData] = useState<SystemData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  async function fetchData(showRefresh = false) {
    if (showRefresh) setRefreshing(true)
    const res = await fetch('/api/admin/system', { cache: 'no-store' })
    if (res.ok) { setData(await res.json()); setLastUpdated(new Date()) }
    setLoading(false); setRefreshing(false)
  }

  useEffect(() => {
    void fetchData()
    const interval = setInterval(() => { void fetchData() }, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{ padding: '32px 36px', background: C.bgAlt, minHeight: '100vh' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
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
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = C.blue; (e.currentTarget as HTMLButtonElement).style.color = C.blue }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = C.border; (e.currentTarget as HTMLButtonElement).style.color = C.mid }}
        >
          <RefreshCw size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          Actualiser
        </button>
      </motion.div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '40vh' }}>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            style={{ width: 28, height: 28, border: `2px solid ${C.border}`, borderTopColor: C.blue, borderRadius: '50%' }} />
        </div>
      ) : !data ? (
        <div style={{ color: C.red, fontSize: 14, textAlign: 'center', padding: 40 }}>Erreur de chargement.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Services */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            {[
              { label: 'Bot WhatsApp', icon: Bot, svc: data.bot },
              { label: 'app.repondly.com', icon: Globe, svc: data.app },
              { label: 'n8n.repondly.com', icon: Activity, svc: data.n8n },
              { label: 'Base de données', icon: Database, svc: data.database as ServiceStatus },
            ].map(({ label, icon: Icon, svc }, i) => (
              <motion.div key={label} custom={i} variants={fadeUp} initial="hidden" animate="show">
                <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, padding: '18px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: svc.online ? C.greenBg : C.redBg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon size={15} color={svc.online ? C.green : C.red} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: C.mid }}>{label}</span>
                  </div>
                  <StatusBadge online={svc.online} />
                  {'latency' in svc && svc.latency !== null && (
                    <div style={{ fontSize: 11, color: C.mid, marginTop: 8 }}>{svc.latency}ms latence</div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Resources */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {[
              { label: 'Disque', icon: HardDrive, pct: data.disk.percent, used: data.disk.used, total: data.disk.total },
              { label: 'Mémoire RAM', icon: Cpu, pct: data.memory.percent, used: data.memory.used, total: data.memory.total },
            ].map(({ label, icon: Icon, pct, used, total }, i) => (
              <motion.div key={label} custom={i + 4} variants={fadeUp} initial="hidden" animate="show">
                <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, padding: '20px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <Icon size={14} color={C.mid} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: C.mid, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontSize: 24, fontWeight: 700, color: pct >= 90 ? C.red : pct >= 70 ? C.yellow : C.ink }}>{pct}%</span>
                    <span style={{ fontSize: 12, color: C.mid }}>{formatBytes(used)} / {formatBytes(total)}</span>
                  </div>
                  <ProgressBar percent={pct} />
                </div>
              </motion.div>
            ))}
          </div>

          {/* PM2 */}
          {data.pm2.length > 0 && (
            <motion.div custom={6} variants={fadeUp} initial="hidden" animate="show">
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
                      <tr key={p.name} style={{ borderBottom: i < data.pm2.length - 1 ? `1px solid ${C.border}` : 'none', transition: 'background 0.12s' }}
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

          {/* SSL */}
          <motion.div custom={7} variants={fadeUp} initial="hidden" animate="show">
            <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <ShieldCheck size={14} color={C.mid} />
                <span style={{ fontSize: 11, fontWeight: 700, color: C.mid, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Certificats SSL</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {Object.entries(data.ssl).map(([domain, days]) => (
                  <div key={domain} style={{ background: sslBg(days), borderRadius: 10, padding: '14px 16px', border: `1px solid ${sslColor(days)}20` }}>
                    <div style={{ fontSize: 12, color: C.mid, marginBottom: 8, fontWeight: 500 }}>{domain}</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: sslColor(days) }}>
                      {days === null ? '—' : `${days}j`}
                    </div>
                    <div style={{ fontSize: 11, color: sslColor(days), marginTop: 3, fontWeight: 600 }}>
                      {days === null ? 'Introuvable' : days > 30 ? '✓ Valide' : days > 7 ? '⚠ Expire bientôt' : '✗ Critique'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
