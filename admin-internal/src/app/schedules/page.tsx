'use client'

import { useState, useEffect } from 'react'
import { Search, Plus, Edit, Trash2, RefreshCw, Clock } from 'lucide-react'

const C = {
  bg: '#ffffff', bgAlt: '#f4f7fb', blue: '#1a6bff', blueLight: '#e8f0ff',
  ink: '#0d1b2e', mid: '#5a6a80', border: '#e2e8f0',
  green: '#16a34a', greenBg: '#dcfce7', red: '#dc2626', redBg: '#fee2e2',
}

type Schedule = {
  id: string
  businessId: string
  dayOfWeek: number
  openTime: string | null
  closeTime: string | null
  closed: boolean
  business: { name: string } | null
}

const DAY_NAMES = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [businessFilter, setBusinessFilter] = useState('')
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Schedule | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function load() {
    setLoading(true)
    const url = businessFilter ? `/api/schedules?businessId=${businessFilter}` : '/api/schedules'
    const res = await fetch(url)
    const data = await res.json()
    setSchedules(data.data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [businessFilter])

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    const data = {
      businessId: formData.get('businessId') as string,
      dayOfWeek: parseInt(formData.get('dayOfWeek') as string),
      openTime: formData.get('openTime') as string,
      closeTime: formData.get('closeTime') as string,
      closed: formData.get('closed') === 'true',
    }
    
    if (!data.businessId || isNaN(data.dayOfWeek)) return
    
    setSubmitting(true)
    const res = await fetch('/api/schedules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      setCreating(false)
      form.reset()
      load()
    }
    setSubmitting(false)
  }

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!editing) return
    
    const form = e.currentTarget
    const formData = new FormData(form)
    const data = {
      dayOfWeek: parseInt(formData.get('dayOfWeek') as string),
      openTime: formData.get('openTime') as string,
      closeTime: formData.get('closeTime') as string,
      closed: formData.get('closed') === 'true',
    }
    
    setSubmitting(true)
    const res = await fetch(`/api/schedules/${editing.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      setEditing(null)
      load()
    }
    setSubmitting(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cet horaire ?')) return
    const res = await fetch(`/api/schedules/${id}`, { method: 'DELETE' })
    if (res.ok) load()
  }

  const groupedByBusiness = schedules.reduce((acc, s) => {
    const key = s.businessId || 'unknown'
    if (!acc[key]) acc[key] = { name: s.business?.name || 'Inconnu', schedules: [] }
    acc[key].schedules.push(s)
    return acc
  }, {} as Record<string, { name: string; schedules: Schedule[] }>)

  return (
    <div style={{ padding: '32px 36px', background: C.bgAlt, minHeight: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: C.ink, margin: 0 }}>Horaires</h1>
        <button
          onClick={() => setCreating(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            background: C.blue, color: '#fff', border: 'none',
            borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', transition: 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = '#1558e0'}
          onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = C.blue}
        >
          <Plus size={14} />
          Nouvel horaire
        </button>
      </div>

      {creating && (
        <div style={{
          background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12,
          padding: '20px', marginBottom: 20,
        }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: C.ink, marginBottom: 16 }}>Créer un horaire</h3>
          <form onSubmit={handleCreate}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <input name="businessId" placeholder="Business ID" required
                style={{ padding: '8px 12px', borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13 }} />
              <select name="dayOfWeek" required
                style={{ padding: '8px 12px', borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13 }}>
                {DAY_NAMES.map((day, i) => <option key={i} value={i}>{day}</option>)}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <input name="openTime" type="time" placeholder="Ouverture"
                style={{ padding: '8px 12px', borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13 }} />
              <input name="closeTime" type="time" placeholder="Fermeture"
                style={{ padding: '8px 12px', borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13 }} />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, fontSize: 13, color: C.ink }}>
              <input name="closed" type="checkbox" />
              Fermé ce jour
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" disabled={submitting}
                style={{ padding: '8px 16px', background: C.blue, color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer' }}>
                {submitting ? 'Création...' : 'Créer'}
              </button>
              <button type="button" onClick={() => setCreating(false)}
                style={{ padding: '8px 16px', background: C.bgAlt, color: C.ink, border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {editing && (
        <div style={{
          background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12,
          padding: '20px', marginBottom: 20,
        }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: C.ink, marginBottom: 16 }}>Modifier l'horaire</h3>
          <form onSubmit={handleUpdate}>
            <select name="dayOfWeek" defaultValue={editing.dayOfWeek} required
              style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13, marginBottom: 12 }}>
              {DAY_NAMES.map((day, i) => <option key={i} value={i}>{day}</option>)}
            </select>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <input name="openTime" type="time" defaultValue={editing.openTime || ''} placeholder="Ouverture"
                style={{ padding: '8px 12px', borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13 }} />
              <input name="closeTime" type="time" defaultValue={editing.closeTime || ''} placeholder="Fermeture"
                style={{ padding: '8px 12px', borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13 }} />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, fontSize: 13, color: C.ink }}>
              <input name="closed" type="checkbox" defaultChecked={editing.closed} />
              Fermé ce jour
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" disabled={submitting}
                style={{ padding: '8px 16px', background: C.blue, color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer' }}>
                {submitting ? 'Modification...' : 'Modifier'}
              </button>
              <button type="button" onClick={() => setEditing(null)}
                style={{ padding: '8px 16px', background: C.bgAlt, color: C.ink, border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={{
        background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12,
        padding: '12px 16px', marginBottom: 20,
      }}>
        <input
          value={businessFilter}
          onChange={e => setBusinessFilter(e.target.value)}
          placeholder="Filtrer par Business ID"
          style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13, outline: 'none', width: 200 }}
        />
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: C.mid }}>Chargement...</div>
      ) : Object.keys(groupedByBusiness).length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: C.mid }}>Aucun horaire trouvé</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {Object.entries(groupedByBusiness).map(([businessId, { name, schedules: businessSchedules }]) => (
            <div key={businessId} style={{
              background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12,
              padding: '20px',
            }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: C.ink, marginBottom: 16 }}>{name} ({businessId})</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                {businessSchedules.map((s) => (
                  <div key={s.id} style={{
                    padding: '12px', borderRadius: 8, border: `1px solid ${C.border}`,
                    background: s.closed ? C.redBg : C.greenBg,
                  }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: s.closed ? C.red : C.green, marginBottom: 4 }}>
                      {DAY_NAMES[s.dayOfWeek]}
                    </div>
                    <div style={{ fontSize: 12, color: C.mid }}>
                      {s.closed ? 'Fermé' : `${s.openTime} - ${s.closeTime}`}
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <button onClick={() => setEditing(s)} style={{ padding: 4, background: 'none', border: 'none', cursor: 'pointer', color: C.mid }}>
                        <Edit size={14} />
                      </button>
                      <button onClick={() => handleDelete(s.id)} style={{ padding: 4, background: 'none', border: 'none', cursor: 'pointer', color: C.red }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
