'use client'

import { useState, useEffect } from 'react'
import { Search, Edit, Save, RefreshCw, Bot } from 'lucide-react'

const C = {
  bg: '#ffffff', bgAlt: '#f4f7fb', blue: '#1a6bff', blueLight: '#e8f0ff',
  ink: '#0d1b2e', mid: '#5a6a80', border: '#e2e8f0',
  green: '#16a34a', greenBg: '#dcfce7', red: '#dc2626', redBg: '#fee2e2',
  yellow: '#d97706', yellowBg: '#fef3c7',
}

type BotConfig = {
  id: string
  businessId: string
  systemPrompt: string | null
  requiredOrderFields: string[]
  requiredAppointmentFields: string[]
  handoverTriggers: string[]
  collectFields: string[]
  needsRegen: boolean
  lastGeneratedAt: string | null
  business: { name: string; email: string } | null
}

export default function BotConfigPage() {
  const [configs, setConfigs] = useState<BotConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [businessFilter, setBusinessFilter] = useState('')
  const [editing, setEditing] = useState<BotConfig | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function load() {
    setLoading(true)
    const url = businessFilter ? `/api/bot-config?businessId=${businessFilter}` : '/api/bot-config'
    const res = await fetch(url)
    const data = await res.json()
    setConfigs(data.data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [businessFilter])

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!editing) return
    
    const form = e.currentTarget
    const formData = new FormData(form)
    const collectFields = []
    if (formData.get('collectName') === 'true') collectFields.push('name')
    if (formData.get('collectPhone') === 'true') collectFields.push('phone')
    if (formData.get('collectLocation') === 'true') collectFields.push('location')
    const data = {
      requiredOrderFields: (formData.get('requiredOrderFields') as string).split(',').map(s => s.trim()).filter(Boolean),
      requiredAppointmentFields: (formData.get('requiredAppointmentFields') as string).split(',').map(s => s.trim()).filter(Boolean),
      handoverTriggers: (formData.get('handoverTriggers') as string).split(',').map(s => s.trim()).filter(Boolean),
      collectFields,
    }
    
    setSubmitting(true)
    const res = await fetch(`/api/bot-config/${editing.id}`, {
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

  async function handleRegenerate(businessId: string) {
    if (!confirm('Régénérer le prompt pour ce business ?')) return
    const res = await fetch(`/api/regenerate-prompt/${businessId}`, { method: 'POST' })
    if (res.ok) {
      load()
    }
  }

  return (
    <div style={{ padding: '32px 36px', background: C.bgAlt, minHeight: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: C.ink, margin: 0 }}>Configuration Bot IA</h1>
      </div>

      {editing && (
        <div style={{
          background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12,
          padding: '20px', marginBottom: 20,
        }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: C.ink, marginBottom: 16 }}>
            Modifier la configuration - {editing.business?.name}
          </h3>
          <form onSubmit={handleUpdate}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: C.ink, marginBottom: 8 }}>
              Champs requis pour les commandes (séparés par virgule)
            </label>
            <input name="requiredOrderFields" defaultValue={editing.requiredOrderFields.join(', ')}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13, marginBottom: 12 }} />
            
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: C.ink, marginBottom: 8 }}>
              Champs requis pour les rendez-vous (séparés par virgule)
            </label>
            <input name="requiredAppointmentFields" defaultValue={editing.requiredAppointmentFields.join(', ')}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13, marginBottom: 12 }} />
            
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: C.ink, marginBottom: 8 }}>
              Déclencheurs de transfert humain (séparés par virgule)
            </label>
            <input name="handoverTriggers" defaultValue={editing.handoverTriggers.join(', ')}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13, marginBottom: 12 }} />
            
            <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.ink }}>
                <input name="collectName" type="checkbox" defaultChecked={editing.collectFields.includes('name')} />
                Collecter le nom
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.ink }}>
                <input name="collectPhone" type="checkbox" defaultChecked={editing.collectFields.includes('phone')} />
                Collecter le téléphone
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.ink }}>
                <input name="collectLocation" type="checkbox" defaultChecked={editing.collectFields.includes('location')} />
                Collecter la localisation
              </label>
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
      ) : configs.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: C.mid }}>Aucune configuration trouvée</div>
      ) : (
        <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: C.bgAlt, borderBottom: `1px solid ${C.border}` }}>
                {['Business', 'Statut', 'Dernière génération', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: C.mid, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {configs.map((c, i) => (
                <tr key={c.id} style={{ borderBottom: i < configs.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 500, color: C.ink }}>
                    {c.business?.name || 'Inconnu'}
                    <div style={{ fontSize: 11, color: C.mid }}>{c.businessId}</div>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    {c.needsRegen ? (
                      <span style={{ background: C.yellowBg, color: '#d97706', borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>
                        À régénérer
                      </span>
                    ) : (
                      <span style={{ background: C.greenBg, color: C.green, borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>
                        À jour
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '10px 14px', color: C.mid }}>
                    {c.lastGeneratedAt ? new Date(c.lastGeneratedAt).toLocaleString('fr-FR') : 'Jamais'}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => setEditing(c)} style={{ padding: 4, background: 'none', border: 'none', cursor: 'pointer', color: C.mid }}>
                        <Edit size={14} />
                      </button>
                      <button onClick={() => handleRegenerate(c.businessId)} style={{ padding: 4, background: 'none', border: 'none', cursor: 'pointer', color: C.blue }}>
                        <RefreshCw size={14} />
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
