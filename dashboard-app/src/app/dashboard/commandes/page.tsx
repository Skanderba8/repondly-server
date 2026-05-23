'use client'

import { useCallback, useEffect, useState } from 'react'
import { ShoppingBag, Calendar, CheckCircle, XCircle, Clock, RefreshCw, Phone, Plus, X } from 'lucide-react'
import { useTheme, palette } from '@/lib/theme'

type OrderStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED'
type OrderType = 'ORDER' | 'APPOINTMENT'
type FilterStatus = 'ALL' | OrderStatus

interface Order {
  id: string
  type: OrderType
  clientName: string | null
  clientPhone: string | null
  items: { name: string; price?: number; qty?: number }[] | null
  notes: string | null
  total: number | null
  datetime: string | null
  status: OrderStatus
  chatwootConversationId: number | null
  createdAt: string
}

const FILTERS: { key: FilterStatus; label: string }[] = [
  { key: 'ALL', label: 'Tout' },
  { key: 'PENDING', label: 'En attente' },
  { key: 'CONFIRMED', label: 'Confirmé' },
  { key: 'CANCELLED', label: 'Annulé' },
]

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  PENDING: { label: 'En attente', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', icon: <Clock size={12} /> },
  CONFIRMED: { label: 'Confirmé', color: '#10B981', bg: 'rgba(16,185,129,0.1)', icon: <CheckCircle size={12} /> },
  CANCELLED: { label: 'Annulé', color: '#EF4444', bg: 'rgba(239,68,68,0.1)', icon: <XCircle size={12} /> },
}

