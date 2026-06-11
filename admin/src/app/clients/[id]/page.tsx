'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, User, StickyNote,
  ShieldOff, ShieldCheck, Key,
  CheckCircle, Copy, Check,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type AdminNote = { id: string; content: string; createdAt: string }

type Business = {
  id: string; name: string; email: string; phone: string | null
  plan: string; planStatus: string; trialEndsAt: string | null
  adminNotes: AdminNote[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const C = {
  bg: '#ffffff', bgAlt: '#f4f7fb', blue: '#1a6bff', blueLight: '#e8f0ff',
  ink: '#0d1b2e', mid: '#5a6a80', border: '#e2e8f0',
  green: '#16a34a', greenBg: '#dcfce7', red: '#dc2626', redBg: '#fee2e2',
  yellow: '#d97706', yellowBg: '#fef3c7',
}

const STATUS_META: Record<string, { bg: string; color: string; dot: string }> = {
  ACTIVE:    { bg: C.greenBg, color: C.green, dot: '#22c55e' },
  SUSPENDED: { bg: C.redBg, color: C.red, dot: '#ef4444' },
  CANCELLED: { bg: '#f1f5f9', color: C.mid, dot: '#94a3b8' },
}

const input: React.CSSProperties = {
  width: '100%', padding: '9px 12px',
  border: `1px solid ${C.border}`, borderRadius: 8,
  fontSize: 13.5, color: C.ink, background: C.bg,
  outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.15s, box-shadow 0.15s',
}

function onFocusInput(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
  e.currentTarget.style.borderColor = C.blue
  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(26,107,255,0.1)'
}
function onBlurInput(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
  e.currentTarget.style.borderColor = C.border
  e.currentTarget.style.boxShadow = 'none'
}

// ─── Helper components ────────────────────────────────────────────────────────

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, ...style }}>
      {children}
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, color: C.mid, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>
      {children}
    </div>
  )
}

function generatePassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

