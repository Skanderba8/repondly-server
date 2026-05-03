'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Database, RefreshCw, AlertCircle, CheckCircle2, XCircle,
  Activity, Table2, GitBranch, Play, HardDrive, MessageSquare,
  Users, Mail, ChevronLeft, ChevronRight, Search, Trash2, X, Eye,
} from 'lucide-react'

const C = {
  bg: '#ffffff', bgAlt: '#f4f7fb', blue: '#1a6bff', blueLight: '#e8f0ff',
  ink: '#0d1b2e', mid: '#5a6a80', border: '#e2e8f0',
  green: '#16a34a', greenBg: '#dcfce7', red: '#dc2626', redBg: '#fee2e2',
  yellow: '#d97706', yellowBg: '#fef3c7', purple: '#7c3aed', purpleBg: '#ede9fe',
}

type TableStat = { tableName: string; rowCount: number; sizeBytes: number }
type MigrationRecord = { name: string; appliedAt: string | null; status: 'applied' | 'pending' }
type DatabaseStats = {
  prismaDb: { connected: boolean; latency: number | null; totalSizeMb: number; tables: TableStat[]; migrations: MigrationRecord[] }
  chatwootDb: { connected: boolean; latency: number | null; totalSizeMb: number; conversations: number; contacts: number; messages: number }
}
type TableData = {
  columns: Array<{ column_name: string; data_type: string }>
  rows: Record<string, unknown>[]
  total: number; page: number; pages: number
}
type MigrateResult = { success: boolean; output: string; error?: string }

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  try { return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }
  catch { return iso }
}

function formatCellValue(val: unknown): string {
  if (val === null || val === undefined) return '∅'
  if (typeof val === 'boolean') return val ? '✓' : '✗'
  if (typeof val === 'object') {
    try { return JSON.stringify(val).slice(0, 80) } catch { return '[object]' }
  }
  const str = String(val)
  return str.length > 80 ? str.slice(0, 80) + '…' : str
}

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.28, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] } }),
}

function StatusBadge({ connected, latency }: { connected: boolean; latency: number | null }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: connected ? C.greenBg : C.redBg, color: connected ? C.green : C.red, borderRadius: 99, padding: '4px 12px', fontSize: 12, fontWeight: 700 }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: connected ? C.green : C.red, display: 'inline-block' }} />
        {connected ? 'Connectée' : 'Déconnectée'}
      </span>
      {latency !== null && <span style={{ fontSize: 11, color: C.mid }}>{latency}ms</span>}
    </div>
  )
}

// ── Table Viewer Modal ────────────────────────────────────────────────────────

