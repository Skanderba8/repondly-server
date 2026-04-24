'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, User, Bot, Activity, StickyNote,
  RefreshCw, ShieldOff, ShieldCheck, Eye, Key,
  CheckCircle, XCircle, Copy, Check,
} from 'lucide-react'

const C = {
  bg: '#ffffff', bgAlt: '#f4f7fb', blue: '#1a6bff', blueLight: '#e8f0ff',
  ink: '#0d1b2e', mid: '#5a6a80', border: '#e2e8f0',
  green: '#16a34a', greenBg: '#dcfce7', red: '#dc2626', redBg: '#fee2e2',
  yellow: '#d97706', yellowBg: '#fef3c7',
}

const STATUS_META: Record<string, { bg: string; color: string; dot: string }> = {
  TRIAL:    { bg: '#fff7ed', color: '#ea580c', dot: '#f97316' },
  ACTIVE:   { bg: C.greenBg, color: C.green, dot: '#22c55e' },
  SUSPENDED:{ bg: C.redBg, color: C.red, dot: '#ef4444' },
  CANCELLED:{ bg: '#f1f5f9', color: '#5a6a80', dot: '#94a3b8' },
}

type AutoRule = { id: string; name: string; trigger: string; responseTemplate: string; active: boolean; conditions: Record<string, unknown> }
type ActivityLog = { id: string; action: string; metadata: Record<string, unknown> | null; createdAt: string }
type AdminNote = { id: string; content: string; createdAt: string }
type Business = {
  id: string; name: string; email: string; plan: string; status: string;
  trialEndsAt: string | null; chatwootAccountId: number | null; chatwootApiToken: string | null;
  autoRules: AutoRule[]; activityLogs: ActivityLog[]; adminNotes: AdminNote[];
}

function generatePassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

