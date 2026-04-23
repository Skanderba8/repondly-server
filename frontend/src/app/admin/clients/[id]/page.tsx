'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

const C = {
  bg: '#ffffff',
  bgAlt: '#f4f7fb',
  blue: '#1a6bff',
  blueLight: '#e8f0ff',
  ink: '#0d1b2e',
  mid: '#5a6a80',
  border: '#e2e8f0',
}

type AutoRule = {
  id: string
  name: string
  trigger: string
  responseTemplate: string
  active: boolean
  conditions: Record<string, unknown>
}

type ActivityLog = {
  id: string
  action: string
  metadata: Record<string, unknown> | null
  createdAt: string
}

type AdminNote = {
  id: string
  content: string
  createdAt: string
}

type Business = {
  id: string
  name: string
  email: string
  plan: string
  status: string
  trialEndsAt: string | null
  chatwootAccountId: number | null
  chatwootApiToken: string | null
  autoRules: AutoRule[]
  activityLogs: ActivityLog[]
  adminNotes: AdminNote[]
}

function generatePassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

type Tab = 'compte' | 'bot' | 'activite' | 'notes'

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [business, setBusiness] = useState<Business | null>(null)
  const [tab, setTab] = useState<Tab>('compte')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newPassword, setNewPassword] = useState<string | null>(null)
  const [noteContent, setNoteContent] = useState('')
  const [notes, setNotes] = useState<AdminNote[]>([])
  const [rules, setRules] = useState<AutoRule[]>([])
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState<string | null>(null)
  const [form, setForm] = useState<Partial<Business>>({})

  useEffect(() => {
    fetch(`/api/admin/clients/${id}`)
      .then(r => r.json())
      .then((data: Business) => {
        setBusiness(data)
        setForm(data)
        setNotes(data.adminNotes ?? [])
        setRules(data.autoRules ?? [])
        setLoading(false)
      })
  }, [id])

  async function handleSave() {
    setSaving(true)
    const res = await fetch(`/api/admin/clients/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const updated = await res.json()
    setBusiness(updated)
    setForm(updated)
    setSaving(false)
  }

  async function handleResetPassword() {
    const plain = generatePassword()
    await fetch(`/api/admin/clients/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPassword: plain }),
    })
    setNewPassword(plain)
  }

  async function handleSuspend() {
    const res = await fetch(`/api/admin/clients/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'SUSPENDED' }),
    })
    const updated = await res.json()
    setBusiness(updated)
    setForm(updated)
  }

  async function handleReactivate() {
    const res = await fetch(`/api/admin/clients/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'ACTIVE' }),
    })
    const updated = await res.json()
    setBusiness(updated)
    setForm(updated)
  }

  function handleImpersonate() {
    document.cookie = `impersonating=${id}; path=/`
    router.push('/dashboard')
  }

  async function handleToggleRule(ruleId: string, active: boolean) {
    await fetch(`/api/admin/auto-rules/${ruleId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active }),
    })
    setRules(prev => prev.map(r => r.id === ruleId ? { ...r, active } : r))
  }

  async function handleSync() {
    setSyncing(true)
    setSyncMsg(null)
    const res = await fetch(`/api/admin/clients/${id}/sync`, { method: 'POST' })
    const data = await res.json()
    setSyncMsg(res.ok ? 'Synchronisation réussie' : (data.error ?? 'Erreur'))
    setSyncing(false)
  }

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault()
    if (!noteContent.trim()) return
    const res = await fetch(`/api/admin/clients/${id}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: noteContent }),
    })
    const note = await res.json()
    setNotes(prev => [note, ...prev])
    setNoteContent('')
  }

  if (loading) {
    return (
      <div style={{ padding: 40, color: C.mid, fontFamily: 'sans-serif' }}>
        Chargement…
      </div>
    )
  }

  if (!business) {
    return (
      <div style={{ padding: 40, color: C.mid, fontFamily: 'sans-serif' }}>
        Client introuvable.{' '}
        <Link href="/admin/clients" style={{ color: C.blue }}>Retour</Link>
      </div>
    )
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'compte', label: 'Compte' },
    { key: 'bot', label: 'Bot Config' },
    { key: 'activite', label: 'Activité' },
    { key: 'notes', label: 'Notes' },
  ]

  return (
    <div style={{ fontFamily: 'sans-serif', color: C.ink, minHeight: '100vh', background: C.bgAlt }}>
      {/* Header */}
      <div style={{ background: C.bg, borderBottom: `1px solid ${C.border}`, padding: '16px 32px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <Link href="/admin/clients" style={{ color: C.mid, textDecoration: 'none', fontSize: 14 }}>
          ← Clients
        </Link>
        <span style={{ color: C.border }}>|</span>
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{business.name}</h1>
        <span style={{
          marginLeft: 8,
          padding: '2px 10px',
          borderRadius: 12,
          fontSize: 12,
          fontWeight: 600,
          background: business.status === 'ACTIVE' ? '#d1fae5' : business.status === 'SUSPENDED' ? '#fee2e2' : '#fef9c3',
          color: business.status === 'ACTIVE' ? '#065f46' : business.status === 'SUSPENDED' ? '#991b1b' : '#854d0e',
        }}>
          {business.status}
        </span>
      </div>

      {/* Tabs */}
      <div style={{ background: C.bg, borderBottom: `1px solid ${C.border}`, padding: '0 32px', display: 'flex', gap: 0 }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '12px 20px',
              border: 'none',
              borderBottom: tab === t.key ? `2px solid ${C.blue}` : '2px solid transparent',
              background: 'none',
              color: tab === t.key ? C.blue : C.mid,
              fontWeight: tab === t.key ? 600 : 400,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: 32, maxWidth: 800 }}>
        {tab === 'compte' && (
          <TabCompte
            form={form}
            business={business}
            saving={saving}
            newPassword={newPassword}
            onFormChange={setForm}
            onSave={handleSave}
            onResetPassword={handleResetPassword}
            onSuspend={handleSuspend}
            onReactivate={handleReactivate}
            onImpersonate={handleImpersonate}
          />
        )}
        {tab === 'bot' && (
          <TabBot
            rules={rules}
            syncing={syncing}
            syncMsg={syncMsg}
            onToggleRule={handleToggleRule}
            onSync={handleSync}
          />
        )}
        {tab === 'activite' && (
          <TabActivite logs={business.activityLogs} />
        )}
        {tab === 'notes' && (
          <TabNotes
            notes={notes}
            noteContent={noteContent}
            onNoteChange={setNoteContent}
            onAddNote={handleAddNote}
          />
        )}
      </div>
    </div>
  )
}

