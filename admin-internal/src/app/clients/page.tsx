'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Plus, ChevronRight, CheckCircle, XCircle, Clock, Ban, RefreshCw, MessageSquare } from 'lucide-react'

const C = {
  bg: '#ffffff', bgAlt: '#f4f7fb', blue: '#1a6bff', blueLight: '#e8f0ff',
  ink: '#0d1b2e', mid: '#5a6a80', border: '#e2e8f0',
  green: '#16a34a', greenBg: '#dcfce7', red: '#dc2626', redBg: '#fee2e2',
  yellow: '#d97706', yellowBg: '#fef3c7',
}

const STATUS_META: Record<string, { bg: string; color: string; dot: string; icon: React.ElementType }> = {
  TRIAL:     { bg: '#fff7ed', color: '#ea580c', dot: '#f97316', icon: Clock },
  ACTIVE:    { bg: C.greenBg,  color: C.green,  dot: '#22c55e', icon: CheckCircle },
  SUSPENDED: { bg: C.redBg,   color: C.red,    dot: '#ef4444', icon: Ban },
  CANCELLED: { bg: '#f1f5f9', color: C.mid,    dot: '#94a3b8', icon: XCircle },
}

const PLAN_META: Record<string, { bg: string; color: string }> = {
  FREE:     { bg: '#f1f5f9', color: '#64748b' },
  STARTER:  { bg: '#e2e8f0', color: '#475569' },
  PRO:      { bg: C.blueLight, color: C.blue },
  BUSINESS: { bg: C.ink,    color: '#ffffff' },
}

type Client = {
  id: string
  name: string
  email: string
  plan: string
  status: string
  chatwootAccountId: number | null
  createdAt: string
  _count?: { activityLogs: number }
}