function timeStr(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function CommandesPage() {
  const dark = useTheme()
  const P = palette(dark)
  const [orders, setOrders] = useState<Order[]>([])
  const [filter, setFilter] = useState<FilterStatus>('ALL')
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [addForm, setAddForm] = useState({ type: 'ORDER' as OrderType, clientName: '', clientPhone: '', notes: '' })
  const [adding, setAdding] = useState(false)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const url = filter === 'ALL' ? '/api/orders' : `/api/orders?status=${filter}`
      const res = await fetch(url)
      const data = await res.json()
      if (data.success) setOrders(data.data)
    } catch (err) {
      console.error('[Commandes] fetch error', err)
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  const updateStatus = async (id: string, status: OrderStatus) => {
    setUpdating(id)
    try {
      await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      fetchOrders()
    } finally {
      setUpdating(null)
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setAdding(true)
    try {
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      })
      setShowAddForm(false)
      setAddForm({ type: 'ORDER', clientName: '', clientPhone: '', notes: '' })
      fetchOrders()
    } finally {
      setAdding(false)
    }
  }

  const counts = {
    ALL: orders.length,
    PENDING: orders.filter(o => o.status === 'PENDING').length,
    CONFIRMED: orders.filter(o => o.status === 'CONFIRMED').length,
    CANCELLED: orders.filter(o => o.status === 'CANCELLED').length,
  }

  const displayed = filter === 'ALL' ? orders : orders.filter(o => o.status === filter)

  return (
    <div style={{ padding: '32px 32px 48px', maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: P.text, margin: 0, letterSpacing: '-0.02em' }}>
            Commandes
          </h1>
          <p style={{ fontSize: 13, color: P.text3, marginTop: 4, margin: 0 }}>
            Commandes et rendez-vous capturés par le bot
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={fetchOrders}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 8,
              border: `1px solid ${P.border}`, background: 'transparent',
              color: P.text3, fontSize: 13, cursor: 'pointer', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = P.border2; (e.currentTarget as HTMLElement).style.color = P.text2 }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = P.border; (e.currentTarget as HTMLElement).style.color = P.text3 }}
          >
            <RefreshCw size={13} />
            Actualiser
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 8,
              border: 'none', background: '#3B82F6',
              color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '0.85'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
          >
            <Plus size={13} />
            Ajouter
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: P.surface, border: `1px solid ${P.border}`, borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              padding: '6px 14px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 500,
              background: filter === f.key ? P.surface2 : 'transparent',
              color: filter === f.key ? P.text : P.text3,
              transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            {f.label}
            {counts[f.key] > 0 && (
              <span style={{
                minWidth: 16, height: 16, borderRadius: 8, fontSize: 10, fontWeight: 600,
                background: filter === f.key ? P.border2 : 'transparent',
                color: filter === f.key ? P.text2 : P.border2,
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px',
              }}>
                {counts[f.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Add form */}
      {showAddForm && (
        <form
          onSubmit={handleAdd}
          style={{
            background: P.surface, border: `1px solid ${P.border}`, borderRadius: 12,
            padding: 20, marginBottom: 16,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: P.text }}>Nouvelle entrée</span>
            <button type="button" onClick={() => setShowAddForm(false)} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer' }}>
              <X size={16} />
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 11, color: P.text3, display: 'block', marginBottom: 6 }}>Type</label>
              <select
                value={addForm.type}
                onChange={e => setAddForm(f => ({ ...f, type: e.target.value as OrderType }))}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: `1px solid ${P.border}`, background: P.bg, color: P.text, fontSize: 13 }}
              >
                <option value="ORDER">Commande</option>
                <option value="APPOINTMENT">Rendez-vous</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: P.text3, display: 'block', marginBottom: 6 }}>Nom du client</label>
              <input
                type="text"
                value={addForm.clientName}
                onChange={e => setAddForm(f => ({ ...f, clientName: e.target.value }))}
                placeholder="Nom..."
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: `1px solid ${P.border}`, background: P.bg, color: P.text, fontSize: 13, boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, color: P.text3, display: 'block', marginBottom: 6 }}>Téléphone</label>
              <input
                type="tel"
                value={addForm.clientPhone}
                onChange={e => setAddForm(f => ({ ...f, clientPhone: e.target.value }))}
                placeholder="+216..."
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: `1px solid ${P.border}`, background: P.bg, color: P.text, fontSize: 13, boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, color: P.text3, display: 'block', marginBottom: 6 }}>Notes</label>
              <input
                type="text"
                value={addForm.notes}
                onChange={e => setAddForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Détails..."
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: `1px solid ${P.border}`, background: P.bg, color: P.text, fontSize: 13, boxSizing: 'border-box' }}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={adding}
            style={{
              padding: '8px 20px', borderRadius: 8, background: '#3B82F6',
              color: '#fff', border: 'none', fontSize: 13, fontWeight: 500,
              cursor: adding ? 'not-allowed' : 'pointer', opacity: adding ? 0.7 : 1,
            }}
          >
            {adding ? 'Ajout...' : 'Ajouter'}
          </button>
        </form>
      )}

      {/* List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 64, color: P.text3, fontSize: 13 }}>Chargement...</div>
      ) : displayed.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 80 }}>
          <ShoppingBag size={32} color={P.border} style={{ margin: '0 auto 12px' }} />
          <p style={{ fontSize: 14, color: P.text3, margin: 0 }}>Aucune commande</p>
          <p style={{ fontSize: 12, color: P.border2, marginTop: 6 }}>
            Les commandes capturées par le bot apparaîtront ici
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {displayed.map(order => {
            const sc = STATUS_CONFIG[order.status]
            return (
              <div
                key={order.id}
                style={{
                  background: P.surface, border: `1px solid ${P.border}`, borderRadius: 12,
                  padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16,
                  transition: 'border-color 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = P.border2}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = P.border}
              >
                {/* Type icon */}
                <div style={{
                  width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                  background: order.type === 'ORDER' ? 'rgba(59,130,246,0.1)' : 'rgba(99,102,241,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: order.type === 'ORDER' ? '#3B82F6' : '#6366F1',
                }}>
                  {order.type === 'ORDER' ? <ShoppingBag size={18} /> : <Calendar size={18} />}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: P.text }}>
                      {order.clientName || 'Client inconnu'}
                    </span>
                    <span style={{
                      fontSize: 10, fontWeight: 500, padding: '2px 8px', borderRadius: 9999,
                      background: order.type === 'ORDER' ? 'rgba(59,130,246,0.1)' : 'rgba(99,102,241,0.1)',
                      color: order.type === 'ORDER' ? '#3B82F6' : '#6366F1',
                    }}>
                      {order.type === 'ORDER' ? 'Commande' : 'RDV'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    {order.clientPhone && (
                      <span style={{ fontSize: 12, color: P.text3, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Phone size={11} /> {order.clientPhone}
                      </span>
                    )}
                    {order.notes && (
                      <span style={{ fontSize: 12, color: P.text3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 280 }}>
                        {order.notes}
                      </span>
                    )}
                    {order.items && order.items.length > 0 && (
                      <span style={{ fontSize: 12, color: P.text3 }}>
                        {order.items.map(i => i.name).join(', ')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Meta */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                  {/* Status badge */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    padding: '4px 10px', borderRadius: 9999,
                    background: sc.bg, color: sc.color, fontSize: 11, fontWeight: 500,
                  }}>
                    {sc.icon} {sc.label}
                  </div>

                  {/* Date */}
                  <span style={{ fontSize: 11, color: P.text3 }}>{timeStr(order.createdAt)}</span>

                  {/* Actions */}
                  {order.status === 'PENDING' && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => updateStatus(order.id, 'CONFIRMED')}
                        disabled={updating === order.id}
                        style={{
                          padding: '5px 12px', borderRadius: 7, border: '1px solid rgba(16,185,129,0.3)',
                          background: 'rgba(16,185,129,0.08)', color: '#10B981',
                          fontSize: 11, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s',
                          opacity: updating === order.id ? 0.5 : 1,
                        }}
                      >
                        Confirmer
                      </button>
                      <button
                        onClick={() => updateStatus(order.id, 'CANCELLED')}
                        disabled={updating === order.id}
                        style={{
                          padding: '5px 12px', borderRadius: 7, border: '1px solid rgba(239,68,68,0.3)',
                          background: 'rgba(239,68,68,0.08)', color: '#EF4444',
                          fontSize: 11, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s',
                          opacity: updating === order.id ? 0.5 : 1,
                        }}
                      >
                        Annuler
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