type Tab = 'compte' | 'bot' | 'activite' | 'notes'
const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: 'compte', label: 'Compte', icon: User },
  { key: 'bot', label: 'Bot Config', icon: Bot },
  { key: 'activite', label: 'Activité', icon: Activity },
  { key: 'notes', label: 'Notes', icon: StickyNote },
]

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [business, setBusiness] = useState<Business | null>(null)
  const [tab, setTab] = useState<Tab>('compte')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newPassword, setNewPassword] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [noteContent, setNoteContent] = useState('')
  const [notes, setNotes] = useState<AdminNote[]>([])
  const [rules, setRules] = useState<AutoRule[]>([])
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [form, setForm] = useState<Partial<Business>>({})

  useEffect(() => {
    fetch(`/api/admin/clients/${id}`)
      .then(r => r.json())
      .then((data: Business) => {
        setBusiness(data); setForm(data)
        setNotes(data.adminNotes ?? []); setRules(data.autoRules ?? [])
        setLoading(false)
      })
  }, [id])

  async function handleSave() {
    setSaving(true)
    const res = await fetch(`/api/admin/clients/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
    })
    const updated = await res.json()
    setBusiness(updated); setForm(updated); setSaving(false)
  }

  async function handleResetPassword() {
    const plain = generatePassword()
    await fetch(`/api/admin/clients/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPassword: plain }),
    })
    setNewPassword(plain)
  }

  async function handleStatusChange(status: string) {
    const res = await fetch(`/api/admin/clients/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    const updated = await res.json()
    setBusiness(updated); setForm(updated)
  }

  function handleImpersonate() {
    document.cookie = `impersonating=${id}; path=/`
    router.push('/dashboard')
  }

  async function handleToggleRule(ruleId: string, active: boolean) {
    await fetch(`/api/admin/auto-rules/${ruleId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active }),
    })
    setRules(prev => prev.map(r => r.id === ruleId ? { ...r, active } : r))
  }

  async function handleSync() {
    setSyncing(true); setSyncMsg(null)
    const res = await fetch(`/api/admin/clients/${id}/sync`, { method: 'POST' })
    const data = await res.json()
    setSyncMsg({ text: res.ok ? 'Synchronisation réussie' : (data.error ?? 'Erreur'), ok: res.ok })
    setSyncing(false)
  }

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault()
    if (!noteContent.trim()) return
    const res = await fetch(`/api/admin/clients/${id}/notes`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: noteContent }),
    })
    const note = await res.json()
    setNotes(prev => [note, ...prev]); setNoteContent('')
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
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{ width: 24, height: 24, border: `2px solid ${C.border}`, borderTopColor: C.blue, borderRadius: '50%' }}
        />
      </div>
    )
  }

  if (!business) {
    return (
      <div style={{ padding: 40, color: C.mid, textAlign: 'center' }}>
        Client introuvable. <Link href="/admin/clients" style={{ color: C.blue }}>Retour</Link>
      </div>
    )
  }

  const statusMeta = STATUS_META[business.status] ?? STATUS_META.TRIAL

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      style={{ minHeight: '100vh', background: C.bgAlt }}
    >
      {/* Header */}
      <div style={{
        background: C.bg, borderBottom: `1px solid ${C.border}`,
        padding: '16px 32px', display: 'flex', alignItems: 'center', gap: 14,
        position: 'sticky', top: 0, zIndex: 10,
        boxShadow: '0 1px 8px rgba(13,27,46,0.05)',
      }}>
        <Link href="/admin/clients" style={{
          display: 'flex', alignItems: 'center', gap: 6,
          color: C.mid, textDecoration: 'none', fontSize: 13,
          padding: '5px 10px', borderRadius: 7, border: `1px solid ${C.border}`,
          transition: 'all 0.15s',
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = C.blue; (e.currentTarget as HTMLAnchorElement).style.color = C.blue }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = C.border; (e.currentTarget as HTMLAnchorElement).style.color = C.mid }}
        >
          <ArrowLeft size={13} /> Clients
        </Link>
        <span style={{ color: C.border }}>›</span>
        <h1 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.ink }}>{business.name}</h1>
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
      <div style={{
        background: C.bg, borderBottom: `1px solid ${C.border}`,
        padding: '0 32px', display: 'flex', gap: 0,
      }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '13px 18px', border: 'none',
              borderBottom: tab === t.key ? `2px solid ${C.blue}` : '2px solid transparent',
              background: 'none',
              color: tab === t.key ? C.blue : C.mid,
              fontWeight: tab === t.key ? 700 : 400,
              fontSize: 13.5, cursor: 'pointer',
              transition: 'color 0.15s',
            }}
          >
            <t.icon size={14} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '28px 32px', maxWidth: 860 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {tab === 'compte' && (
              <TabCompte
                form={form} business={business} saving={saving}
                newPassword={newPassword} copied={copied}
                onFormChange={setForm} onSave={handleSave}
                onResetPassword={handleResetPassword}
                onStatusChange={handleStatusChange}
                onImpersonate={handleImpersonate}
                onCopyPassword={copyPassword}
              />
            )}
            {tab === 'bot' && (
              <TabBot rules={rules} syncing={syncing} syncMsg={syncMsg}
                onToggleRule={handleToggleRule} onSync={handleSync} />
            )}
            {tab === 'activite' && <TabActivite logs={business.activityLogs} />}
            {tab === 'notes' && (
              <TabNotes notes={notes} noteContent={noteContent}
                onNoteChange={setNoteContent} onAddNote={handleAddNote} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

// ---- Shared styles ----
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px',
  border: `1px solid ${C.border}`, borderRadius: 8,
  fontSize: 13.5, color: C.ink, background: C.bg,
  outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.15s, box-shadow 0.15s',
}

function Field({
  label, value, onChange, type = 'text', options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  options?: string[]
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.mid, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </label>
      {options ? (
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{ ...inputStyle, cursor: 'pointer' }}
        >
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          style={inputStyle}
          onFocus={e => {
            e.currentTarget.style.borderColor = C.blue
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(26,107,255,0.1)'
          }}
          onBlur={e => {
            e.currentTarget.style.borderColor = C.border
            e.currentTarget.style.boxShadow = 'none'
          }}
        />
      )}
    </div>
  )
}

