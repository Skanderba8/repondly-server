'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, User, MessageSquare, Activity, StickyNote,
  RefreshCw, ShieldOff, ShieldCheck, Eye, Key,
  CheckCircle, XCircle, Copy, Check, Inbox,
  Users, Hash, Zap, AlertCircle, Wifi, WifiOff,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type AutoRule = {
  id: string; name: string; trigger: string
  responseTemplate: string; active: boolean
}
type ActivityLog = {
  id: string; action: string
  metadata: Record<string, unknown> | null; createdAt: string
}
type AdminNote = { id: string; content: string; createdAt: string }

type Business = {
  id: string; name: string; email: string; phone: string | null
  plan: string; status: string; trialEndsAt: string | null
  chatwootAccountId: number | null; chatwootApiToken: string | null
  chatwootUserPassword: string | null
  repondlyPassword: string | null
  channels: string[]
  autoRules: AutoRule[]; activityLogs: ActivityLog[]; adminNotes: AdminNote[]
}

type ChatwootInbox = {
  id: number; name: string; channel_type: string
  enabled: boolean; phone_number?: string
}
type ChatwootAgent = {
  id: number; name: string; email: string
  role: string; availability_status: string
}
type ChatwootData = {
  connected: boolean; error: string | null
  accountId: number | null; apiToken: string | null
  inboxes: ChatwootInbox[]; agents: ChatwootAgent[]
  conversationStats: { open: number; pending: number; resolved: number; all: number }
  totalMessages: number
}

// ─── Constants ────────────────────────────────────────────────────────────────

const C = {
  bg: '#ffffff', bgAlt: '#f4f7fb', blue: '#1a6bff', blueLight: '#e8f0ff',
  ink: '#0d1b2e', mid: '#5a6a80', border: '#e2e8f0',
  green: '#16a34a', greenBg: '#dcfce7', red: '#dc2626', redBg: '#fee2e2',
  yellow: '#d97706', yellowBg: '#fef3c7',
}

const STATUS_META: Record<string, { bg: string; color: string; dot: string }> = {
  TRIAL:     { bg: '#fff7ed', color: '#ea580c', dot: '#f97316' },
  ACTIVE:    { bg: C.greenBg, color: C.green, dot: '#22c55e' },
  SUSPENDED: { bg: C.redBg, color: C.red, dot: '#ef4444' },
  CANCELLED: { bg: '#f1f5f9', color: C.mid, dot: '#94a3b8' },
}

const CHANNEL_TYPE_LABEL: Record<string, string> = {
  'Channel::Whatsapp': 'WhatsApp',
  'Channel::FacebookPage': 'Facebook',
  'Channel::Instagram': 'Instagram',
  'Channel::Email': 'Email',
  'Channel::Api': 'API',
  'Channel::WebWidget': 'Web Widget',
}

const CHANNEL_TYPE_COLOR: Record<string, { bg: string; color: string }> = {
  'Channel::Whatsapp': { bg: '#dcfce7', color: '#16a34a' },
  'Channel::FacebookPage': { bg: '#dbeafe', color: '#2563eb' },
  'Channel::Instagram': { bg: '#fce7f3', color: '#db2777' },
  'Channel::Email': { bg: '#fef3c7', color: '#d97706' },
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

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={copy} style={{
      background: 'none', border: `1px solid ${C.border}`, borderRadius: 5,
      padding: '3px 7px', cursor: 'pointer', color: copied ? C.green : C.mid,
      fontSize: 11, display: 'flex', alignItems: 'center', gap: 4,
      transition: 'all 0.15s', flexShrink: 0,
    }}>
      {copied ? <Check size={11} /> : <Copy size={11} />}
      {copied ? 'Copié' : 'Copier'}
    </button>
  )
}

function MonoField({ label, value, secret }: { label: string; value: string | number | null; secret?: boolean }) {
  const [show, setShow] = useState(false)
  const display = value === null || value === '' ? '—' : String(value)
  const masked = secret && !show ? '••••••••••••••••' : display
  return (
    <div style={{ marginBottom: 14 }}>
      <Label>{label}</Label>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: C.bgAlt, border: `1px solid ${C.border}`,
        borderRadius: 7, padding: '8px 12px',
      }}>
        <code style={{ flex: 1, fontSize: 12, fontFamily: 'monospace', color: value ? C.ink : C.mid, wordBreak: 'break-all' }}>
          {masked}
        </code>
        {secret && value && (
          <button onClick={() => setShow(s => !s)} style={{
            background: 'none', border: 'none', cursor: 'pointer', color: C.mid,
            display: 'flex', alignItems: 'center', flexShrink: 0,
          }}>
            <Eye size={13} />
          </button>
        )}
        {value !== null && value !== '' && <CopyButton value={String(value)} />}
      </div>
    </div>
  )
}

function generatePassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

type Tab = 'compte' | 'chatwoot' | 'activite' | 'notes'

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: 'compte', label: 'Compte', icon: User },
  { key: 'chatwoot', label: 'Chatwoot Live', icon: MessageSquare },
  { key: 'activite', label: 'Activité', icon: Activity },
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
  const [rules, setRules] = useState<AutoRule[]>([])
  const [newPassword, setNewPassword] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [noteContent, setNoteContent] = useState('')
  const [savingCreds, setSavingCreds] = useState(false)
  const [credsSaved, setCredsSaved] = useState(false)
  const [credForm, setCredForm] = useState({ chatwootAccountId: '', chatwootApiToken: '' })

  // Chatwoot live data
  const [cwData, setCwData] = useState<ChatwootData | null>(null)
  const [cwLoading, setCwLoading] = useState(false)
  const [cwError, setCwError] = useState<string | null>(null)

  // Load business
  useEffect(() => {
    fetch(`/api/clients/${id}`)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then((data: Business) => {
        const safe = {
          ...data,
          autoRules: data.autoRules ?? [],
          activityLogs: data.activityLogs ?? [],
          adminNotes: data.adminNotes ?? [],
        }
        setBusiness(safe)
        setForm(safe)
        setNotes(safe.adminNotes)
        setRules(safe.autoRules)
        setCredForm({
          chatwootAccountId: String(safe.chatwootAccountId ?? ''),
          chatwootApiToken: safe.chatwootApiToken ?? '',
        })
      })
      .catch(err => console.error('[client-detail]', err))
      .finally(() => setLoading(false))
  }, [id])

  // Load Chatwoot data when tab opened or manually refreshed
  const loadChatwoot = useCallback(async () => {
    setCwLoading(true)
    setCwError(null)
    try {
      const res = await fetch(`/api/clients/${id}/chatwoot`, { cache: 'no-store' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setCwData(await res.json())
    } catch (e) {
      setCwError(String(e))
    } finally {
      setCwLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (tab === 'chatwoot') loadChatwoot()
  }, [tab, loadChatwoot])

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

  async function handleSaveCreds() {
    setSavingCreds(true)
    const payload = {
      chatwootAccountId: credForm.chatwootAccountId ? Number(credForm.chatwootAccountId) : null,
      chatwootApiToken: credForm.chatwootApiToken || null,
    }
    const res = await fetch(`/api/clients/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const updated = await res.json()
    setBusiness(updated); setForm(updated)
    setCredsSaved(true)
    setTimeout(() => setCredsSaved(false), 3000)
    setSavingCreds(false)
  }

  async function handleStatusChange(status: string) {
    const res = await fetch(`/api/clients/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
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

  async function handleToggleRule(ruleId: string, active: boolean) {
    await fetch(`/api/auto-rules/${ruleId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active }),
    })
    setRules(prev => prev.map(r => r.id === ruleId ? { ...r, active } : r))
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
        <div
          style={{ width: 24, height: 24, border: `2px solid ${C.border}`, borderTopColor: C.blue, borderRadius: '50%' }} />
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

  const statusMeta = STATUS_META[business.status] ?? STATUS_META.TRIAL

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
          {business.status}
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
        <>
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
                      {['FREE', 'STARTER', 'PRO', 'BUSINESS'].map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <Label>Statut</Label>
                    <select value={(form.status as string) ?? ''} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                      style={{ ...input, cursor: 'pointer' }} onFocus={onFocusInput} onBlur={onBlurInput}>
                      {['TRIAL', 'ACTIVE', 'SUSPENDED', 'CANCELLED'].map(s => <option key={s} value={s}>{s}</option>)}
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
                      <User size={14} /> Repondly — Identifiants de connexion
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
                    {business.repondlyPassword && (
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: C.mid, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Mot de passe
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <code style={{
                            flex: 1, fontFamily: 'monospace', fontSize: 13, fontWeight: 700,
                            color: C.ink, background: '#fff', padding: '6px 10px',
                            borderRadius: 6, border: `1px solid ${C.border}`,
                          }}>
                            {business.repondlyPassword}
                          </code>
                          <button onClick={() => { business.repondlyPassword && navigator.clipboard.writeText(business.repondlyPassword) }}
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
                    )}
                  </Card>

                  {/* Auto-provisioned Chatwoot credentials */}
                  {(business.chatwootAccountId || business.chatwootApiToken) && (
                    <Card style={{ background: C.greenBg, borderColor: '#86efac' }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: C.green, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 7 }}>
                        <CheckCircle size={14} /> Chatwoot — Compte créé automatiquement
                      </div>
                      <div style={{ fontSize: 11, color: C.mid, marginBottom: 10, lineHeight: 1.4 }}>
                        Un compte Chatwoot dédié a été créé avec les identifiants ci-dessous.
                      </div>
                      {business.chatwootAccountId && (
                        <div style={{ marginBottom: 10 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: C.mid, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Account ID
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <code style={{
                              flex: 1, fontFamily: 'monospace', fontSize: 14, fontWeight: 700,
                              color: C.ink, background: '#fff', padding: '6px 10px',
                              borderRadius: 6, border: `1px solid ${C.border}`,
                            }}>
                              {business.chatwootAccountId}
                            </code>
                            <button onClick={() => { navigator.clipboard.writeText(String(business.chatwootAccountId)) }}
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
                      )}
                      {business.email && (
                        <div style={{ marginBottom: 10 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: C.mid, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Email utilisateur
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
                      )}
                      {business.chatwootUserPassword && (
                        <div style={{ marginBottom: 10 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: C.mid, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Mot de passe
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <code style={{
                              flex: 1, fontFamily: 'monospace', fontSize: 13, fontWeight: 700,
                              color: C.ink, background: '#fff', padding: '6px 10px',
                              borderRadius: 6, border: `1px solid ${C.border}`,
                            }}>
                              {business.chatwootUserPassword}
                            </code>
                            <button onClick={() => { business.chatwootUserPassword && navigator.clipboard.writeText(business.chatwootUserPassword) }}
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
                      )}
                      {business.chatwootApiToken && (
                        <div style={{ marginBottom: 10 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: C.mid, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            API Token
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <code style={{
                              flex: 1, fontFamily: 'monospace', fontSize: 13, fontWeight: 700,
                              color: C.ink, background: '#fff', padding: '6px 10px',
                              borderRadius: 6, border: `1px solid ${C.border}`,
                            }}>
                              {business.chatwootApiToken.slice(0, 20)}••••••••••••
                            </code>
                            <button onClick={() => { business.chatwootApiToken && navigator.clipboard.writeText(business.chatwootApiToken) }}
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
                      )}
                      <div style={{ fontSize: 11, color: C.mid, marginTop: 8, lineHeight: 1.4 }}>
                        <strong>Important:</strong> Utilisez ces identifiants pour vous connecter à Chatwoot.
                      </div>
                    </Card>
                  )}

                  {/* Chatwoot credentials */}
                  <Card>
                    <div style={{ fontWeight: 700, fontSize: 13, color: C.ink, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 7 }}>
                      <MessageSquare size={14} color={C.mid} /> Chatwoot — Connexion
                    </div>
                    <div style={{ marginBottom: 14 }}>
                      <Label>Account ID</Label>
                      <input type="number" value={credForm.chatwootAccountId}
                        onChange={e => setCredForm(f => ({ ...f, chatwootAccountId: e.target.value }))}
                        placeholder="ex: 42" style={input} onFocus={onFocusInput} onBlur={onBlurInput} />
                    </div>
                    <div style={{ marginBottom: 16 }}>
                      <Label>API Token</Label>
                      <input type="password" value={credForm.chatwootApiToken}
                        onChange={e => setCredForm(f => ({ ...f, chatwootApiToken: e.target.value }))}
                        placeholder="••••••••" style={input} onFocus={onFocusInput} onBlur={onBlurInput} />
                    </div>
                    <button onClick={handleSaveCreds} disabled={savingCreds} style={{
                      width: '100%', padding: '10px 0',
                      background: savingCreds ? C.mid : credsSaved ? C.green : C.blue,
                      color: '#fff', border: 'none', borderRadius: 8, fontSize: 14,
                      fontWeight: 600, cursor: savingCreds ? 'not-allowed' : 'pointer',
                      transition: 'background 0.15s',
                    }}>
                      {savingCreds ? 'Enregistrement…' : credsSaved ? '✓ Enregistré' : 'Lier ce compte Chatwoot'}
                    </button>
                    {credsSaved && (
                      <div style={{ marginTop: 10, fontSize: 12, color: C.green, textAlign: 'center' }}>
                        ✓ Allez dans &quot;Chatwoot Live&quot; pour voir les données en direct
                      </div>
                    )}
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
                      {business.status !== 'SUSPENDED' ? (
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

                    <>
                      {newPassword && (
                        <div
                          style={{
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
                    </>
                  </Card>

                  {/* Auto Rules summary */}
                  {rules.length > 0 && (
                    <Card>
                      <div style={{ fontWeight: 700, fontSize: 13, color: C.ink, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 7 }}>
                        <Zap size={14} color={C.mid} /> Règles auto
                        <span style={{ marginLeft: 4, fontSize: 11, fontWeight: 700, background: C.blueLight, color: C.blue, padding: '2px 7px', borderRadius: 99 }}>
                          {rules.length}
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {rules.map(rule => (
                          <div key={rule.id} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '9px 12px', background: C.bgAlt, borderRadius: 8,
                            opacity: rule.active ? 1 : 0.5,
                          }}>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{rule.name}</div>
                              <div style={{ fontSize: 11, color: C.mid }}>{rule.trigger}</div>
                            </div>
                            <div onClick={() => handleToggleRule(rule.id, !rule.active)} style={{
                              width: 34, height: 18, borderRadius: 99,
                              background: rule.active ? C.blue : C.border,
                              position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0,
                            }}>
                              <div
                                style={{ position: 'absolute', top: 2, width: 14, height: 14, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}
                </div>
              </div>
            )}

            {/* ── TAB: CHATWOOT LIVE ── */}
            {tab === 'chatwoot' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: C.ink }}>Données Chatwoot en direct</div>
                  <button onClick={loadChatwoot} disabled={cwLoading} style={{
                    display: 'flex', alignItems: 'center', gap: 7, padding: '7px 14px',
                    borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg,
                    color: C.mid, fontSize: 13, cursor: cwLoading ? 'not-allowed' : 'pointer',
                    opacity: cwLoading ? 0.6 : 1, transition: 'all 0.15s',
                  }}
                    onMouseEnter={e => { if (!cwLoading) { const el = e.currentTarget as HTMLButtonElement; el.style.borderColor = C.blue; el.style.color = C.blue } }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLButtonElement; el.style.borderColor = C.border; el.style.color = C.mid }}
                  >
                    <RefreshCw size={13} style={{ animation: cwLoading ? 'spin 1s linear infinite' : 'none' }} />
                    Actualiser
                  </button>
                </div>

                {cwLoading && (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
                    <div
                      style={{ width: 24, height: 24, border: `2px solid ${C.border}`, borderTopColor: C.blue, borderRadius: '50%' }} />
                  </div>
                )}

                {!cwLoading && cwError && (
                  <Card>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: C.red }}>
                      <AlertCircle size={16} />
                      <span style={{ fontSize: 13 }}>Erreur : {cwError}</span>
                    </div>
                  </Card>
                )}

                {!cwLoading && cwData && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                    {/* Connection status + key IDs */}
                    <Card>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 9,
                          background: cwData.connected ? C.greenBg : C.redBg,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {cwData.connected ? <Wifi size={16} color={C.green} /> : <WifiOff size={16} color={C.red} />}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13, color: C.ink }}>
                            {cwData.connected ? 'Connecté à Chatwoot' : 'Non connecté'}
                          </div>
                          {cwData.error && (
                            <div style={{ fontSize: 12, color: C.red, marginTop: 2 }}>{cwData.error}</div>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <MonoField label="Account ID" value={cwData.accountId} />
                        <MonoField label="API Token" value={cwData.apiToken} secret />
                      </div>
                    </Card>

                    {cwData.connected && (
                      <>
                        {/* Conversation stats */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                          {[
                            { label: 'Total', value: cwData.conversationStats.all, color: C.blue, bg: C.blueLight },
                            { label: 'Ouvertes', value: cwData.conversationStats.open, color: C.green, bg: C.greenBg },
                            { label: 'En attente', value: cwData.conversationStats.pending, color: C.yellow, bg: C.yellowBg },
                            { label: 'Résolues', value: cwData.conversationStats.resolved, color: C.mid, bg: C.bgAlt },
                          ].map(s => (
                            <Card key={s.label} style={{ padding: '14px 16px' }}>
                              <div style={{ fontSize: 11, fontWeight: 700, color: C.mid, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                                {s.label}
                              </div>
                              <div style={{ fontSize: 26, fontWeight: 700, color: s.color }}>{s.value}</div>
                            </Card>
                          ))}
                        </div>

                        {/* Inboxes */}
                        <Card>
                          <div style={{ fontWeight: 700, fontSize: 13, color: C.ink, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 7 }}>
                            <Inbox size={14} color={C.mid} /> Inboxes connectées
                            <span style={{ fontSize: 11, fontWeight: 700, background: C.blueLight, color: C.blue, padding: '2px 7px', borderRadius: 99, marginLeft: 4 }}>
                              {cwData.inboxes.length}
                            </span>
                          </div>
                          {cwData.inboxes.length === 0 ? (
                            <div style={{ padding: '20px', textAlign: 'center', color: C.mid, fontSize: 13, background: C.bgAlt, borderRadius: 8 }}>
                              Aucune inbox configurée dans ce compte Chatwoot.
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              {cwData.inboxes.map(inbox => {
                                const channelLabel = CHANNEL_TYPE_LABEL[inbox.channel_type] ?? inbox.channel_type.replace('Channel::', '')
                                const channelStyle = CHANNEL_TYPE_COLOR[inbox.channel_type] ?? { bg: C.bgAlt, color: C.mid }
                                return (
                                  <div key={inbox.id} style={{
                                    display: 'flex', alignItems: 'center', gap: 12,
                                    padding: '11px 14px', background: C.bgAlt, borderRadius: 9,
                                    border: `1px solid ${C.border}`,
                                  }}>
                                    <span style={{
                                      fontSize: 11, fontWeight: 700,
                                      background: channelStyle.bg, color: channelStyle.color,
                                      padding: '3px 9px', borderRadius: 99,
                                    }}>
                                      {channelLabel}
                                    </span>
                                    <div style={{ flex: 1 }}>
                                      <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{inbox.name}</div>
                                      {inbox.phone_number && (
                                        <div style={{ fontSize: 11, color: C.mid, fontFamily: 'monospace' }}>{inbox.phone_number}</div>
                                      )}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                      <span style={{ fontSize: 11, fontWeight: 700, color: C.mid }}>
                                        ID #{inbox.id}
                                      </span>
                                      <CopyButton value={String(inbox.id)} />
                                      <div style={{
                                        width: 7, height: 7, borderRadius: '50%',
                                        background: inbox.enabled ? C.green : C.red,
                                      }} title={inbox.enabled ? 'Actif' : 'Inactif'} />
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </Card>

                        {/* Agents */}
                        <Card>
                          <div style={{ fontWeight: 700, fontSize: 13, color: C.ink, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 7 }}>
                            <Users size={14} color={C.mid} /> Agents
                            <span style={{ fontSize: 11, fontWeight: 700, background: C.blueLight, color: C.blue, padding: '2px 7px', borderRadius: 99, marginLeft: 4 }}>
                              {cwData.agents.length}
                            </span>
                          </div>
                          {cwData.agents.length === 0 ? (
                            <div style={{ padding: '20px', textAlign: 'center', color: C.mid, fontSize: 13, background: C.bgAlt, borderRadius: 8 }}>
                              Aucun agent dans ce compte.
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              {cwData.agents.map(agent => (
                                <div key={agent.id} style={{
                                  display: 'flex', alignItems: 'center', gap: 12,
                                  padding: '10px 14px', background: C.bgAlt, borderRadius: 8,
                                }}>
                                  <div style={{
                                    width: 30, height: 30, borderRadius: '50%',
                                    background: C.blueLight, display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', flexShrink: 0,
                                    fontSize: 12, fontWeight: 700, color: C.blue,
                                  }}>
                                    {agent.name.slice(0, 2).toUpperCase()}
                                  </div>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{agent.name}</div>
                                    <div style={{ fontSize: 11, color: C.mid }}>{agent.email}</div>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ fontSize: 11, color: C.mid }}>{agent.role}</span>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: C.mid }}>ID #{agent.id}</span>
                                    <CopyButton value={String(agent.id)} />
                                    <div style={{
                                      width: 7, height: 7, borderRadius: '50%',
                                      background: agent.availability_status === 'online' ? C.green : C.mid,
                                    }} title={agent.availability_status} />
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </Card>

                        {/* Raw config block for bot setup */}
                        <Card style={{ background: '#0d1b2e', border: 'none' }}>
                          <div style={{ fontWeight: 700, fontSize: 12, color: '#5a7aaa', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 7 }}>
                            <Hash size={13} /> Config bot (copier/coller dans .env)
                          </div>
                          <pre style={{
                            margin: 0, fontSize: 12, fontFamily: 'monospace', color: '#7dd3fc',
                            lineHeight: 1.8, whiteSpace: 'pre-wrap',
                          }}>
{`CHATWOOT_ACCOUNT_ID=${cwData.accountId ?? ''}
CHATWOOT_API_TOKEN=${cwData.apiToken ?? ''}
${cwData.inboxes.map(i => `# ${CHANNEL_TYPE_LABEL[i.channel_type] ?? i.channel_type}: ${i.name}
INBOX_ID_${i.name.toUpperCase().replace(/\s+/g, '_')}=${i.id}`).join('\n')}`}
                          </pre>
                          <div style={{ marginTop: 12 }}>
                            <CopyButton value={`CHATWOOT_ACCOUNT_ID=${cwData.accountId ?? ''}\nCHATWOOT_API_TOKEN=${cwData.apiToken ?? ''}\n${cwData.inboxes.map(i => `INBOX_ID_${i.name.toUpperCase().replace(/\s+/g, '_')}=${i.id}`).join('\n')}`} />
                          </div>
                        </Card>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── TAB: ACTIVITE ── */}
            {tab === 'activite' && (
              <Card style={{ padding: 0 }}>
                {business.activityLogs.length === 0 ? (
                  <div style={{ padding: '40px 24px', textAlign: 'center', color: C.mid, fontSize: 14 }}>
                    Aucune activité enregistrée.
                  </div>
                ) : (
                  business.activityLogs.map((log, i) => (
                    <div key={log.id} style={{
                      display: 'flex', gap: 14, alignItems: 'flex-start',
                      padding: '12px 18px',
                      borderBottom: i < business.activityLogs.length - 1 ? `1px solid ${C.border}` : 'none',
                    }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: C.blue, flexShrink: 0, marginTop: 5 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13.5, color: C.ink }}>{log.action}</div>
                        {log.metadata && (
                          <code style={{ fontSize: 11, color: C.mid, fontFamily: 'monospace' }}>
                            {JSON.stringify(log.metadata)}
                          </code>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: C.mid, whiteSpace: 'nowrap' }}>
                        {new Date(log.createdAt).toLocaleString('fr-FR')}
                      </div>
                    </div>
                  ))
                )}
              </Card>
            )}

            {/* ── TAB: NOTES ── */}
            {tab === 'notes' && (
              <div>
                <Card style={{ marginBottom: 16 }}>
                  <form onSubmit={handleAddNote}>
                    <textarea value={noteContent} onChange={e => setNoteContent(e.target.value)}
                      placeholder="Ajouter une note interne…" rows={3}
                      style={{ ...input, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 }}
                      onFocus={onFocusInput} onBlur={onBlurInput} />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                      <button type="submit" disabled={!noteContent.trim()} style={{
                        padding: '8px 18px', borderRadius: 8,
                        background: noteContent.trim() ? C.blue : C.border,
                        color: noteContent.trim() ? '#fff' : C.mid,
                        border: 'none', fontSize: 13, fontWeight: 600,
                        cursor: noteContent.trim() ? 'pointer' : 'not-allowed',
                      }}>
                        Ajouter la note
                      </button>
                    </div>
                  </form>
                </Card>

                {notes.length === 0 ? (
                  <Card>
                    <div style={{ textAlign: 'center', color: C.mid, fontSize: 14, padding: '20px 0' }}>
                      Aucune note pour ce client.
                    </div>
                  </Card>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {notes.map(note => (
                      <div key={note.id} style={{
                        background: C.bg, border: `1px solid ${C.border}`,
                        borderRadius: 10, padding: '14px 18px',
                        borderLeft: `3px solid ${C.yellow}`,
                      }}>
                        <div style={{ fontSize: 13.5, whiteSpace: 'pre-wrap', color: C.ink, lineHeight: 1.6, marginBottom: 8 }}>
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
        </>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}