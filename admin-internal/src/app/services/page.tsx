'use client'

import { useState, useEffect } from 'react'
import { Search, Plus, Edit, Trash2, RefreshCw, Calendar } from 'lucide-react'

const C = {
  bg: '#ffffff', bgAlt: '#f4f7fb', blue: '#1a6bff', blueLight: '#e8f0ff',
  ink: '#0d1b2e', mid: '#5a6a80', border: '#e2e8f0',
  green: '#16a34a', greenBg: '#dcfce7', red: '#dc2626', redBg: '#fee2e2',
}

type Service = {
  id: string
  name: string
  description: string | null
  durationMinutes: number
  price: number
  available: boolean
  business: { name: string } | null
  createdAt: string
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [businessFilter, setBusinessFilter] = useState('')
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Service | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function load() {
    setLoading(true)
    const url = businessFilter ? `/api/services?businessId=${businessFilter}` : '/api/services'
    const res = await fetch(url)
    const data = await res.json()
    setServices(data.data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [businessFilter])

  const filtered = services.filter(s => {
    const q = query.toLowerCase()
    return !q || s.name.toLowerCase().includes(q) || s.business?.name.toLowerCase().includes(q)
  })

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    const data = {
      businessId: formData.get('businessId') as string,
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      durationMinutes: parseInt(formData.get('durationMinutes') as string),
      price: parseFloat(formData.get('price') as string),
      available: formData.get('available') === 'true',
    }
    
    if (!data.businessId || !data.name || isNaN(data.durationMinutes) || isNaN(data.price)) return
    
    setSubmitting(true)
    const res = await fetch('/api/services', {
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
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      durationMinutes: parseInt(formData.get('durationMinutes') as string),
      price: parseFloat(formData.get('price') as string),
      available: formData.get('available') === 'true',
    }
    
    setSubmitting(true)
    const res = await fetch(`/api/services/${editing.id}`, {
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
    if (!confirm('Supprimer ce service ?')) return
    const res = await fetch(`/api/services/${id}`, { method: 'DELETE' })
    if (res.ok) load()
  }

  return (
    <div style={{ padding: '32px 36px', background: C.bgAlt, minHeight: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: C.ink, margin: 0 }}>Services</h1>
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
          Nouveau service
        </button>
      </div>

      {creating && (
        <div style={{
          background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12,
          padding: '20px', marginBottom: 20,
        }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: C.ink, marginBottom: 16 }}>Créer un service</h3>
          <form onSubmit={handleCreate}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <input name="businessId" placeholder="Business ID" required
                style={{ padding: '8px 12px', borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13 }} />
              <input name="name" placeholder="Nom du service" required
                style={{ padding: '8px 12px', borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13 }} />
            </div>
            <input name="description" placeholder="Description"
              style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13, marginBottom: 12 }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
              <input name="durationMinutes" type="number" placeholder="Durée (min)" required
                style={{ padding: '8px 12px', borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13 }} />
              <input name="price" type="number" step="0.01" placeholder="Prix (DT)" required
                style={{ padding: '8px 12px', borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13 }} />
              <select name="available"
                style={{ padding: '8px 12px', borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13 }}>
                <option value="true">Disponible</option>
                <option value="false">Indisponible</option>
              </select>
            </div>
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
          <h3 style={{ fontSize: 16, fontWeight: 600, color: C.ink, marginBottom: 16 }}>Modifier le service</h3>
          <form onSubmit={handleUpdate}>
            <input name="name" defaultValue={editing.name} placeholder="Nom du service" required
              style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13, marginBottom: 12 }} />
            <input name="description" defaultValue={editing.description || ''} placeholder="Description"
              style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13, marginBottom: 12 }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
              <input name="durationMinutes" type="number" defaultValue={editing.durationMinutes} placeholder="Durée (min)" required
                style={{ padding: '8px 12px', borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13 }} />
              <input name="price" type="number" step="0.01" defaultValue={editing.price} placeholder="Prix (DT)" required
                style={{ padding: '8px 12px', borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13 }} />
              <select name="available" defaultValue={editing.available.toString()}
                style={{ padding: '8px 12px', borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13 }}>
                <option value="true">Disponible</option>
                <option value="false">Indisponible</option>
              </select>
            </div>
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
        padding: '12px 16px', marginBottom: 20, display: 'flex', gap: 12,
      }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: C.mid }} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Rechercher..."
            style={{ width: '100%', padding: '6px 12px 6px 32px', borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13, outline: 'none' }}
          />
        </div>
        <input
          value={businessFilter}
          onChange={e => setBusinessFilter(e.target.value)}
          placeholder="Filtrer par Business ID"
          style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13, outline: 'none', width: 200 }}
        />
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: C.mid }}>Chargement...</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: C.mid }}>Aucun service trouvé</div>
      ) : (
        <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: C.bgAlt, borderBottom: `1px solid ${C.border}` }}>
                {['Nom', 'Business', 'Durée', 'Prix', 'Disponible', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: C.mid, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => (
                <tr key={s.id} style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 500, color: C.ink }}>{s.name}</td>
                  <td style={{ padding: '10px 14px', color: C.mid }}>{s.business?.name || '—'}</td>
                  <td style={{ padding: '10px 14px', color: C.ink }}>{s.durationMinutes} min</td>
                  <td style={{ padding: '10px 14px', color: C.ink }}>{s.price} DT</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ background: s.available ? C.greenBg : C.redBg, color: s.available ? C.green : C.red, borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>
                      {s.available ? 'Oui' : 'Non'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => setEditing(s)} style={{ padding: 4, background: 'none', border: 'none', cursor: 'pointer', color: C.mid }}>
                        <Edit size={14} />
                      </button>
                      <button onClick={() => handleDelete(s.id)} style={{ padding: 4, background: 'none', border: 'none', cursor: 'pointer', color: C.red }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
