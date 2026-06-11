'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Search, Plus, ChevronRight, ChevronDown, CheckCircle, XCircle, Clock, Ban, RefreshCw, AlertCircle, Copy, Eye } from 'lucide-react'

const C = {
  bg: '#ffffff', bgAlt: '#f4f7fb', blue: '#1a6bff', blueLight: '#e8f0ff',
  ink: '#0d1b2e', mid: '#5a6a80', border: '#e2e8f0',
  green: '#16a34a', greenBg: '#dcfce7', red: '#dc2626', redBg: '#fee2e2',
  yellow: '#d97706', yellowBg: '#fef3c7',
}

const STATUS_META: Record<string, { bg: string; color: string; dot: string; icon: React.ElementType }> = {
  ACTIVE:    { bg: C.greenBg,  color: C.green,  dot: '#22c55e', icon: CheckCircle },
  SUSPENDED: { bg: C.redBg,   color: C.red,    dot: '#ef4444', icon: Ban },
  CANCELLED: { bg: '#f1f5f9', color: C.mid,    dot: '#94a3b8', icon: XCircle },
}

const PLAN_META: Record<string, { bg: string; color: string }> = {
  TRIAL:     { bg: '#f1f5f9', color: '#64748b' },
  STARTER:   { bg: '#e2e8f0', color: '#475569' },
  PRO:       { bg: C.blueLight, color: C.blue },
  ENTERPRISE: { bg: C.ink,    color: '#ffffff' },
}

type Client = {
  id: string
  name: string
  email: string
  plan: string
  planStatus: string
  createdAt: string
}