// ---- Tab: Compte ----

function TabCompte({
  form,
  business,
  saving,
  newPassword,
  onFormChange,
  onSave,
  onResetPassword,
  onSuspend,
  onReactivate,
  onImpersonate,
}: {
  form: Partial<Business>
  business: Business
  saving: boolean
  newPassword: string | null
  onFormChange: (f: Partial<Business>) => void
  onSave: () => void
  onResetPassword: () => void
  onSuspend: () => void
  onReactivate: () => void
  onImpersonate: () => void
}) {
  const field = (label: string, key: keyof Business, type = 'text', options?: string[]) => (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 13, color: C.mid, marginBottom: 4 }}>{label}</label>
      {options ? (
        <select
          value={(form[key] as string) ?? ''}
          onChange={e => onFormChange({ ...form, [key]: e.target.value })}
          style={inputStyle}
        >
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input
          type={type}
          value={(form[key] as string) ?? ''}
          onChange={e => onFormChange({ ...form, [key]: type === 'number' ? Number(e.target.value) : e.target.value })}
          style={inputStyle}
        />
      )}
    </div>
  )

  return (
    <div>
      <div style={{ background: C.bg, borderRadius: 10, border: `1px solid ${C.border}`, padding: 24, marginBottom: 20 }}>
        <h2 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 600 }}>Informations</h2>
        {field('Nom', 'name')}
        {field('Email', 'email', 'email')}
        {field('Plan', 'plan', 'text', ['FREE', 'STARTER', 'PRO', 'BUSINESS'])}
        {field('Statut', 'status', 'text', ['TRIAL', 'ACTIVE', 'SUSPENDED', 'CANCELLED'])}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, color: C.mid, marginBottom: 4 }}>Fin d&apos;essai</label>
          <input
            type="date"
            value={form.trialEndsAt ? form.trialEndsAt.slice(0, 10) : ''}
            onChange={e => onFormChange({ ...form, trialEndsAt: e.target.value || null })}
            style={inputStyle}
          />
        </div>
        {field('Chatwoot Account ID', 'chatwootAccountId', 'number')}
        {field('Chatwoot API Token', 'chatwootApiToken')}
        <button
          onClick={onSave}
          disabled={saving}
          style={{ ...btnStyle, background: C.blue, color: '#fff' }}
        >
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>

      <div style={{ background: C.bg, borderRadius: 10, border: `1px solid ${C.border}`, padding: 24, marginBottom: 20 }}>
        <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>Actions</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <button onClick={onResetPassword} style={{ ...btnStyle, background: C.bgAlt, color: C.ink, border: `1px solid ${C.border}` }}>
            Réinitialiser le mot de passe
          </button>
          {business.status !== 'SUSPENDED' ? (
            <button onClick={onSuspend} style={{ ...btnStyle, background: '#fee2e2', color: '#991b1b' }}>
              Suspendre
            </button>
          ) : (
            <button onClick={onReactivate} style={{ ...btnStyle, background: '#d1fae5', color: '#065f46' }}>
              Réactiver
            </button>
          )}
          <button onClick={onImpersonate} style={{ ...btnStyle, background: C.blueLight, color: C.blue }}>
            Impersonner
          </button>
        </div>
        {newPassword && (
          <div style={{ marginTop: 16, padding: 12, background: '#fef9c3', borderRadius: 8, fontSize: 14 }}>
            Nouveau mot de passe : <strong style={{ fontFamily: 'monospace' }}>{newPassword}</strong>
            <span style={{ marginLeft: 8, color: C.mid, fontSize: 12 }}>(affiché une seule fois)</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ---- Tab: Bot Config ----

function TabBot({
  rules,
  syncing,
  syncMsg,
  onToggleRule,
  onSync,
}: {
  rules: AutoRule[]
  syncing: boolean
  syncMsg: string | null
  onToggleRule: (id: string, active: boolean) => void
  onSync: () => void
}) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Règles automatiques</h2>
        <button
          onClick={onSync}
          disabled={syncing}
          style={{ ...btnStyle, background: C.blue, color: '#fff' }}
        >
          {syncing ? 'Synchronisation…' : 'Forcer la synchronisation'}
        </button>
      </div>
      {syncMsg && (
        <div style={{ marginBottom: 12, padding: '8px 12px', background: C.blueLight, borderRadius: 6, fontSize: 13, color: C.blue }}>
          {syncMsg}
        </div>
      )}
      {rules.length === 0 ? (
        <p style={{ color: C.mid, fontSize: 14 }}>Aucune règle configurée.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {rules.map(rule => (
            <div key={rule.id} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: 16, display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{rule.name}</div>
                <div style={{ fontSize: 12, color: C.mid, marginBottom: 4 }}>Déclencheur : {rule.trigger}</div>
                <div style={{ fontSize: 12, color: C.mid, fontFamily: 'monospace', background: C.bgAlt, padding: '4px 8px', borderRadius: 4 }}>
                  {rule.responseTemplate.slice(0, 60)}{rule.responseTemplate.length > 60 ? '…' : ''}
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={rule.active}
                  onChange={e => onToggleRule(rule.id, e.target.checked)}
                  style={{ width: 16, height: 16, cursor: 'pointer' }}
                />
                Actif
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ---- Tab: Activité ----

function TabActivite({ logs }: { logs: ActivityLog[] }) {
  return (
    <div>
      <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>Activité récente</h2>
      {logs.length === 0 ? (
        <p style={{ color: C.mid, fontSize: 14 }}>Aucune activité enregistrée.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {logs.map(log => (
            <div key={log.id} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '12px 16px', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, fontSize: 14 }}>{log.action}</div>
                {log.metadata && (
                  <div style={{ fontSize: 12, color: C.mid, fontFamily: 'monospace', marginTop: 4 }}>
                    {JSON.stringify(log.metadata)}
                  </div>
                )}
              </div>
              <div style={{ fontSize: 12, color: C.mid, whiteSpace: 'nowrap' }}>
                {new Date(log.createdAt).toLocaleString('fr-FR')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ---- Tab: Notes ----

function TabNotes({
  notes,
  noteContent,
  onNoteChange,
  onAddNote,
}: {
  notes: AdminNote[]
  noteContent: string
  onNoteChange: (v: string) => void
  onAddNote: (e: React.FormEvent) => void
}) {
  return (
    <div>
      <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>Notes admin</h2>
      <form onSubmit={onAddNote} style={{ marginBottom: 24, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16 }}>
        <textarea
          value={noteContent}
          onChange={e => onNoteChange(e.target.value)}
          placeholder="Ajouter une note…"
          rows={3}
          style={{ ...inputStyle, resize: 'vertical', width: '100%', boxSizing: 'border-box' }}
        />
        <button
          type="submit"
          disabled={!noteContent.trim()}
          style={{ ...btnStyle, background: C.blue, color: '#fff', marginTop: 10 }}
        >
          Ajouter
        </button>
      </form>
      {notes.length === 0 ? (
        <p style={{ color: C.mid, fontSize: 14 }}>Aucune note.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {notes.map(note => (
            <div key={note.id} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '12px 16px' }}>
              <div style={{ fontSize: 14, whiteSpace: 'pre-wrap', marginBottom: 6 }}>{note.content}</div>
              <div style={{ fontSize: 12, color: C.mid }}>{new Date(note.createdAt).toLocaleString('fr-FR')}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ---- Shared styles ----

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  border: `1px solid ${C.border}`,
  borderRadius: 6,
  fontSize: 14,
  color: C.ink,
  background: C.bg,
  outline: 'none',
  boxSizing: 'border-box',
}

const btnStyle: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: 6,
  border: 'none',
  fontSize: 14,
  fontWeight: 500,
  cursor: 'pointer',
}
