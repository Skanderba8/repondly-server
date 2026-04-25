'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Activity,
  Users,
  MessageCircle,
  Clock,
  Database,
  Link,
} from 'lucide-react'

// ─── Palette ──────────────────────────────────────────────────────────────────

const C = {
  bg: '#ffffff', bgAlt: '#f4f7fb', blue: '#1a6bff', blueLight: '#e8f0ff',
  ink: '#0d1b2e', mid: '#5a6a80', border: '#e2e8f0',
  green: '#16a34a', greenBg: '#dcfce7', red: '#dc2626', redBg: '#fee2e2',
  yellow: '#d97706', yellowBg: '#fef3c7',
  purple: '#7c3aed', purpleBg: '#ede9fe',
  teal: '#0d9488', tealBg: '#ccfbf1',
}

// ─── Types ────────────────────────────────────────────────────────────────────

type ChatwootData = {
  serviceOnline: boolean
  latency: number | null
  openConversations: number
  pendingConversations: number
  onlineAgents: number
  linkedClients: number
  dbStats: {
    totalConversations: number
    totalContacts: number
    totalMessages: number
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

export default function ChatwootPanel() {
  const [data, setData] = useState<ChatwootData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchData = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/chatwoot', { cache: 'no-store' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json() as ChatwootData
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

  const isOffline = data ? !data.serviceOnline : false

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
              <MessageSquare size={17} color={C.blue} />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: C.ink, margin: 0 }}>
              Chatwoot
            </h1>
          </div>
          {lastUpdated && (
            <p style={{ fontSize: 12, color: C.mid, margin: 0 }}>
              Mis à jour à {lastUpdated.toLocaleTimeString('fr-FR')}
            </p>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Open Chatwoot link */}
          <a
            href="https://inbox.repondly.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-disabled={isOffline}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              background: isOffline ? C.bgAlt : C.blueLight,
              color: isOffline ? C.mid : C.blue,
              border: `1px solid ${isOffline ? C.border : `${C.blue}30`}`,
              borderRadius: 8, padding: '8px 14px',
              fontSize: 13, fontWeight: 600, textDecoration: 'none',
              transition: 'all 0.15s',
              pointerEvents: isOffline ? 'none' : 'auto',
              opacity: isOffline ? 0.5 : 1,
            }}
            onMouseEnter={e => {
              if (!isOffline) {
                (e.currentTarget as HTMLAnchorElement).style.background = C.blue
                ;(e.currentTarget as HTMLAnchorElement).style.color = '#fff'
              }
            }}
            onMouseLeave={e => {
              if (!isOffline) {
                (e.currentTarget as HTMLAnchorElement).style.background = C.blueLight
                ;(e.currentTarget as HTMLAnchorElement).style.color = C.blue
              }
            }}
          >
            <ExternalLink size={13} />
            Ouvrir Chatwoot
          </a>

          {/* Refresh button */}
          <button
            onClick={() => { void fetchData(true) }}
            disabled={refreshing || loading || isOffline}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              background: C.bg, border: `1px solid ${C.border}`,
              borderRadius: 8, padding: '8px 14px',
              fontSize: 13, color: C.mid, cursor: isOffline ? 'not-allowed' : 'pointer',
              fontWeight: 500, transition: 'all 0.15s',
              opacity: refreshing || loading || isOffline ? 0.6 : 1,
            }}
            onMouseEnter={e => {
              if (!refreshing && !loading && !isOffline) {
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
            Actualiser
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
            <span>Impossible de charger les données Chatwoot : <strong>{error}</strong></span>
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
                      Service Chatwoot
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
                    Les contrôles sont désactivés — Chatwoot est hors ligne
                  </div>
                )}
              </div>
            </motion.div>

            {/* ── Live stats ── */}
            <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
                <StatCard
                  label="Conversations ouvertes"
                  value={data.openConversations}
                  color={C.green}
                  bg={C.greenBg}
                  icon={MessageCircle}
                />
                <StatCard
                  label="En attente"
                  value={data.pendingConversations}
                  color={C.yellow}
                  bg={C.yellowBg}
                  icon={Clock}
                />
                <StatCard
                  label="Agents en ligne"
                  value={data.onlineAgents}
                  color={C.blue}
                  bg={C.blueLight}
                  icon={Users}
                />
                <StatCard
                  label="Clients liés"
                  value={data.linkedClients}
                  color={C.purple}
                  bg={C.purpleBg}
                  icon={Link}
                />
              </div>
            </motion.div>

            {/* ── DB stats ── */}
            <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show">
              <div style={{
                background: C.bg, border: `1px solid ${C.border}`,
                borderRadius: 14, overflow: 'hidden',
              }}>
                {/* Section header */}
                <div style={{
                  padding: '14px 22px',
                  borderBottom: `1px solid ${C.border}`,
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <Database size={14} color={C.mid} />
                  <span style={{
                    fontSize: 11, fontWeight: 700, color: C.mid,
                    textTransform: 'uppercase', letterSpacing: '0.07em',
                  }}>
                    Base de données Chatwoot
                  </span>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 0,
                }}>
                  {[
                    { label: 'Conversations totales', value: data.dbStats.totalConversations, color: C.teal, bg: C.tealBg, icon: MessageCircle },
                    { label: 'Contacts', value: data.dbStats.totalContacts, color: C.purple, bg: C.purpleBg, icon: Users },
                    { label: 'Messages', value: data.dbStats.totalMessages, color: C.blue, bg: C.blueLight, icon: MessageSquare },
                  ].map((item, i, arr) => (
                    <div
                      key={item.label}
                      style={{
                        padding: '20px 24px',
                        borderRight: i < arr.length - 1 ? `1px solid ${C.border}` : 'none',
                        display: 'flex', alignItems: 'center', gap: 14,
                      }}
                    >
                      <div style={{
                        width: 36, height: 36, borderRadius: 9,
                        background: item.bg,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <item.icon size={16} color={item.color} />
                      </div>
                      <div>
                        <div style={{ fontSize: 22, fontWeight: 700, color: item.color, lineHeight: 1.1 }}>
                          {item.value.toLocaleString('fr-FR')}
                        </div>
                        <div style={{ fontSize: 11, color: C.mid, marginTop: 2, fontWeight: 500 }}>
                          {item.label}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
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