const STATUSES = ['ALL', 'TRIAL', 'ACTIVE', 'SUSPENDED', 'CANCELLED']

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [creating, setCreating] = useState(false)
  const [newForm, setNewForm] = useState({ name: '', email: '', plan: 'TRIAL', status: 'TRIAL' })
  const [submitting, setSubmitting] = useState(false)

  async function load() {
    setLoading(true)
    const res = await fetch('/api/admin/clients')
    const data = await res.json()
    setClients(Array.isArray(data) ? data : data.clients ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => clients.filter(c => {
    const matchStatus = statusFilter === 'ALL' || c.status === statusFilter
    const q = query.toLowerCase()
    const matchQuery = !q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
    return matchStatus && matchQuery
  }), [clients, query, statusFilter])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newForm.name || !newForm.email) return
    setSubmitting(true)
    await fetch('/api/admin/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newForm),
    })
    await load()
    setCreating(false)
    setNewForm({ name: '', email: '', plan: 'TRIAL', status: 'TRIAL' })
    setSubmitting(false)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px',
    border: `1px solid ${C.border}`, borderRadius: 7,
    fontSize: 13, color: C.ink, background: C.bg,
    outline: 'none', boxSizing: 'border-box',
  }

  return (
    <div style={{ padding: '28px 32px', background: C.bgAlt, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: C.ink }}>Clients</h1>
          <p style={{ margin: '3px 0 0', fontSize: 12, color: C.mid }}>
            {clients.length} client{clients.length !== 1 ? 's' : ''} au total
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={load} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', borderRadius: 8,
            border: `1px solid ${C.border}`, background: C.bg,
            fontSize: 13, color: C.mid, cursor: 'pointer',
          }}>
            <RefreshCw size={13} /> Actualiser
          </button>
          <button onClick={() => setCreating(true)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', borderRadius: 8,
            border: 'none', background: C.blue,
            fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer',
          }}>
            <Plus size={14} /> Nouveau client
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: C.mid }} />
          <input
            value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Rechercher par nom ou email…"
            style={{ ...inputStyle, paddingLeft: 32 }}
          />
        </div>
        <div style={{ display: 'flex', gap: 5 }}>
          {STATUSES.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} style={{
              padding: '7px 14px', borderRadius: 7, fontSize: 12, fontWeight: 600,
              border: `1px solid ${statusFilter === s ? C.blue : C.border}`,
              background: statusFilter === s ? C.blueLight : C.bg,
              color: statusFilter === s ? C.blue : C.mid,
              cursor: 'pointer', transition: 'all 0.15s',
            }}>
              {s === 'ALL' ? 'Tous' : s}
              {s !== 'ALL' && (
                <span style={{ marginLeft: 5, fontWeight: 700 }}>
                  {clients.filter(c => c.status === s).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Create form inline */}
      <AnimatePresence>
        {creating && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden', marginBottom: 12 }}>
            <form onSubmit={handleCreate} style={{
              background: C.bg, border: `1px solid ${C.blue}`,
              borderRadius: 10, padding: '16px 20px',
              display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr auto auto',
              gap: 10, alignItems: 'center',
            }}>
              <input required value={newForm.name} onChange={e => setNewForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Nom du client" style={inputStyle} />
              <input required type="email" value={newForm.email} onChange={e => setNewForm(f => ({ ...f, email: e.target.value }))}
                placeholder="Email" style={inputStyle} />
              <select value={newForm.plan} onChange={e => setNewForm(f => ({ ...f, plan: e.target.value }))}
                style={{ ...inputStyle, cursor: 'pointer' }}>
                {['FREE', 'STARTER', 'PRO', 'BUSINESS'].map(p => <option key={p}>{p}</option>)}
              </select>
              <select value={newForm.status} onChange={e => setNewForm(f => ({ ...f, status: e.target.value }))}
                style={{ ...inputStyle, cursor: 'pointer' }}>
                {['TRIAL', 'ACTIVE'].map(s => <option key={s}>{s}</option>)}
              </select>
              <button type="submit" disabled={submitting} style={{
                padding: '8px 16px', borderRadius: 7, background: C.blue,
                color: '#fff', border: 'none', fontWeight: 600, fontSize: 13,
                cursor: submitting ? 'not-allowed' : 'pointer',
              }}>
                {submitting ? '…' : 'Créer'}
              </button>
              <button type="button" onClick={() => setCreating(false)} style={{
                padding: '8px 12px', borderRadius: 7, background: C.bgAlt,
                color: C.mid, border: `1px solid ${C.border}`, fontSize: 13,
                cursor: 'pointer',
              }}>
                Annuler
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
        {/* Table head */}
        <div style={{
          display: 'grid', gridTemplateColumns: '2fr 2fr 100px 90px 80px 80px 36px',
          padding: '10px 18px', borderBottom: `1px solid ${C.border}`,
          background: C.bgAlt,
        }}>
          {['Nom', 'Email', 'Plan', 'Statut', 'Chatwoot', 'Depuis', ''].map(h => (
            <div key={h} style={{ fontSize: 10, fontWeight: 700, color: C.mid, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {h}
            </div>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              style={{ width: 22, height: 22, border: `2px solid ${C.border}`, borderTopColor: C.blue, borderRadius: '50%' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: C.mid, fontSize: 14 }}>
            {query || statusFilter !== 'ALL' ? 'Aucun client trouvé.' : 'Aucun client pour le moment.'}
          </div>
        ) : (
          <AnimatePresence>
            {filtered.map((client, i) => {
              const sm = STATUS_META[client.status] ?? STATUS_META.TRIAL
              const pm = PLAN_META[client.plan] ?? PLAN_META.FREE
              return (
                <motion.div key={client.id}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.025 }}>
                  <Link href={`/admin/clients/${client.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                    <div style={{
                      display: 'grid', gridTemplateColumns: '2fr 2fr 100px 90px 80px 80px 36px',
                      padding: '12px 18px', alignItems: 'center',
                      borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : 'none',
                      transition: 'background 0.12s', cursor: 'pointer',
                    }}
                      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = C.bgAlt }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
                    >
                      {/* Name */}
                      <div style={{ fontWeight: 600, fontSize: 13.5, color: C.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {client.name}
                      </div>

                      {/* Email */}
                      <div style={{ fontSize: 13, color: C.mid, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {client.email}
                      </div>

                      {/* Plan */}
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 99, background: pm.bg, color: pm.color }}>
                          {client.plan}
                        </span>
                      </div>

                      {/* Status */}
                      <div>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 99, background: sm.bg, color: sm.color }}>
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: sm.dot, display: 'inline-block', flexShrink: 0 }} />
                          {client.status}
                        </span>
                      </div>

                      {/* Chatwoot linked? */}
                      <div>
                        {client.chatwootAccountId ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: C.green }}>
                            <MessageSquare size={12} /> #{client.chatwootAccountId}
                          </span>
                        ) : (
                          <span style={{ fontSize: 11, color: C.mid }}>—</span>
                        )}
                      </div>

                      {/* Date */}
                      <div style={{ fontSize: 11, color: C.mid }}>
                        {new Date(client.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' })}
                      </div>

                      {/* Arrow */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <ChevronRight size={15} color={C.mid} />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}