const STATUSES = ['ALL', 'ACTIVE', 'SUSPENDED', 'CANCELLED']

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [creating, setCreating] = useState(false)
  const [newForm, setNewForm] = useState({ name: '', email: '', password: '', plan: 'TRIAL', planStatus: 'ACTIVE' })
  const [submitting, setSubmitting] = useState(false)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  async function load() {
    setLoading(true)
    const res = await fetch('/api/clients')
    const data = await res.json()
    setClients(Array.isArray(data) ? data : data.clients ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => clients.filter(c => {
    const matchStatus = statusFilter === 'ALL' || c.planStatus === statusFilter
    const q = query.toLowerCase()
    const matchQuery = !q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
    return matchStatus && matchQuery
  }), [clients, query, statusFilter])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newForm.name || !newForm.email || !newForm.password) return
    setSubmitting(true)
    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newForm),
    })
    if (res.ok) {
      await load()
      setCreating(false)
      setNewForm({ name: '', email: '', password: '', plan: 'TRIAL', planStatus: 'ACTIVE' })
    } else {
      const err = await res.json()
      alert(err.error || 'Erreur lors de la création')
    }
    setSubmitting(false)
  }

  function toggleExpand(id: string) {
    setExpandedRows(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
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
                  {clients.filter(c => c.planStatus === s).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Create form inline */}
      <>
        {creating && (
          <div style={{ overflow: 'hidden', marginBottom: 12 }}>
            <form onSubmit={handleCreate} style={{
              background: C.bg, border: `1px solid ${C.blue}`,
              borderRadius: 10, padding: '16px 20px',
              display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr auto auto',
              gap: 10, alignItems: 'center',
            }}>
              <input required value={newForm.name} onChange={e => setNewForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Nom du client" style={inputStyle} />
              <input required type="email" value={newForm.email} onChange={e => setNewForm(f => ({ ...f, email: e.target.value }))}
                placeholder="Email" style={inputStyle} />
              <input required type="password" value={newForm.password} onChange={e => setNewForm(f => ({ ...f, password: e.target.value }))}
                placeholder="Mot de passe" style={inputStyle} />
              <select value={newForm.plan} onChange={e => setNewForm(f => ({ ...f, plan: e.target.value }))}
                style={{ ...inputStyle, cursor: 'pointer' }}>
                {['TRIAL', 'STARTER', 'PRO', 'ENTERPRISE'].map(p => <option key={p}>{p}</option>)}
              </select>
              <select value={newForm.planStatus} onChange={e => setNewForm(f => ({ ...f, planStatus: e.target.value }))}
                style={{ ...inputStyle, cursor: 'pointer' }}>
                {['ACTIVE', 'SUSPENDED', 'CANCELLED'].map(s => <option key={s}>{s}</option>)}
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
          </div>
        )}
      </>

      {/* Table */}
      <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
        {/* Table head */}
        <div style={{
          display: 'grid', gridTemplateColumns: '2fr 2fr 100px 90px 80px 36px',
          padding: '10px 18px', borderBottom: `1px solid ${C.border}`,
          background: C.bgAlt,
        }}>
          {['Nom', 'Email', 'Plan', 'Statut', 'Depuis', ''].map(h => (
            <div key={h} style={{ fontSize: 10, fontWeight: 700, color: C.mid, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {h}
            </div>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
            <div style={{ width: 22, height: 22, border: `2px solid ${C.border}`, borderTopColor: C.blue, borderRadius: '50%' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: C.mid, fontSize: 14 }}>
            {query || statusFilter !== 'ALL' ? 'Aucun client trouvé.' : 'Aucun client pour le moment.'}
          </div>
        ) : (
          <>
            {filtered.map((client, i) => {
              const sm = STATUS_META[client.planStatus] ?? STATUS_META.ACTIVE
              const pm = PLAN_META[client.plan] ?? PLAN_META.TRIAL
              const expanded = expandedRows.has(client.id)
              return (
                <div key={client.id}>
                  {/* Main row */}
                  <div style={{
                    display: 'grid', gridTemplateColumns: '2fr 2fr 100px 90px 80px 36px',
                    padding: '12px 18px', alignItems: 'center',
                    borderBottom: expanded ? `1px solid ${C.border}` : i < filtered.length - 1 ? `1px solid ${C.border}` : 'none',
                    transition: 'background 0.12s', cursor: 'pointer',
                    background: expanded ? C.bgAlt : 'transparent',
                  }}
                    onClick={() => toggleExpand(client.id)}
                    onMouseEnter={e => { if (!expanded) (e.currentTarget as HTMLDivElement).style.background = C.bgAlt }}
                    onMouseLeave={e => { if (!expanded) (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
                  >
                    <div style={{ fontWeight: 600, fontSize: 13.5, color: C.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {client.name}
                    </div>
                    <div style={{ fontSize: 13, color: C.mid, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {client.email}
                    </div>
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 99, background: pm.bg, color: pm.color }}>
                        {client.plan}
                      </span>
                    </div>
                    <div>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 99, background: sm.bg, color: sm.color }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: sm.dot, display: 'inline-block', flexShrink: 0 }} />
                        {client.planStatus}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: C.mid }}>
                      {new Date(client.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' })}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      {expanded ? <ChevronDown size={15} color={C.blue} /> : <ChevronRight size={15} color={C.mid} />}
                    </div>
                  </div>

                  {/* Expanded details */}
                  {expanded && (
                    <div style={{ background: C.bgAlt, padding: '16px 18px', borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        {/* Repondly credentials */}
                        <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, fontSize: 12, fontWeight: 700, color: C.ink }}>
                            Identifiants Repondly
                          </div>
                          <div style={{ marginBottom: 10 }}>
                            <div style={{ fontSize: 10, fontWeight: 600, color: C.mid, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                              Email
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <code style={{ flex: 1, fontSize: 12, fontFamily: 'monospace', color: C.ink, background: C.bgAlt, padding: '6px 10px', borderRadius: 6, wordBreak: 'break-all' }}>
                                {client.email}
                              </code>
                              <button onClick={() => navigator.clipboard.writeText(client.email)} style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 5, padding: '4px 8px', cursor: 'pointer', color: C.mid, fontSize: 11 }}>
                                <Copy size={11} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div style={{ marginTop: 12 }}>
                        <Link href={`/clients/${client.id}`} style={{ fontSize: 12, color: C.blue, textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          Voir les détails complets <ChevronRight size={12} />
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}
