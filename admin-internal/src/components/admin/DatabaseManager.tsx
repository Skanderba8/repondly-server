'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Database,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Activity,
  Table2,
  GitBranch,
  Play,
  HardDrive,
  MessageSquare,
  Users,
  Mail,
} from 'lucide-react'

// ─── Palette (same as N8nPanel) ───────────────────────────────────────────────

const C = {
  bg: '#ffffff', bgAlt: '#f4f7fb', blue: '#1a6bff', blueLight: '#e8f0ff',
  ink: '#0d1b2e', mid: '#5a6a80', border: '#e2e8f0',
  green: '#16a34a', greenBg: '#dcfce7', red: '#dc2626', redBg: '#fee2e2',
  yellow: '#d97706', yellowBg: '#fef3c7',
  purple: '#7c3aed', purpleBg: '#ede9fe',
}

// ─── Types ────────────────────────────────────────────────────────────────────

type TableStat = {
  tableName: string
  rowCount: number
  sizeBytes: number
}

type MigrationRecord = {
  name: string
  appliedAt: string | null
  status: 'applied' | 'pending'
}

type DatabaseStats = {
  prismaDb: {
    connected: boolean
    latency: number | null
    totalSizeMb: number
    tables: TableStat[]
    migrations: MigrationRecord[]
  }
  chatwootDb: {
    connected: boolean
    latency: number | null
    totalSizeMb: number
    conversations: number
    contacts: number
    messages: number
  }
}

type MigrateResult = {
  success: boolean
  output: string
  error?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
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

function StatusBadge({ connected, latency }: { connected: boolean; latency: number | null }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        background: connected ? C.greenBg : C.redBg,
        color: connected ? C.green : C.red,
        borderRadius: 99, padding: '4px 12px', fontSize: 12, fontWeight: 700,
      }}>
        <span style={{
          width: 7, height: 7, borderRadius: '50%',
          background: connected ? C.green : C.red,
          display: 'inline-block',
        }} />
        {connected ? 'Connectée' : 'Déconnectée'}
      </span>
      {latency !== null && (
        <span style={{ fontSize: 11, color: C.mid }}>{latency}ms</span>
      )}
    </div>
  )
}

function StatCard({ label, value, color, bg, icon: Icon }: {
  label: string
  value: string | number
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
        <div style={{ fontSize: 20, fontWeight: 700, color, lineHeight: 1.1 }}>{value}</div>
        <div style={{ fontSize: 11, color: C.mid, marginTop: 2, fontWeight: 500 }}>{label}</div>
      </div>
    </div>
  )
}