function TableViewerModal({
  tableName, isSuperAdmin, onClose,
}: { tableName: string; isSuperAdmin: boolean; onClose: () => void }) {
  const [data, setData] = useState<TableData | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async (p = 1) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/database/tables/${tableName}?page=${p}&search=${encodeURIComponent(search)}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setData(await res.json() as TableData)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }, [tableName, search])

  useEffect(() => { void fetchData(page) }, [page]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setPage(1); void fetchData(1) }, [search]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleDelete(row: Record<string, unknown>) {
    const pkCol = data?.columns[0]?.column_name
    if (!pkCol) return
    const id = row[pkCol]
    setDeleting(String(id))
    try {
      const res = await fetch(`/api/admin/database/tables/${tableName}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: String(id), column: pkCol }),
      })
      if (!res.ok) throw new Error('Delete failed')
      setDeleteConfirm(null)
      void fetchData(page)
    } catch (e) {
      alert(String(e))
    } finally {
      setDeleting(null)
    }
  }

  const pkCol = data?.columns[0]?.column_name

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(13,27,46,0.5)', zIndex: 100, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 20px', overflowY: 'auto' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.2 }}
        style={{ background: C.bg, borderRadius: 16, width: '100%', maxWidth: 1100, boxShadow: '0 24px 80px rgba(0,0,0,0.2)', overflow: 'hidden' }}
      >
        {/* Modal header */}
        <div style={{ padding: '16px 22px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: C.bgAlt }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Table2 size={16} color={C.blue} />
            <span style={{ fontWeight: 700, fontSize: 15, color: C.ink, fontFamily: 'monospace' }}>{tableName}</span>
            {data && <span style={{ fontSize: 12, color: C.mid }}>— {data.total} lignes</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, border: `1px solid ${C.border}`, borderRadius: 7, padding: '6px 10px', background: C.bg }}>
              <Search size={12} color={C.mid} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Filtrer…"
                style={{ border: 'none', outline: 'none', fontSize: 12, color: C.ink, background: 'transparent', width: 120 }}
              />
            </div>
            <button onClick={onClose} style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 7, padding: '6px 8px', cursor: 'pointer', color: C.mid, display: 'flex', alignItems: 'center' }}>
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Table content */}
        <div style={{ overflowX: 'auto', maxHeight: '60vh', overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                style={{ width: 24, height: 24, border: `2px solid ${C.border}`, borderTopColor: C.blue, borderRadius: '50%', margin: '0 auto' }} />
            </div>
          ) : error ? (
            <div style={{ padding: 24, color: C.red, fontSize: 13 }}>{error}</div>
          ) : !data || data.rows.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: C.mid, fontSize: 13 }}>Table vide</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: C.bgAlt, borderBottom: `1px solid ${C.border}`, position: 'sticky', top: 0 }}>
                  {data.columns.map(col => (
                    <th key={col.column_name} style={{ padding: '9px 12px', textAlign: 'left', fontWeight: 700, color: C.mid, whiteSpace: 'nowrap', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {col.column_name}
                      <span style={{ fontWeight: 400, fontSize: 9, color: C.border, marginLeft: 4 }}>{col.data_type.replace('character varying', 'varchar').replace('timestamp without time zone', 'ts')}</span>
                    </th>
                  ))}
                  {isSuperAdmin && <th style={{ padding: '9px 12px', width: 60 }} />}
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${C.border}`, transition: 'background 0.1s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = C.bgAlt }}
                    onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent' }}>
                    {data.columns.map(col => {
                      const val = row[col.column_name]
                      const isNull = val === null || val === undefined
                      return (
                        <td key={col.column_name} style={{ padding: '8px 12px', color: isNull ? C.border : C.ink, fontFamily: typeof val === 'object' && val !== null ? 'monospace' : 'inherit', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {formatCellValue(val)}
                        </td>
                      )
                    })}
                    {isSuperAdmin && (
                      <td style={{ padding: '8px 12px' }}>
                        <button
                          onClick={() => setDeleteConfirm(row)}
                          style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 5, padding: '3px 6px', cursor: 'pointer', color: C.mid, display: 'flex', alignItems: 'center', transition: 'all 0.1s' }}
                          onMouseEnter={e => { const el = e.currentTarget as HTMLButtonElement; el.style.background = C.redBg; el.style.borderColor = C.red; el.style.color = C.red }}
                          onMouseLeave={e => { const el = e.currentTarget as HTMLButtonElement; el.style.background = 'none'; el.style.borderColor = C.border; el.style.color = C.mid }}
                        >
                          <Trash2 size={11} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {data && data.pages > 1 && (
          <div style={{ padding: '12px 22px', borderTop: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: C.bgAlt }}>
            <span style={{ fontSize: 12, color: C.mid }}>Page {data.page} / {data.pages} · {data.total} lignes</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                style={{ border: `1px solid ${C.border}`, borderRadius: 6, padding: '5px 9px', background: C.bg, cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1, color: C.mid, display: 'flex', alignItems: 'center' }}>
                <ChevronLeft size={13} />
              </button>
              <button onClick={() => setPage(p => Math.min(data.pages, p + 1))} disabled={page === data.pages}
                style={{ border: `1px solid ${C.border}`, borderRadius: 6, padding: '5px 9px', background: C.bg, cursor: page === data.pages ? 'not-allowed' : 'pointer', opacity: page === data.pages ? 0.4 : 1, color: C.mid, display: 'flex', alignItems: 'center' }}>
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Delete confirmation */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(13,27,46,0.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }}
              style={{ background: C.bg, borderRadius: 12, padding: '24px 28px', maxWidth: 380, width: '90%', boxShadow: '0 16px 48px rgba(0,0,0,0.2)' }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: C.ink, margin: '0 0 8px' }}>Supprimer cette ligne ?</h3>
              <p style={{ fontSize: 12, color: C.mid, margin: '0 0 6px' }}>
                <strong>{pkCol}</strong>: {String(deleteConfirm[pkCol ?? ''])}
              </p>
              <p style={{ fontSize: 11, color: C.red, margin: '0 0 20px' }}>Action irréversible.</p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => setDeleteConfirm(null)}
                  style={{ padding: '7px 14px', border: `1px solid ${C.border}`, borderRadius: 7, background: C.bg, color: C.mid, cursor: 'pointer', fontSize: 13 }}>
                  Annuler
                </button>
                <button onClick={() => void handleDelete(deleteConfirm)} disabled={!!deleting}
                  style={{ padding: '7px 14px', border: 'none', borderRadius: 7, background: C.red, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, opacity: deleting ? 0.6 : 1 }}>
                  {deleting ? 'Suppression…' : 'Supprimer'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function DatabaseManager() {
  const { data: session } = useSession()
  const userRole = (session?.user as { role?: 'SUPER_ADMIN' | 'ADMIN' } | undefined)?.role
  const isSuperAdmin = userRole === 'SUPER_ADMIN'

  const [data, setData] = useState<DatabaseStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [migrating, setMigrating] = useState(false)
  const [migrateResult, setMigrateResult] = useState<MigrateResult | null>(null)
  const [selectedTable, setSelectedTable] = useState<string | null>(null)

  const fetchData = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/database', { cache: 'no-store' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setData(await res.json() as DatabaseStats)
      setLastUpdated(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setLoading(false); setRefreshing(false)
    }
  }, [])

  useEffect(() => { void fetchData() }, [fetchData])

  async function handleMigrate() {
    setMigrating(true); setMigrateResult(null)
    try {
      const res = await fetch('/api/admin/database/migrate', { method: 'POST' })
      const json = await res.json() as MigrateResult
      setMigrateResult(json)
      if (json.success) void fetchData(true)
    } catch (err) {
      setMigrateResult({ success: false, output: '', error: String(err) })
    } finally {
      setMigrating(false)
    }
  }

  const pendingMigrations = data?.prismaDb.migrations.filter(m => m.status === 'pending') ?? []

  return (
    <div style={{ padding: '32px 36px', background: C.bgAlt, minHeight: '100vh' }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: C.blueLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Database size={17} color={C.blue} />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: C.ink, margin: 0 }}>Base de données</h1>
          </div>
          {lastUpdated && <p style={{ fontSize: 12, color: C.mid, margin: 0 }}>Mis à jour à {lastUpdated.toLocaleTimeString('fr-FR')}</p>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {isSuperAdmin && (
            <button onClick={() => { void handleMigrate() }} disabled={migrating || loading}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: pendingMigrations.length > 0 ? C.yellow : C.bgAlt, color: pendingMigrations.length > 0 ? '#fff' : C.mid, border: `1px solid ${pendingMigrations.length > 0 ? C.yellow : C.border}`, borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: migrating || loading ? 0.6 : 1 }}>
              {migrating ? <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} style={{ display: 'inline-flex' }}><RefreshCw size={13} /></motion.span> : <Play size={13} />}
              {migrating ? 'Migration…' : 'Appliquer les migrations'}
            </button>
          )}
          <button onClick={() => { void fetchData(true) }} disabled={refreshing || loading}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 14px', fontSize: 13, color: C.mid, cursor: 'pointer', fontWeight: 500, opacity: refreshing || loading ? 0.6 : 1 }}>
            <RefreshCw size={13} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            Actualiser
          </button>
        </div>
      </motion.div>

      {/* Migration result */}
      <AnimatePresence>
        {migrateResult && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ marginBottom: 18, background: migrateResult.success ? C.greenBg : C.redBg, border: `1px solid ${migrateResult.success ? C.green : C.red}30`, borderRadius: 12, padding: '14px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: migrateResult.success ? C.green : C.red, fontWeight: 700, fontSize: 13, marginBottom: 6 }}>
              {migrateResult.success ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
              {migrateResult.success ? 'Migrations appliquées' : 'Échec de la migration'}
            </div>
            {(migrateResult.output || migrateResult.error) && (
              <pre style={{ margin: 0, fontSize: 11, color: migrateResult.success ? C.green : C.red, background: `${migrateResult.success ? C.green : C.red}10`, borderRadius: 6, padding: '8px 12px', overflowX: 'auto', whiteSpace: 'pre-wrap', maxHeight: 200, overflowY: 'auto' }}>
                {migrateResult.error ?? migrateResult.output}
              </pre>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {loading && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '40vh' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              style={{ width: 28, height: 28, border: `2px solid ${C.border}`, borderTopColor: C.blue, borderRadius: '50%' }} />
          </motion.div>
        )}

        {!loading && error && (
          <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ display: 'flex', alignItems: 'center', gap: 12, background: C.redBg, border: `1px solid ${C.red}30`, borderRadius: 12, padding: '16px 20px', color: C.red, fontSize: 14 }}>
            <AlertCircle size={18} /> {error}
          </motion.div>
        )}

        {!loading && !error && data && (
          <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* DB connection cards */}
            <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {[
                  { label: 'Prisma DB', db: data.prismaDb },
                  { label: 'Chatwoot DB', db: data.chatwootDb },
                ].map(({ label, db }) => (
                  <div key={label} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, padding: '20px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 9, background: db.connected ? C.greenBg : C.redBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Activity size={16} color={db.connected ? C.green : C.red} />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 4 }}>{label}</div>
                        <StatusBadge connected={db.connected} latency={db.latency} />
                      </div>
                    </div>
                    {db.connected && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: C.blueLight, borderRadius: 8, padding: '8px 12px', fontSize: 12, color: C.blue, fontWeight: 600 }}>
                        <HardDrive size={12} /> Taille totale : {db.totalSizeMb} MB
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Chatwoot stats */}
            {data.chatwootDb.connected && (
              <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show">
                <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden' }}>
                  <div style={{ padding: '14px 22px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <MessageSquare size={14} color={C.mid} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: C.mid, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Statistiques Chatwoot DB</span>
                  </div>
                  <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                    {[
                      { label: 'Conversations', value: data.chatwootDb.conversations, color: C.blue, bg: C.blueLight, icon: MessageSquare },
                      { label: 'Contacts', value: data.chatwootDb.contacts, color: C.green, bg: C.greenBg, icon: Users },
                      { label: 'Messages', value: data.chatwootDb.messages, color: C.purple, bg: C.purpleBg, icon: Mail },
                    ].map(s => (
                      <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.color}20`, borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 9, background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <s.icon size={16} color={s.color} />
                        </div>
                        <div>
                          <div style={{ fontSize: 20, fontWeight: 700, color: s.color, lineHeight: 1.1 }}>{s.value.toLocaleString('fr-FR')}</div>
                          <div style={{ fontSize: 11, color: C.mid, marginTop: 2, fontWeight: 500 }}>{s.label}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Prisma tables — clickable */}
            {data.prismaDb.connected && (
              <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show">
                <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden' }}>
                  <div style={{ padding: '14px 22px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Table2 size={14} color={C.mid} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: C.mid, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                      Tables Prisma DB ({data.prismaDb.tables.length})
                    </span>
                    <span style={{ fontSize: 11, color: C.mid, marginLeft: 'auto' }}>Cliquer pour explorer</span>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${C.border}`, background: C.bgAlt }}>
                        {['Table', 'Lignes', 'Taille', ''].map(h => (
                          <th key={h} style={{ padding: '9px 18px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: C.mid, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.prismaDb.tables.map((table, i) => (
                        <tr key={table.tableName}
                          onClick={() => setSelectedTable(table.tableName)}
                          style={{ borderBottom: i < data.prismaDb.tables.length - 1 ? `1px solid ${C.border}` : 'none', cursor: 'pointer', transition: 'background 0.12s' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = '#f0f4ff' }}
                          onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent' }}>
                          <td style={{ padding: '11px 18px', fontWeight: 600, color: C.ink, fontFamily: 'monospace' }}>{table.tableName}</td>
                          <td style={{ padding: '11px 18px', color: C.mid }}>{table.rowCount.toLocaleString('fr-FR')}</td>
                          <td style={{ padding: '11px 18px', color: C.mid }}>{formatBytes(table.sizeBytes)}</td>
                          <td style={{ padding: '11px 18px' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: C.blue, fontSize: 12, fontWeight: 600 }}>
                              <Eye size={12} /> Explorer
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* Migration history */}
            <motion.div custom={3} variants={fadeUp} initial="hidden" animate="show">
              <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ padding: '14px 22px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <GitBranch size={14} color={C.mid} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.mid, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                    Historique des migrations ({data.prismaDb.migrations.length})
                  </span>
                </div>
                {data.prismaDb.migrations.length === 0 ? (
                  <div style={{ padding: '32px 24px', textAlign: 'center', color: C.mid, fontSize: 14 }}>
                    {data.prismaDb.connected ? 'Aucune migration.' : 'Base déconnectée.'}
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${C.border}`, background: C.bgAlt }}>
                        {['Migration', 'Statut', 'Appliquée le'].map(h => (
                          <th key={h} style={{ padding: '9px 18px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: C.mid, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.prismaDb.migrations.map((m, i) => (
                        <tr key={m.name} style={{ borderBottom: i < data.prismaDb.migrations.length - 1 ? `1px solid ${C.border}` : 'none', transition: 'background 0.12s' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = C.bgAlt }}
                          onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent' }}>
                          <td style={{ padding: '11px 18px', fontWeight: 500, color: C.ink, fontFamily: 'monospace', fontSize: 12, maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</td>
                          <td style={{ padding: '11px 18px' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: m.status === 'applied' ? C.greenBg : C.yellowBg, color: m.status === 'applied' ? C.green : C.yellow, border: `1px solid ${m.status === 'applied' ? C.green : C.yellow}30`, borderRadius: 99, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: m.status === 'applied' ? C.green : C.yellow, display: 'inline-block' }} />
                              {m.status === 'applied' ? 'Appliquée' : 'En attente'}
                            </span>
                          </td>
                          <td style={{ padding: '11px 18px', color: C.mid, fontSize: 12 }}>{formatDate(m.appliedAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </motion.div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* Table viewer modal */}
      <AnimatePresence>
        {selectedTable && (
          <TableViewerModal
            tableName={selectedTable}
            isSuperAdmin={isSuperAdmin}
            onClose={() => setSelectedTable(null)}
          />
        )}
      </AnimatePresence>

      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}