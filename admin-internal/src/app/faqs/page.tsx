'use client'

import { useState, useEffect } from 'react'
import { Search, Plus, Edit, Trash2, RefreshCw, HelpCircle } from 'lucide-react'

const C = {
  bg: '#ffffff', bgAlt: '#f4f7fb', blue: '#1a6bff', blueLight: '#e8f0ff',
  ink: '#0d1b2e', mid: '#5a6a80', border: '#e2e8f0',
  green: '#16a34a', greenBg: '#dcfce7', red: '#dc2626', redBg: '#fee2e2',
}

type Faq = {
  id: string
  question: string
  answer: string
  business: { name: string } | null
  createdAt: string
}

export default function FaqsPage() {
  const [faqs, setFaqs] = useState<Faq[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [businessFilter, setBusinessFilter] = useState('')
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Faq | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function load() {
    setLoading(true)
    const url = businessFilter ? `/api/faqs?businessId=${businessFilter}` : '/api/faqs'
    const res = await fetch(url)
    const data = await res.json()
    setFaqs(data.data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [businessFilter])

  const filtered = faqs.filter(f => {
    const q = query.toLowerCase()
    return !q || f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q) || f.business?.name.toLowerCase().includes(q)
  })

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    const data = {
      businessId: formData.get('businessId') as string,
      question: formData.get('question') as string,
      answer: formData.get('answer') as string,
    }
    
    if (!data.businessId || !data.question || !data.answer) return
    
    setSubmitting(true)
    const res = await fetch('/api/faqs', {
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
      question: formData.get('question') as string,
      answer: formData.get('answer') as string,
    }
    
    setSubmitting(true)
    const res = await fetch(`/api/faqs/${editing.id}`, {
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
    if (!confirm('Supprimer cette FAQ ?')) return
    const res = await fetch(`/api/faqs/${id}`, { method: 'DELETE' })
    if (res.ok) load()
  }

  return (
    <div style={{ padding: '32px 36px', background: C.bgAlt, minHeight: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: C.ink, margin: 0 }}>FAQ</h1>
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
          Nouvelle FAQ
        </button>
      </div>

      {creating && (
        <div style={{
          background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12,
          padding: '20px', marginBottom: 20,
        }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: C.ink, marginBottom: 16 }}>Créer une FAQ</h3>
          <form onSubmit={handleCreate}>
            <input name="businessId" placeholder="Business ID" required
              style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13, marginBottom: 12 }} />
            <input name="question" placeholder="Question" required
              style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13, marginBottom: 12 }} />
            <textarea name="answer" placeholder="Réponse" required rows={3}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13, marginBottom: 12, resize: 'vertical' }} />
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
          <h3 style={{ fontSize: 16, fontWeight: 600, color: C.ink, marginBottom: 16 }}>Modifier la FAQ</h3>
          <form onSubmit={handleUpdate}>
            <input name="question" defaultValue={editing.question} placeholder="Question" required
              style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13, marginBottom: 12 }} />
            <textarea name="answer" defaultValue={editing.answer} placeholder="Réponse" required rows={3}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13, marginBottom: 12, resize: 'vertical' }} />
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
        <div style={{ padding: 40, textAlign: 'center', color: C.mid }}>Aucune FAQ trouvée</div>
      ) : (
        <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: C.bgAlt, borderBottom: `1px solid ${C.border}` }}>
                {['Question', 'Réponse', 'Business', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: C.mid, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((f, i) => (
                <tr key={f.id} style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 500, color: C.ink }}>{f.question}</td>
                  <td style={{ padding: '10px 14px', color: C.mid, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.answer}</td>
                  <td style={{ padding: '10px 14px', color: C.mid }}>{f.business?.name || '—'}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => setEditing(f)} style={{ padding: 4, background: 'none', border: 'none', cursor: 'pointer', color: C.mid }}>
                        <Edit size={14} />
                      </button>
                      <button onClick={() => handleDelete(f.id)} style={{ padding: 4, background: 'none', border: 'none', cursor: 'pointer', color: C.red }}>
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
