'use client'
/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect } from 'react'

const C = {
  bg: '#ffffff',
  bgAlt: '#f4f7fb',
  blue: '#1a6bff',
  ink: '#0d1b2e',
  mid: '#5a6a80',
  border: '#e2e8f0',
}

type SystemData = {
  bot: { online: boolean }
  chatwoot: { online: boolean }
  database: { online: boolean }
  disk: { used: number; total: number; percent: number }
  memory: { used: number; total: number; percent: number }
  ssl: Record<string, number | null>
}

function formatBytes(bytes: number): string {
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`
  return `${bytes} B`
}

function sslColor(days: number | null): string {
  if (days === null) return '#94a3b8'
  if (days > 30) return '#22c55e'
  if (days > 7) return '#f59e0b'
  return '#ef4444'
}

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div style={{ background: '#e2e8f0', borderRadius: 4, height: 8, overflow: 'hidden', marginTop: 8 }}>
      <div style={{
        width: `${Math.min(percent, 100)}%`,
        height: '100%',
        background: C.blue,
        borderRadius: 4,
        transition: 'width 0.3s ease',
      }} />
    </div>
  )
}

function StatusDot({ online }: { online: boolean }) {
  return (
    <span style={{
      display: 'inline-block',
      width: 10,
      height: 10,
      borderRadius: '50%',
      background: online ? '#22c55e' : '#ef4444',
      marginRight: 8,
      flexShrink: 0,
    }} />
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: C.bg,
      border: `1px solid ${C.border}`,
      borderRadius: 12,
      padding: '20px 24px',
    }}>
      {children}
    </div>
  )
}

function CardLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 12, fontWeight: 600, color: C.mid, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
      {children}
    </div>
  )
}

export default function SystemPage() {
  const [data, setData] = useState<SystemData | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  async function fetchData() {
    const res = await fetch('/api/admin/system', { cache: 'no-store' })
    if (res.ok) {
      setData(await res.json())
      setLastUpdated(new Date())
    }
  }

  useEffect(() => {
    void fetchData()
    const interval = setInterval(() => { void fetchData() }, 30000)
    return () => clearInterval(interval)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ padding: '32px 40px', background: C.bgAlt, minHeight: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: C.ink, margin: 0 }}>Santé du système</h1>
        {lastUpdated && (
          <span style={{ fontSize: 13, color: C.mid }}>
            Mis à jour à {lastUpdated.toLocaleTimeString('fr-FR')}
          </span>
        )}
      </div>

      {!data ? (
        <div style={{ color: C.mid, fontSize: 14 }}>Chargement…</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {/* Bot */}
          <Card>
            <CardLabel>Bot</CardLabel>
            <div style={{ display: 'flex', alignItems: 'center', fontSize: 15, color: C.ink }}>
              <StatusDot online={data.bot.online} />
              {data.bot.online ? 'En ligne' : 'Hors ligne'}
            </div>
          </Card>

          {/* Chatwoot */}
          <Card>
            <CardLabel>Chatwoot</CardLabel>
            <div style={{ display: 'flex', alignItems: 'center', fontSize: 15, color: C.ink }}>
              <StatusDot online={data.chatwoot.online} />
              {data.chatwoot.online ? 'En ligne' : 'Hors ligne'}
            </div>
          </Card>

          {/* Database */}
          <Card>
            <CardLabel>Base de données</CardLabel>
            <div style={{ display: 'flex', alignItems: 'center', fontSize: 15, color: C.ink }}>
              <StatusDot online={data.database.online} />
              {data.database.online ? 'En ligne' : 'Hors ligne'}
            </div>
          </Card>

          {/* Disk */}
          <Card>
            <CardLabel>Disque</CardLabel>
            <div style={{ fontSize: 14, color: C.ink }}>
              {formatBytes(data.disk.used)} / {formatBytes(data.disk.total)} ({data.disk.percent}%)
            </div>
            <ProgressBar percent={data.disk.percent} />
          </Card>

          {/* Memory */}
          <Card>
            <CardLabel>Mémoire</CardLabel>
            <div style={{ fontSize: 14, color: C.ink }}>
              {formatBytes(data.memory.used)} / {formatBytes(data.memory.total)} ({data.memory.percent}%)
            </div>
            <ProgressBar percent={data.memory.percent} />
          </Card>

          {/* SSL certs */}
          {Object.entries(data.ssl).map(([domain, days]) => (
            <Card key={domain}>
              <CardLabel>SSL — {domain}</CardLabel>
              <div style={{ fontSize: 15, fontWeight: 600, color: sslColor(days) }}>
                {days === null ? 'Introuvable' : `${days} jour${days !== 1 ? 's' : ''} restant${days !== 1 ? 's' : ''}`}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