type Tab = 'compte' | 'notes'

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: 'compte', label: 'Compte', icon: User },
  { key: 'notes', label: 'Notes', icon: StickyNote },
]

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [business, setBusiness] = useState<Business | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('compte')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<Partial<Business>>({})
  const [notes, setNotes] = useState<AdminNote[]>([])
  const [newPassword, setNewPassword] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [noteContent, setNoteContent] = useState('')

  // Load business
  useEffect(() => {
    fetch(`/api/clients/${id}`)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then((data: Business) => {
        const safe = {
          ...data,
          adminNotes: data.adminNotes ?? [],
        }
        setBusiness(safe)
        setForm(safe)
        setNotes(safe.adminNotes)
      })
      .catch(err => console.error('[client-detail]', err))
      .finally(() => setLoading(false))
  }, [id])

  async function handleSave() {
    setSaving(true)
    const res = await fetch(`/api/clients/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const updated = await res.json()
    setBusiness(updated); setForm(updated)
    setSaving(false)
  }

  async function handleStatusChange(planStatus: string) {
    const res = await fetch(`/api/clients/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planStatus }),
    })
    const updated = await res.json()
    setBusiness(updated); setForm(updated)
  }

  async function handleResetPassword() {
    const plain = generatePassword()
    await fetch(`/api/clients/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPassword: plain }),
    })
    setNewPassword(plain)
  }

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault()
    if (!noteContent.trim()) return
    const res = await fetch(`/api/clients/${id}/notes`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: noteContent }),
    })
    const note = await res.json()
    setNotes(prev => [note, ...prev])
    setNoteContent('')
  }

  async function copyPassword() {
    if (!newPassword) return
    await navigator.clipboard.writeText(newPassword)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ width: 24, height: 24, border: `2px solid ${C.border}`, borderTopColor: C.blue, borderRadius: '50%' }} />
      </div>
    )
  }

  if (!business) {
    return (
      <div style={{ padding: 48, textAlign: 'center', color: C.mid }}>
        <div style={{ fontSize: 15, marginBottom: 12 }}>Client introuvable.</div>
        <Link href="/clients" style={{ color: C.blue, fontSize: 13 }}>← Retour aux clients</Link>
      </div>
    )
  }

  const statusMeta = STATUS_META[business.planStatus] ?? STATUS_META.ACTIVE

  return (
    <div style={{ minHeight: '100vh', background: C.bgAlt }}>
      {/* Sticky header */}
      <div style={{
        background: C.bg, borderBottom: `1px solid ${C.border}`,
        padding: '14px 28px', display: 'flex', alignItems: 'center', gap: 12,
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <Link href="/clients" style={{
          display: 'flex', alignItems: 'center', gap: 5,
          color: C.mid, textDecoration: 'none', fontSize: 13,
          padding: '5px 10px', borderRadius: 7, border: `1px solid ${C.border}`,
          transition: 'all 0.15s',
        }}
          onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = C.blue; el.style.color = C.blue }}
          onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = C.border; el.style.color = C.mid }}
        >
          <ArrowLeft size={13} /> Clients
        </Link>
        <span style={{ color: C.border }}>›</span>
        <span style={{ fontSize: 15, fontWeight: 700, color: C.ink }}>{business.name}</span>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600,
          background: statusMeta.bg, color: statusMeta.color,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusMeta.dot, display: 'inline-block' }} />
          {business.planStatus}
        </span>
        <span style={{
          padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700,
          background: C.blueLight, color: C.blue,
        }}>
          {business.plan}
        </span>
      </div>

      {/* Tabs */}
      <div style={{ background: C.bg, borderBottom: `1px solid ${C.border}`, padding: '0 28px', display: 'flex' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '13px 16px', border: 'none', background: 'none',
            borderBottom: tab === t.key ? `2px solid ${C.blue}` : '2px solid transparent',
            color: tab === t.key ? C.blue : C.mid,
            fontWeight: tab === t.key ? 700 : 400,
            fontSize: 13, cursor: 'pointer', transition: 'color 0.15s',
          }}>
            <t.icon size={14} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '24px 28px', maxWidth: 900 }}>
        <div key={tab}>

          {/* ── TAB: COMPTE ── */}
          {tab === 'compte' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

              {/* Profile form */}
              <Card>
                <div style={{ fontWeight: 700, fontSize: 13, color: C.ink, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 7 }}>
                  <User size={14} color={C.mid} /> Profil
                </div>
                {([
                  { label: 'Nom', key: 'name', type: 'text' },
                  { label: 'Email', key: 'email', type: 'email' },
                  { label: 'Téléphone', key: 'phone', type: 'text' },
                ] as const).map(({ label, key, type }) => (
                  <div key={key} style={{ marginBottom: 14 }}>
                    <Label>{label}</Label>
                    <input type={type} value={(form[key] as string) ?? ''} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      style={input} onFocus={onFocusInput} onBlur={onBlurInput} />
                  </div>
                ))}
                <div style={{ marginBottom: 14 }}>
                  <Label>Plan</Label>
                  <select value={(form.plan as string) ?? ''} onChange={e => setForm(f => ({ ...f, plan: e.target.value }))}
                    style={{ ...input, cursor: 'pointer' }} onFocus={onFocusInput} onBlur={onBlurInput}>
                    {['TRIAL', 'STARTER', 'PRO', 'ENTERPRISE'].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <Label>Statut</Label>
                  <select value={(form.planStatus as string) ?? ''} onChange={e => setForm(f => ({ ...f, planStatus: e.target.value }))}
                    style={{ ...input, cursor: 'pointer' }} onFocus={onFocusInput} onBlur={onBlurInput}>
                    {['ACTIVE', 'SUSPENDED', 'CANCELLED'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <Label>Fin d&apos;essai</Label>
                  <input type="date" value={form.trialEndsAt ? (form.trialEndsAt as string).slice(0, 10) : ''}
                    onChange={e => setForm(f => ({ ...f, trialEndsAt: e.target.value || null }))}
                    style={input} onFocus={onFocusInput} onBlur={onBlurInput} />
                </div>
                <button onClick={handleSave} disabled={saving} style={{
                  width: '100%', padding: '10px 0', background: saving ? C.mid : C.blue,
                  color: '#fff', border: 'none', borderRadius: 8, fontSize: 14,
                  fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', transition: 'background 0.15s',
                }}>
                  {saving ? 'Enregistrement…' : 'Enregistrer'}
                </button>
              </Card>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Repondly credentials */}
                <Card style={{ background: C.blueLight, borderColor: C.blue }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: C.blue, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 7 }}>
                    <User size={14} /> Identifiants de connexion
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: C.mid, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Email
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <code style={{
                        flex: 1, fontFamily: 'monospace', fontSize: 13, fontWeight: 700,
                        color: C.ink, background: '#fff', padding: '6px 10px',
                        borderRadius: 6, border: `1px solid ${C.border}`,
                      }}>
                        {business.email}
                      </code>
                      <button onClick={() => { navigator.clipboard.writeText(business.email) }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 5, padding: '6px 10px',
                          borderRadius: 6, background: C.bg, border: `1px solid ${C.border}`,
                          color: C.mid, fontSize: 12, cursor: 'pointer', transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = C.blue }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = C.border }}
                      >
                        <Copy size={12} />
                      </button>
                    </div>
                  </div>
                </Card>

                {/* Actions */}
                <Card>
                  <div style={{ fontWeight: 700, fontSize: 13, color: C.ink, marginBottom: 14 }}>Actions rapides</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <button onClick={handleResetPassword} style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px',
                      borderRadius: 8, background: C.bgAlt, border: `1px solid ${C.border}`,
                      color: C.ink, fontSize: 13, cursor: 'pointer', fontWeight: 500, transition: 'all 0.15s',
                    }}
                      onMouseEnter={e => { const el = e.currentTarget as HTMLButtonElement; el.style.borderColor = C.blue; el.style.color = C.blue }}
                      onMouseLeave={e => { const el = e.currentTarget as HTMLButtonElement; el.style.borderColor = C.border; el.style.color = C.ink }}
                    >
                      <Key size={14} /> Réinitialiser le mot de passe
                    </button>
                    {business.planStatus !== 'SUSPENDED' ? (
                      <button onClick={() => handleStatusChange('SUSPENDED')} style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px',
                        borderRadius: 8, background: C.redBg, border: '1px solid #fca5a5',
                        color: C.red, fontSize: 13, cursor: 'pointer', fontWeight: 500,
                      }}>
                        <ShieldOff size={14} /> Suspendre le compte
                      </button>
                    ) : (
                      <button onClick={() => handleStatusChange('ACTIVE')} style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px',
                        borderRadius: 8, background: C.greenBg, border: '1px solid #86efac',
                        color: C.green, fontSize: 13, cursor: 'pointer', fontWeight: 500,
                      }}>
                        <ShieldCheck size={14} /> Réactiver le compte
                      </button>
                    )}
                  </div>

                  {newPassword && (
                    <div style={{
                      marginTop: 14, padding: '12px 14px', background: C.yellowBg,
                      borderRadius: 8, border: '1px solid #fde68a',
                    }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: C.yellow, marginBottom: 6 }}>
                        Nouveau mot de passe (affiché une seule fois)
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <code style={{
                          flex: 1, fontFamily: 'monospace', fontSize: 14, fontWeight: 700,
                          color: C.ink, background: '#fff', padding: '5px 10px',
                          borderRadius: 6, border: `1px solid ${C.border}`,
                        }}>
                          {newPassword}
                        </code>
                        <button onClick={copyPassword} style={{
                          display: 'flex', alignItems: 'center', gap: 5, padding: '6px 10px',
                          borderRadius: 6, background: copied ? C.greenBg : C.bg,
                          border: `1px solid ${copied ? '#86efac' : C.border}`,
                          color: copied ? C.green : C.mid, fontSize: 12, cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}>
                          {copied ? <Check size={12} /> : <Copy size={12} />}
                          {copied ? 'Copié' : 'Copier'}
                        </button>
                      </div>
                    </div>
                  )}
                </Card>
              </div>
            </div>
          )}

          {/* ── TAB: NOTES ── */}
          {tab === 'notes' && (
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: C.ink, marginBottom: 16 }}>Notes admin</div>
              <form onSubmit={handleAddNote} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    value={noteContent}
                    onChange={e => setNoteContent(e.target.value)}
                    placeholder="Ajouter une note..."
                    style={{ ...input, flex: 1 }}
                    onFocus={onFocusInput}
                    onBlur={onBlurInput}
                  />
                  <button type="submit" style={{
                    padding: '9px 16px', background: C.blue, color: '#fff',
                    border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600,
                    cursor: 'pointer',
                  }}>
                    Ajouter
                  </button>
                </div>
              </form>
              {notes.length === 0 ? (
                <div style={{ padding: '32px 24px', textAlign: 'center', color: C.mid, fontSize: 14 }}>
                  Aucune note.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {notes.map((note) => (
                    <div key={note.id} style={{
                      padding: '12px 14px', background: C.bg, borderRadius: 8,
                      border: `1px solid ${C.border}`,
                    }}>
                      <div style={{ fontSize: 13, color: C.ink, marginBottom: 6, whiteSpace: 'pre-wrap' }}>
                        {note.content}
                      </div>
                      <div style={{ fontSize: 11, color: C.mid }}>
                        {new Date(note.createdAt).toLocaleString('fr-FR')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