// ---- Tab: Compte ----
function TabCompte({
  form, business, saving, newPassword, copied,
  onFormChange, onSave, onResetPassword, onStatusChange, onImpersonate, onCopyPassword,
}: {
  form: Partial<Business>; business: Business; saving: boolean
  newPassword: string | null; copied: boolean
  onFormChange: (f: Partial<Business>) => void
  onSave: () => void; onResetPassword: () => void
  onStatusChange: (s: string) => void; onImpersonate: () => void
  onCopyPassword: () => void
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      {/* Info card */}
      <div style={{ background: C.bg, borderRadius: 12, border: `1px solid ${C.border}`, padding: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 7 }}>
          <User size={14} color={C.mid} /> Informations
        </div>
        <Field label="Nom" value={(form.name as string) ?? ''} onChange={v => onFormChange({ ...form, name: v })} />
        <Field label="Email" value={(form.email as string) ?? ''} onChange={v => onFormChange({ ...form, email: v })} type="email" />
        <Field label="Plan" value={(form.plan as string) ?? ''} onChange={v => onFormChange({ ...form, plan: v })} options={['FREE', 'STARTER', 'PRO', 'BUSINESS']} />
        <Field label="Statut" value={(form.status as string) ?? ''} onChange={v => onFormChange({ ...form, status: v })} options={['TRIAL', 'ACTIVE', 'SUSPENDED', 'CANCELLED']} />
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.mid, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Fin d&apos;essai
          </label>
          <input
            type="date"
            value={form.trialEndsAt ? (form.trialEndsAt as string).slice(0, 10) : ''}
            onChange={e => onFormChange({ ...form, trialEndsAt: e.target.value || null })}
            style={inputStyle}
          />
        </div>
        <button
          onClick={onSave}
          disabled={saving}
          style={{
            width: '100%', padding: '10px 0',
            background: saving ? C.mid : C.blue, color: '#fff',
            border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600,
            cursor: saving ? 'not-allowed' : 'pointer',
            transition: 'background 0.15s, transform 0.1s',
          }}
          onMouseEnter={e => { if (!saving) (e.currentTarget as HTMLButtonElement).style.background = '#0047cc' }}
          onMouseLeave={e => { if (!saving) (e.currentTarget as HTMLButtonElement).style.background = C.blue }}
        >
          {saving ? 'Enregistrement…' : 'Enregistrer les modifications'}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Chatwoot */}
        <div style={{ background: C.bg, borderRadius: 12, border: `1px solid ${C.border}`, padding: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 16 }}>Chatwoot</div>
          <Field
            label="Account ID"
            value={String(form.chatwootAccountId ?? '')}
            onChange={v => onFormChange({ ...form, chatwootAccountId: v ? Number(v) : null })}
            type="number"
          />
          <Field
            label="API Token"
            value={(form.chatwootApiToken as string) ?? ''}
            onChange={v => onFormChange({ ...form, chatwootApiToken: v })}
          />
        </div>

        {/* Actions */}
        <div style={{ background: C.bg, borderRadius: 12, border: `1px solid ${C.border}`, padding: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 16 }}>Actions rapides</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              onClick={onResetPassword}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '9px 14px', borderRadius: 8,
                background: C.bgAlt, border: `1px solid ${C.border}`,
                color: C.ink, fontSize: 13, fontWeight: 500, cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = C.blue; (e.currentTarget as HTMLButtonElement).style.color = C.blue }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = C.border; (e.currentTarget as HTMLButtonElement).style.color = C.ink }}
            >
              <Key size={14} /> Réinitialiser le mot de passe
            </button>

            {business.status !== 'SUSPENDED' ? (
              <button
                onClick={() => onStatusChange('SUSPENDED')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '9px 14px', borderRadius: 8,
                  background: C.redBg, border: `1px solid #fca5a5`,
                  color: C.red, fontSize: 13, fontWeight: 500, cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                <ShieldOff size={14} /> Suspendre le compte
              </button>
            ) : (
              <button
                onClick={() => onStatusChange('ACTIVE')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '9px 14px', borderRadius: 8,
                  background: C.greenBg, border: `1px solid #86efac`,
                  color: C.green, fontSize: 13, fontWeight: 500, cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                <ShieldCheck size={14} /> Réactiver le compte
              </button>
            )}

            <button
              onClick={onImpersonate}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '9px 14px', borderRadius: 8,
                background: C.blueLight, border: `1px solid ${C.blue}30`,
                color: C.blue, fontSize: 13, fontWeight: 500, cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <Eye size={14} /> Voir en tant que ce client
            </button>
          </div>

          <AnimatePresence>
            {newPassword && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                style={{
                  marginTop: 14, padding: '12px 14px',
                  background: C.yellowBg, borderRadius: 8,
                  border: `1px solid #fde68a`,
                }}
              >
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
                  <button
                    onClick={onCopyPassword}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '6px 10px', borderRadius: 6,
                      background: copied ? C.greenBg : C.bg,
                      border: `1px solid ${copied ? '#86efac' : C.border}`,
                      color: copied ? C.green : C.mid,
                      fontSize: 12, cursor: 'pointer', fontWeight: 500,
                      transition: 'all 0.2s',
                    }}
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    {copied ? 'Copié' : 'Copier'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

// ---- Tab: Bot Config ----
function TabBot({
  rules, syncing, syncMsg, onToggleRule, onSync,
}: {
  rules: AutoRule[]; syncing: boolean
  syncMsg: { text: string; ok: boolean } | null
  onToggleRule: (id: string, active: boolean) => void
  onSync: () => void
}) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.ink }}>
          Règles automatiques
          <span style={{
            marginLeft: 8, fontSize: 11, fontWeight: 600,
            background: C.blueLight, color: C.blue,
            padding: '2px 8px', borderRadius: 99,
          }}>
            {rules.length}
          </span>
        </div>
        <button
          onClick={onSync}
          disabled={syncing}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '8px 14px', borderRadius: 8,
            background: syncing ? C.bgAlt : C.blue, color: syncing ? C.mid : '#fff',
            border: 'none', fontSize: 13, fontWeight: 600, cursor: syncing ? 'not-allowed' : 'pointer',
            transition: 'background 0.15s',
          }}
        >
          <RefreshCw size={13} style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
          {syncing ? 'Synchronisation…' : 'Forcer la sync'}
        </button>
      </div>

      <AnimatePresence>
        {syncMsg && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              marginBottom: 14, padding: '10px 14px',
              background: syncMsg.ok ? C.greenBg : C.redBg,
              borderRadius: 8, fontSize: 13, fontWeight: 500,
              color: syncMsg.ok ? C.green : C.red,
              display: 'flex', alignItems: 'center', gap: 7,
            }}
          >
            {syncMsg.ok ? <CheckCircle size={14} /> : <XCircle size={14} />}
            {syncMsg.text}
          </motion.div>
        )}
      </AnimatePresence>

      {rules.length === 0 ? (
        <div style={{
          padding: '40px 24px', textAlign: 'center',
          background: C.bg, borderRadius: 12, border: `1px solid ${C.border}`,
          color: C.mid, fontSize: 14,
        }}>
          Aucune règle configurée pour ce client.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {rules.map((rule, i) => (
            <motion.div
              key={rule.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              style={{
                background: C.bg, border: `1px solid ${rule.active ? C.border : '#fca5a5'}`,
                borderRadius: 10, padding: '14px 18px',
                display: 'flex', alignItems: 'flex-start', gap: 14,
                opacity: rule.active ? 1 : 0.65,
                transition: 'opacity 0.2s, border-color 0.2s',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: C.ink, marginBottom: 4 }}>{rule.name}</div>
                <div style={{ fontSize: 12, color: C.mid, marginBottom: 6 }}>
                  Déclencheur : <span style={{ fontWeight: 600, color: C.ink }}>{rule.trigger}</span>
                </div>
                <div style={{
                  fontSize: 12, color: C.mid, fontFamily: 'monospace',
                  background: C.bgAlt, padding: '5px 10px', borderRadius: 6,
                  borderLeft: `3px solid ${C.blue}`,
                }}>
                  {rule.responseTemplate.slice(0, 80)}{rule.responseTemplate.length > 80 ? '…' : ''}
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', flexShrink: 0 }}>
                <div
                  onClick={() => onToggleRule(rule.id, !rule.active)}
                  style={{
                    width: 36, height: 20, borderRadius: 99,
                    background: rule.active ? C.blue : C.border,
                    position: 'relative', cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                >
                  <motion.div
                    animate={{ x: rule.active ? 18 : 2 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      position: 'absolute', top: 2,
                      width: 16, height: 16, borderRadius: '50%',
                      background: '#fff',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    }}
                  />
                </div>
                <span style={{ fontSize: 12, color: rule.active ? C.green : C.mid, fontWeight: 600 }}>
                  {rule.active ? 'Actif' : 'Inactif'}
                </span>
              </label>
            </motion.div>
          ))}
        </div>
      )}
      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

// ---- Tab: Activité ----
function TabActivite({ logs }: { logs: ActivityLog[] }) {
  return (
    <div>
      <div style={{ fontSize: 15, fontWeight: 700, color: C.ink, marginBottom: 16 }}>Activité récente</div>
      {logs.length === 0 ? (
        <div style={{ padding: '40px 24px', textAlign: 'center', background: C.bg, borderRadius: 12, border: `1px solid ${C.border}`, color: C.mid, fontSize: 14 }}>
          Aucune activité enregistrée.
        </div>
      ) : (
        <div style={{ background: C.bg, borderRadius: 12, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
          {logs.map((log, i) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              style={{
                display: 'flex', gap: 14, alignItems: 'flex-start',
                padding: '13px 18px',
                borderBottom: i < logs.length - 1 ? `1px solid ${C.border}` : 'none',
                transition: 'background 0.12s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = C.bgAlt }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
            >
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: C.blue, flexShrink: 0, marginTop: 5,
              }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, fontSize: 13.5, color: C.ink }}>{log.action}</div>
                {log.metadata && (
                  <div style={{
                    fontSize: 11, color: C.mid, fontFamily: 'monospace',
                    marginTop: 4, background: C.bgAlt, padding: '3px 8px', borderRadius: 5,
                  }}>
                    {JSON.stringify(log.metadata)}
                  </div>
                )}
              </div>
              <div style={{ fontSize: 11, color: C.mid, whiteSpace: 'nowrap', flexShrink: 0 }}>
                {new Date(log.createdAt).toLocaleString('fr-FR')}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

// ---- Tab: Notes ----
function TabNotes({
  notes, noteContent, onNoteChange, onAddNote,
}: {
  notes: AdminNote[]; noteContent: string
  onNoteChange: (v: string) => void
  onAddNote: (e: React.FormEvent) => void
}) {
  return (
    <div>
      <div style={{ fontSize: 15, fontWeight: 700, color: C.ink, marginBottom: 16 }}>Notes admin</div>
      <form
        onSubmit={onAddNote}
        style={{ marginBottom: 20, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}
      >
        <textarea
          value={noteContent}
          onChange={e => onNoteChange(e.target.value)}
          placeholder="Ajouter une note interne…"
          rows={3}
          style={{
            ...inputStyle, resize: 'vertical', width: '100%',
            fontFamily: 'inherit', lineHeight: 1.5,
          }}
          onFocus={e => {
            e.currentTarget.style.borderColor = C.blue
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(26,107,255,0.1)'
          }}
          onBlur={e => {
            e.currentTarget.style.borderColor = C.border
            e.currentTarget.style.boxShadow = 'none'
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
          <button
            type="submit"
            disabled={!noteContent.trim()}
            style={{
              padding: '8px 18px', borderRadius: 8,
              background: noteContent.trim() ? C.blue : C.border,
              color: noteContent.trim() ? '#fff' : C.mid,
              border: 'none', fontSize: 13, fontWeight: 600,
              cursor: noteContent.trim() ? 'pointer' : 'not-allowed',
              transition: 'background 0.15s',
            }}
          >
            Ajouter la note
          </button>
        </div>
      </form>

      {notes.length === 0 ? (
        <div style={{ padding: '32px 24px', textAlign: 'center', background: C.bg, borderRadius: 12, border: `1px solid ${C.border}`, color: C.mid, fontSize: 14 }}>
          Aucune note pour ce client.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {notes.map((note, i) => (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              style={{
                background: C.bg, border: `1px solid ${C.border}`,
                borderRadius: 10, padding: '14px 18px',
                borderLeft: `3px solid ${C.yellow}`,
              }}
            >
              <div style={{ fontSize: 13.5, whiteSpace: 'pre-wrap', color: C.ink, lineHeight: 1.6, marginBottom: 8 }}>
                {note.content}
              </div>
              <div style={{ fontSize: 11, color: C.mid }}>
                {new Date(note.createdAt).toLocaleString('fr-FR')}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