function SectionHeader({ icon: Icon, title, count }: {
  icon: React.ElementType
  title: string
  count?: number
}) {
  return (
    <div style={{
      padding: '14px 22px',
      borderBottom: `1px solid ${C.border}`,
      display: 'flex', alignItems: 'center', gap: 8,
    }}>
      <Icon size={14} color={C.mid} />
      <span style={{
        fontSize: 11, fontWeight: 700, color: C.mid,
        textTransform: 'uppercase', letterSpacing: '0.07em',
      }}>
        {title}{count !== undefined ? ` (${count})` : ''}
      </span>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function DatabaseManager() {
  const { data: session } = useSession()
  const userRole = (session?.user as { role?: 'SUPER_ADMIN' | 'ADMIN' } | undefined)?.role
  const isSuperAdmin = userRole === 'SUPER_ADMIN'

  const [data, setData] = useState<DatabaseStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // Migration state
  const [migrating, setMigrating] = useState(false)
  const [migrateResult, setMigrateResult] = useState<MigrateResult | null>(null)

  const fetchData = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/database', { cache: 'no-store' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json() as DatabaseStats
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

  async function handleMigrate() {
    setMigrating(true)
    setMigrateResult(null)
    try {
      const res = await fetch('/api/admin/database/migrate', { method: 'POST' })
      const json = await res.json() as MigrateResult
      setMigrateResult(json)
      if (json.success) {
        // Refresh stats after successful migration
        void fetchData(true)
      }
    } catch (err) {
      setMigrateResult({
        success: false,
        output: '',
        error: err instanceof Error ? err.message : 'Erreur inconnue',
      })
    } finally {
      setMigrating(false)
    }
  }

  const pendingMigrations = data?.prismaDb.migrations.filter(m => m.status === 'pending') ?? []

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
              <Database size={17} color={C.blue} />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: C.ink, margin: 0 }}>
              Base de données
            </h1>
          </div>
          {lastUpdated && (
            <p style={{ fontSize: 12, color: C.mid, margin: 0 }}>
              Mis à jour à {lastUpdated.toLocaleTimeString('fr-FR')}
            </p>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Migrate button — SUPER_ADMIN only */}
          {isSuperAdmin && (
            <button
              onClick={() => { void handleMigrate() }}
              disabled={migrating || loading}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                background: pendingMigrations.length > 0 ? C.yellow : C.bgAlt,
                color: pendingMigrations.length > 0 ? '#fff' : C.mid,
                border: `1px solid ${pendingMigrations.length > 0 ? C.yellow : C.border}`,
                borderRadius: 8, padding: '8px 14px',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.15s',
                opacity: migrating || loading ? 0.6 : 1,
              }}
            >
              {migrating ? (
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                  style={{ display: 'inline-flex' }}
                >
                  <RefreshCw size={13} />
                </motion.span>
              ) : (
                <Play size={13} />
              )}
              {migrating ? 'Migration en cours…' : 'Appliquer les migrations'}
            </button>
          )}

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
            Actualiser les stats
          </button>
        </div>
      </motion.div>

      {/* ── Migration result banner ── */}
      <AnimatePresence>
        {migrateResult && (
          <motion.div
            key="migrate-result"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            style={{
              marginBottom: 18,
              background: migrateResult.success ? C.greenBg : C.redBg,
              border: `1px solid ${migrateResult.success ? C.green : C.red}30`,
              borderRadius: 12, padding: '14px 18px',
            }}
          >
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              color: migrateResult.success ? C.green : C.red,
              fontWeight: 700, fontSize: 13, marginBottom: migrateResult.output || migrateResult.error ? 8 : 0,
            }}>
              {migrateResult.success
                ? <CheckCircle2 size={15} />
                : <XCircle size={15} />}
              {migrateResult.success
                ? 'Migrations appliquées avec succès'
                : 'Échec de la migration'}
            </div>
            {(migrateResult.output || migrateResult.error) && (
              <pre style={{
                margin: 0,
                fontSize: 11,
                color: migrateResult.success ? C.green : C.red,
                background: `${migrateResult.success ? C.green : C.red}10`,
                borderRadius: 6, padding: '8px 12px',
                overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                maxHeight: 200, overflowY: 'auto',
              }}>
                {migrateResult.error ?? migrateResult.output}
              </pre>
            )}
          </motion.div>
        )}
      </AnimatePresence>

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
            <span>Impossible de charger les données : <strong>{error}</strong></span>
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

            {/* ── DB Connection cards ── */}
            <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

                {/* Prisma DB */}
                <div style={{
                  background: C.bg, border: `1px solid ${C.border}`,
                  borderRadius: 14, padding: '20px 24px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 9,
                      background: data.prismaDb.connected ? C.greenBg : C.redBg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Activity size={16} color={data.prismaDb.connected ? C.green : C.red} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 4 }}>
                        Prisma DB
                      </div>
                      <StatusBadge connected={data.prismaDb.connected} latency={data.prismaDb.latency} />
                    </div>
                  </div>
                  {data.prismaDb.connected && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      background: C.blueLight, borderRadius: 8, padding: '8px 12px',
                      fontSize: 12, color: C.blue, fontWeight: 600,
                    }}>
                      <HardDrive size={12} />
                      Taille totale : {data.prismaDb.totalSizeMb} MB
                    </div>
                  )}
                </div>

                {/* Chatwoot DB */}
                <div style={{
                  background: C.bg, border: `1px solid ${C.border}`,
                  borderRadius: 14, padding: '20px 24px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 9,
                      background: data.chatwootDb.connected ? C.greenBg : C.redBg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Activity size={16} color={data.chatwootDb.connected ? C.green : C.red} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 4 }}>
                        Chatwoot DB
                      </div>
                      <StatusBadge connected={data.chatwootDb.connected} latency={data.chatwootDb.latency} />
                    </div>
                  </div>
                  {data.chatwootDb.connected && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      background: C.blueLight, borderRadius: 8, padding: '8px 12px',
                      fontSize: 12, color: C.blue, fontWeight: 600,
                    }}>
                      <HardDrive size={12} />
                      Taille totale : {data.chatwootDb.totalSizeMb} MB
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* ── Chatwoot DB stats ── */}
            {data.chatwootDb.connected && (
              <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show">
                <div style={{
                  background: C.bg, border: `1px solid ${C.border}`,
                  borderRadius: 14, overflow: 'hidden',
                }}>
                  <SectionHeader icon={MessageSquare} title="Statistiques Chatwoot DB" />
                  <div style={{
                    padding: '16px 20px',
                    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12,
                  }}>
                    <StatCard
                      label="Conversations"
                      value={data.chatwootDb.conversations.toLocaleString('fr-FR')}
                      color={C.blue}
                      bg={C.blueLight}
                      icon={MessageSquare}
                    />
                    <StatCard
                      label="Contacts"
                      value={data.chatwootDb.contacts.toLocaleString('fr-FR')}
                      color={C.green}
                      bg={C.greenBg}
                      icon={Users}
                    />
                    <StatCard
                      label="Messages"
                      value={data.chatwootDb.messages.toLocaleString('fr-FR')}
                      color={C.purple}
                      bg={C.purpleBg}
                      icon={Mail}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Prisma DB tables ── */}
            {data.prismaDb.connected && (
              <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show">
                <div style={{
                  background: C.bg, border: `1px solid ${C.border}`,
                  borderRadius: 14, overflow: 'hidden',
                }}>
                  <SectionHeader icon={Table2} title="Tables Prisma DB" count={data.prismaDb.tables.length} />

                  {data.prismaDb.tables.length === 0 ? (
                    <div style={{ padding: '32px 24px', textAlign: 'center', color: C.mid, fontSize: 14 }}>
                      Aucune table trouvée.
                    </div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${C.border}`, background: C.bgAlt }}>
                          {['Table', 'Lignes', 'Taille'].map(h => (
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
                        {data.prismaDb.tables.map((table, i) => (
                          <motion.tr
                            key={table.tableName}
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.03, duration: 0.2 }}
                            style={{
                              borderBottom: i < data.prismaDb.tables.length - 1
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
                            <td style={{ padding: '11px 18px', fontWeight: 600, color: C.ink, fontFamily: 'monospace' }}>
                              {table.tableName}
                            </td>
                            <td style={{ padding: '11px 18px', color: C.mid }}>
                              {table.rowCount.toLocaleString('fr-FR')}
                            </td>
                            <td style={{ padding: '11px 18px', color: C.mid }}>
                              {formatBytes(table.sizeBytes)}
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </motion.div>
            )}

            {/* ── Migration history ── */}
            <motion.div custom={3} variants={fadeUp} initial="hidden" animate="show">
              <div style={{
                background: C.bg, border: `1px solid ${C.border}`,
                borderRadius: 14, overflow: 'hidden',
              }}>
                <SectionHeader icon={GitBranch} title="Historique des migrations" count={data.prismaDb.migrations.length} />

                {data.prismaDb.migrations.length === 0 ? (
                  <div style={{ padding: '32px 24px', textAlign: 'center', color: C.mid, fontSize: 14 }}>
                    {data.prismaDb.connected
                      ? 'Aucune migration trouvée.'
                      : 'Impossible de récupérer les migrations — base de données déconnectée.'}
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${C.border}`, background: C.bgAlt }}>
                        {['Migration', 'Statut', 'Appliquée le'].map(h => (
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
                      {data.prismaDb.migrations.map((migration, i) => (
                        <motion.tr
                          key={migration.name}
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.03, duration: 0.2 }}
                          style={{
                            borderBottom: i < data.prismaDb.migrations.length - 1
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
                          <td style={{
                            padding: '11px 18px', fontWeight: 500, color: C.ink,
                            fontFamily: 'monospace', fontSize: 12,
                            maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                            {migration.name}
                          </td>
                          <td style={{ padding: '11px 18px' }}>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: 5,
                              background: migration.status === 'applied' ? C.greenBg : C.yellowBg,
                              color: migration.status === 'applied' ? C.green : C.yellow,
                              border: `1px solid ${migration.status === 'applied' ? C.green : C.yellow}30`,
                              borderRadius: 99, padding: '3px 10px',
                              fontSize: 11, fontWeight: 700,
                            }}>
                              <span style={{
                                width: 6, height: 6, borderRadius: '50%',
                                background: migration.status === 'applied' ? C.green : C.yellow,
                                display: 'inline-block',
                              }} />
                              {migration.status === 'applied' ? 'Appliquée' : 'En attente'}
                            </span>
                          </td>
                          <td style={{ padding: '11px 18px', color: C.mid, fontSize: 12 }}>
                            {formatDate(migration.appliedAt)}
                          </td>
                        </motion.tr>
                      ))}
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
