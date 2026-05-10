// admin-internal/src/app/clients/[id]/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, User, Bot, Activity, StickyNote,
  RefreshCw, ShieldOff, ShieldCheck, Eye, Key,
  CheckCircle, XCircle, Copy, Check, MessageCircle,
  Clock, AlertCircle,
} from 'lucide-react'

// ============================================
// TypeScript Interfaces (Requirements 1.1, 1.2)
// ============================================

import { updateCredentials, updateBotConfig, toggleAutoRule, addAdminNote } from './actions'

type BusinessInfo = {
  aiPrompt?: string
  aiTone?: string
  aiFaqs?: Array<{ q: string; a: string }>
  routingRules?: Array<{ condition: string; action: string }>
  welcomeMessage?: string
  fallbackResponse?: string
}

type Conversation = {
  id: number
  status: string
  lastMessage: {
    content: string
    createdAt: string
  }
  contact: {
    id: number
    name: string
  }
}

// ============================================
// Parallel Data Fetching Functions (Requirement 1.3)
// ============================================

const CHATWOOT_BASE = 'http://127.0.0.1:3000'

async function fetchConversationsFromChatwoot(
  accountId: number,
  apiToken: string
): Promise<Conversation[]> {
  try {
    const response = await fetch(
      `${CHATWOOT_BASE}/api/v1/accounts/${accountId}/conversations`,
      {
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        next: { revalidate: 30 }, // Cache for 30 seconds
      }
    )
    
    if (!response.ok) {
      throw new Error(`Chatwoot API error: ${response.status}`)
    }
    
    const data = await response.json()
    return data.payload.map((conv: {
      id: number
      status: string
      messages?: Array<{ content?: string; created_at?: string }>
      contact?: { id: number; name?: string }
      updated_at?: string
    }) => ({
      id: conv.id,
      status: conv.status,
      lastMessage: {
        content: conv.messages?.[0]?.content || '',
        createdAt: conv.messages?.[0]?.created_at || conv.updated_at || new Date().toISOString(),
      },
      contact: {
        id: conv.contact?.id || 0,
        name: conv.contact?.name || 'Unknown',
      },
    }))
  } catch (error) {
    console.error('Failed to fetch Chatwoot conversations:', error)
    return []
  }
}

async function fetchBusinessData(clientId: string) {
  const res = await fetch(`/api/admin/clients/${clientId}`, {
    cache: 'no-store',
  })
  if (!res.ok) throw new Error('Failed to fetch business data')
  return res.json()
}

async function fetchConversationsData(clientId: string) {
  // First get the business to get credentials
  const res = await fetch(`/api/admin/clients/${clientId}`, {
    cache: 'no-store',
  })
  if (!res.ok) throw new Error('Failed to fetch client for conversations')
  const business = await res.json()
  
  if (!business.chatwootAccountId || !business.chatwootApiToken) {
    return { conversations: [], error: 'Missing Chatwoot credentials' }
  }
  
  try {
    const conversations = await fetchConversationsFromChatwoot(
      business.chatwootAccountId,
      business.chatwootApiToken
    )
    return { conversations, error: null }
  } catch (error) {
    return { conversations: [], error: String(error) }
  }
}

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

// Updated type definitions with BusinessInfo support
type AutoRule = { id: string; name: string; trigger: string; responseTemplate: string; active: boolean; conditions: Record<string, unknown> }
type ActivityLog = { id: string; action: string; metadata: Record<string, unknown> | null; createdAt: string }
type AdminNote = { id: string; content: string; createdAt: string }
type Business = {
  id: string; name: string; email: string; plan: string; status: string;
  trialEndsAt: string | null; chatwootAccountId: number | null; chatwootApiToken: string | null;
  businessInfo: BusinessInfo | null;
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
  // Task 2: Credentials saving state
  const [credentialsSaving, setCredentialsSaving] = useState(false)
  const [credentialsSuccess, setCredentialsSuccess] = useState(false)

  // Task 3: Bot Config saving state
  const [botConfigSaving, setBotConfigSaving] = useState(false)
  const [botConfigSuccess, setBotConfigSuccess] = useState(false)

  // Task 4: Recent Chats state
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [conversationsLoading, setConversationsLoading] = useState(false)
  const [conversationsError, setConversationsError] = useState<string | null>(null)

  // Task 3: Handler for saving bot config using Server Action
  async function handleSaveBotConfig(config: {
    aiPrompt?: string
    aiTone?: string
    aiFaqs?: Array<{ q: string; a: string }>
    routingRules?: Array<{ condition: string; action: string }>
  }) {
    setBotConfigSaving(true)
    setBotConfigSuccess(false)
    const result = await updateBotConfig(id, config)
    if (result.success) {
      // Refresh business data
      const res = await fetch(`/api/admin/clients/${id}`, { cache: 'no-store' })
      if (res.ok) {
        const updated = await res.json()
        setBusiness(updated)
        setForm(updated)
      }
      setBotConfigSuccess(true)
      setTimeout(() => setBotConfigSuccess(false), 3000)
    } else {
      console.error('Failed to save bot config:', result.error)
    }
    setBotConfigSaving(false)
  }

  // Task 4.1: Fetch conversations when business data is available
  const fetchConversations = useCallback(async (businessData: Business) => {
    if (!businessData.chatwootAccountId || !businessData.chatwootApiToken) {
      setConversationsError('Configurez les identifiants Chatwoot pour voir les conversations')
      return
    }
    
    setConversationsLoading(true)
    setConversationsError(null)
    
    try {
      const convs = await fetchConversationsFromChatwoot(
        businessData.chatwootAccountId,
        businessData.chatwootApiToken
      )
      setConversations(convs)
    } catch (err) {
      setConversationsError(String(err))
    } finally {
      setConversationsLoading(false)
    }
  }, [])

  // Task 4.3: Independent loading state for conversations
  useEffect(() => {
    fetch(`/api/admin/clients/${id}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(`API Error: ${r.status}`)
        return r.json()
      })
      .then((data: Business) => {
        // Prevent array mapping crashes by falling back to empty arrays
        const safeData = {
          ...data,
          autoRules: data.autoRules || [],
          activityLogs: data.activityLogs || [],
          adminNotes: data.adminNotes || [],
        }
        setBusiness(safeData); setForm(safeData)
        setNotes(safeData.adminNotes); setRules(safeData.autoRules)
        
        // Task 4.1: Fetch conversations after business data loads
        fetchConversations(safeData)
      })
      .catch((err) => {
        console.error(">>> FAILED TO LOAD CLIENT:", err)
        // Ensure business stays null to show the error state instead of spinning
      })
      .finally(() => {
        // ALWAYS stop the loading spinner, even if it crashes!
        setLoading(false)
      })
  }, [id, fetchConversations])

  async function handleSave() {
    setSaving(true)
    const res = await fetch(`/api/admin/clients/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
    })
    const updated = await res.json()
    setBusiness(updated); setForm(updated); setSaving(false)
  }

  // Task 2: Handler for credentials save using Server Action
  async function handleSaveCredentials(credentials: { chatwootAccountId?: number | null; chatwootApiToken?: string }) {
    setCredentialsSaving(true)
    setCredentialsSuccess(false)
    const result = await updateCredentials(id, credentials)
    if (result.success) {
      // Refresh business data
      const res = await fetch(`/api/admin/clients/${id}`, { cache: 'no-store' })
      if (res.ok) {
        const updated = await res.json()
        setBusiness(updated)
        setForm(updated)
      }
      setCredentialsSuccess(true)
      setTimeout(() => setCredentialsSuccess(false), 3000)
    } else {
      console.error('Failed to save credentials:', result.error)
    }
    setCredentialsSaving(false)
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
        Client introuvable ou erreur de chargement. Vérifiez les logs. <Link href="/admin/clients" style={{ color: C.blue }}>Retour</Link>
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
                // Task 2: Credentials section props
                credentialsSaving={credentialsSaving}
                credentialsSuccess={credentialsSuccess}
                onSaveCredentials={handleSaveCredentials}
                // Task 4: Recent Chats props
                conversations={conversations}
                conversationsLoading={conversationsLoading}
                conversationsError={conversationsError}
                onRefreshConversations={() => business && fetchConversations(business)}
              />
            )}
            {tab === 'bot' && (
              <TabBot 
                business={business} 
                rules={rules} 
                syncing={syncing} 
                syncMsg={syncMsg}
                onToggleRule={handleToggleRule} 
                onSync={handleSync}
                // Task 3: Bot config handlers
                botConfigSaving={botConfigSaving}
                botConfigSuccess={botConfigSuccess}
                onSaveBotConfig={handleSaveBotConfig}
              />
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
  // Task 2: Credentials section props
  credentialsSaving, credentialsSuccess, onSaveCredentials,
  // Task 4: Recent Chats props
  conversations, conversationsLoading, conversationsError, onRefreshConversations,
}: {
  form: Partial<Business>; business: Business; saving: boolean
  newPassword: string | null; copied: boolean
  onFormChange: (f: Partial<Business>) => void
  onSave: () => void; onResetPassword: () => void
  onStatusChange: (s: string) => void; onImpersonate: () => void
  onCopyPassword: () => void
  // Task 2: Credentials section props
  credentialsSaving: boolean
  credentialsSuccess: boolean
  onSaveCredentials: (credentials: { chatwootAccountId?: number | null; chatwootApiToken?: string }) => Promise<void>
  // Task 4: Recent Chats props
  conversations: Conversation[]
  conversationsLoading: boolean
  conversationsError: string | null
  onRefreshConversations: () => void
}) {
  // Task 2: Local state for credentials form fields (for separate save)
  const [credForm, setCredForm] = useState({
    chatwootAccountId: String(form.chatwootAccountId ?? ''),
    chatwootApiToken: form.chatwootApiToken ?? '',
  })
  const [showToken, setShowToken] = useState(false)

  // Sync local credForm when form changes from parent
  useEffect(() => {
    setCredForm({
      chatwootAccountId: String(form.chatwootAccountId ?? ''),
      chatwootApiToken: form.chatwootApiToken ?? '',
    })
  }, [form.chatwootAccountId, form.chatwootApiToken])

  async function handleSaveCredentialsClick() {
    await onSaveCredentials({
      chatwootAccountId: credForm.chatwootAccountId ? Number(credForm.chatwootAccountId) : null,
      chatwootApiToken: credForm.chatwootApiToken,
    })
  }
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
        {/* Task 2: Chatwoot Credentials Section with edit form */}
        <div style={{ background: C.bg, borderRadius: 12, border: `1px solid ${C.border}`, padding: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 7 }}>
            <ShieldCheck size={14} color={C.mid} /> Chatwoot - Credentials
          </div>
          
          {/* Account ID Field - Task 2.1 */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.mid, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Chatwoot Account ID
            </label>
            <input
              type="number"
              value={credForm.chatwootAccountId}
              onChange={e => setCredForm({ ...credForm, chatwootAccountId: e.target.value })}
              style={inputStyle}
              placeholder="Enter account ID"
              onFocus={e => {
                e.currentTarget.style.borderColor = C.blue
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(26,107,255,0.1)'
              }}
              onBlur={e => {
                e.currentTarget.style.borderColor = C.border
                e.currentTarget.style.boxShadow = 'none'
              }}
            />
          </div>
          
          {/* API Token Field with password masking - Task 2.2 */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.mid, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Chatwoot API Token
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showToken ? 'text' : 'password'}
                value={credForm.chatwootApiToken}
                onChange={e => setCredForm({ ...credForm, chatwootApiToken: e.target.value })}
                style={{ ...inputStyle, paddingRight: 40 }}
                placeholder="Enter API token"
                onFocus={e => {
                  e.currentTarget.style.borderColor = C.blue
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(26,107,255,0.1)'
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = C.border
                  e.currentTarget.style.boxShadow = 'none'
                }}
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                style={{
                  position: 'absolute', right: 8, top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none',
                  cursor: 'pointer', color: C.mid,
                  padding: 4, display: 'flex', alignItems: 'center',
                }}
              >
                {showToken ? <Eye size={16} /> : <Key size={16} />}
              </button>
            </div>
          </div>
          
          {/* Task 2.3: Save button with loading/success states */}
          <button
            onClick={handleSaveCredentialsClick}
            disabled={credentialsSaving}
            style={{
              width: '100%', padding: '10px 0',
              background: credentialsSaving ? C.mid : (credentialsSuccess ? C.green : C.blue),
              color: '#fff',
              border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600,
              cursor: credentialsSaving ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s, transform 0.1s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
            onMouseEnter={e => {
              if (!credentialsSaving && !credentialsSuccess) {
                (e.currentTarget as HTMLButtonElement).style.background = '#0047cc'
              }
            }}
            onMouseLeave={e => {
              if (!credentialsSaving && !credentialsSuccess) {
                (e.currentTarget as HTMLButtonElement).style.background = C.blue
              }
            }}
          >
            {credentialsSaving ? (
              <>Enregistrement…</>
            ) : credentialsSuccess ? (
              <>✓ Enregistré</>
            ) : (
              <>Enregistrer les credentials</>
            )}
          </button>
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

        {/* Task 4.2 & 4.3: Recent Chats Section */}
        <div style={{ background: C.bg, borderRadius: 12, border: `1px solid ${C.border}`, padding: 24, marginTop: 16 }}>
          <div style={{ 
            fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 16, 
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <MessageCircle size={14} color={C.mid} /> Conversations récentes
              {conversations.length > 0 && (
                <span style={{
                  marginLeft: 8, fontSize: 11, fontWeight: 600,
                  background: C.blueLight, color: C.blue,
                  padding: '2px 8px', borderRadius: 99,
                }}>
                  {conversations.length}
                </span>
              )}
            </div>
            <button
              onClick={onRefreshConversations}
              disabled={conversationsLoading}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 10px', borderRadius: 6,
                background: conversationsLoading ? C.bgAlt : 'transparent',
                border: `1px solid ${C.border}`,
                color: C.mid, fontSize: 12, cursor: conversationsLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <RefreshCw size={12} style={{ 
                animation: conversationsLoading ? 'spin 1s linear infinite' : 'none',
              }} />
              Actualiser
            </button>
          </div>

          {/* Task 4.3: Loading State - Skeleton */}
          {conversationsLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{
                  padding: '14px 16px', borderRadius: 10,
                  background: C.bgAlt, border: `1px solid ${C.border}`,
                }}>
                  <div style={{
                    height: 14, width: '40%', background: C.border,
                    borderRadius: 4, marginBottom: 8,
                    animation: 'pulse 1.5s ease-in-out infinite',
                  }} />
                  <div style={{
                    height: 12, width: '70%', background: C.border,
                    borderRadius: 4,
                    animation: 'pulse 1.5s ease-in-out infinite',
                    animationDelay: '0.1s',
                  }} />
                </div>
              ))}
            </div>
          )}

          {/* Task 4.2: Error State */}
          {!conversationsLoading && conversationsError && (
            <div style={{
              padding: '20px 16px', borderRadius: 10,
              background: C.redBg, border: `1px solid #fca5a5`,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <AlertCircle size={16} color={C.red} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.red, marginBottom: 2 }}>
                  Erreur de chargement
                </div>
                <div style={{ fontSize: 12, color: C.red, opacity: 0.8 }}>
                  {conversationsError}
                </div>
              </div>
            </div>
          )}

          {/* Task 4.2: Conversation List */}
          {!conversationsLoading && !conversationsError && (
            <>
              {conversations.length === 0 ? (
                <div style={{
                  padding: '30px 20px', textAlign: 'center',
                  background: C.bgAlt, borderRadius: 10,
                  color: C.mid, fontSize: 13,
                }}>
                  <MessageCircle size={24} style={{ marginBottom: 8, opacity: 0.5 }} />
                  <div>Aucune conversation trouvée</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {conversations.map((conv) => (
                    <ConversationItem key={conv.id} conversation={conv} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// Task 4.2: Conversation Item Component
function ConversationItem({ conversation }: { conversation: Conversation }) {
  const isOpen = conversation.status === 'open'
  const timeAgo = formatTimeAgo(conversation.lastMessage.createdAt)
  
  return (
    <div style={{
      padding: '14px 16px', borderRadius: 10,
      background: C.bg, border: `1px solid ${C.border}`,
      display: 'flex', alignItems: 'flex-start', gap: 12,
      transition: 'border-color 0.15s, box-shadow 0.15s',
    }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = C.blue
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(26,107,255,0.08)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = C.border
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {/* Status indicator */}
      <div style={{
        width: 10, height: 10, borderRadius: '50%',
        background: isOpen ? C.green : C.mid,
        marginTop: 5, flexShrink: 0,
      }} />
      
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 4,
        }}>
          <div style={{
            fontSize: 14, fontWeight: 600, color: C.ink,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {conversation.contact.name}
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 11, color: C.mid, flexShrink: 0,
          }}>
            <Clock size={11} />
            {timeAgo}
          </div>
        </div>
        
        <div style={{
          fontSize: 13, color: C.mid,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {conversation.lastMessage.content || <em style={{ opacity: 0.6 }}>Aucun message</em>}
        </div>
      </div>
      
      {/* Status badge */}
      <div style={{
        padding: '2px 8px', borderRadius: 99,
        fontSize: 10, fontWeight: 600, textTransform: 'uppercase',
        background: isOpen ? C.greenBg : C.bgAlt,
        color: isOpen ? C.green : C.mid,
        flexShrink: 0,
      }}>
        {conversation.status}
      </div>
    </div>
  )
}

// Helper function to format time ago
function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  
  if (diffMins < 1) return 'à l\'instant'
  if (diffMins < 60) return `il y a ${diffMins} min`
  if (diffHours < 24) return `il y a ${diffHours}h`
  if (diffDays < 7) return `il y a ${diffDays}j`
  return date.toLocaleDateString('fr-FR')
}
function TabBot({
  business, rules, syncing, syncMsg, onToggleRule, onSync,
  botConfigSaving, botConfigSuccess, onSaveBotConfig,
}: {
  business: Business | null
  rules: AutoRule[]; syncing: boolean
  syncMsg: { text: string; ok: boolean } | null
  onToggleRule: (id: string, active: boolean) => void
  onSync: () => void
  // Task 3: Bot config props
  botConfigSaving: boolean
  botConfigSuccess: boolean
  onSaveBotConfig: (config: {
    aiPrompt?: string
    aiTone?: string
    aiFaqs?: Array<{ q: string; a: string }>
    routingRules?: Array<{ condition: string; action: string }>
  }) => Promise<void>
}) {
  // Task 3: Local state for bot configuration form
  const businessInfo = business?.businessInfo || {}
  const [botConfig, setBotConfig] = useState({
    aiPrompt: businessInfo.aiPrompt || '',
    aiTone: businessInfo.aiTone || 'professional',
    aiFaqs: businessInfo.aiFaqs || [] as Array<{ q: string; a: string }>,
    routingRules: businessInfo.routingRules || [] as Array<{ condition: string; action: string }>,
  })

  // Sync local state when business changes
  useEffect(() => {
    if (business?.businessInfo) {
      setBotConfig({
        aiPrompt: business.businessInfo.aiPrompt || '',
        aiTone: business.businessInfo.aiTone || 'professional',
        aiFaqs: business.businessInfo.aiFaqs || [],
        routingRules: business.businessInfo.routingRules || [],
      })
    }
  }, [business?.businessInfo])

  // Task 3.1: Add new FAQ item
  const addFaq = () => {
    setBotConfig(prev => ({
      ...prev,
      aiFaqs: [...prev.aiFaqs, { q: '', a: '' }],
    }))
  }

  // Task 3.1: Remove FAQ item
  const removeFaq = (index: number) => {
    setBotConfig(prev => ({
      ...prev,
      aiFaqs: prev.aiFaqs.filter((_, i) => i !== index),
    }))
  }

  // Task 3.1: Update FAQ item
  const updateFaq = (index: number, field: 'q' | 'a', value: string) => {
    setBotConfig(prev => ({
      ...prev,
      aiFaqs: prev.aiFaqs.map((faq, i) => 
        i === index ? { ...faq, [field]: value } : faq
      ),
    }))
  }

  // Task 3.4: Add new routing rule
  const addRoutingRule = () => {
    setBotConfig(prev => ({
      ...prev,
      routingRules: [...prev.routingRules, { condition: '', action: '' }],
    }))
  }

  // Task 3.4: Remove routing rule
  const removeRoutingRule = (index: number) => {
    setBotConfig(prev => ({
      ...prev,
      routingRules: prev.routingRules.filter((_, i) => i !== index),
    }))
  }

  // Task 3.4: Update routing rule
  const updateRoutingRule = (index: number, field: 'condition' | 'action', value: string) => {
    setBotConfig(prev => ({
      ...prev,
      routingRules: prev.routingRules.map((rule, i) => 
        i === index ? { ...rule, [field]: value } : rule
      ),
    }))
  }

  // Task 3.5: Handle save click
  async function handleSaveBotConfigClick() {
    await onSaveBotConfig(botConfig)
  }

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

      {/* Task 3: Bot AI Prompt Section */}
      <div style={{ 
        marginTop: 28, 
        paddingTop: 24, 
        borderTop: `1px solid ${C.border}`,
      }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.ink, marginBottom: 20 }}>
          Configuration AI du Bot
        </div>

        <div style={{ background: C.bg, borderRadius: 12, border: `1px solid ${C.border}`, padding: 24 }}>
          {/* Task 3.1: AI System Prompt Textarea */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.mid, marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              System Prompt AI
            </label>
            <textarea
              value={botConfig.aiPrompt}
              onChange={e => setBotConfig(prev => ({ ...prev, aiPrompt: e.target.value }))}
              placeholder="Entrez les instructions system pour le bot AI..."
              rows={5}
              style={{
                width: '100%', padding: '12px',
                border: `1px solid ${C.border}`, borderRadius: 8,
                fontSize: 13.5, color: C.ink, background: C.bg,
                outline: 'none', boxSizing: 'border-box',
                fontFamily: 'inherit', resize: 'vertical',
                transition: 'border-color 0.15s, box-shadow 0.15s',
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
          </div>

          {/* Task 3.2: Bot Tone Configuration */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.mid, marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Ton du Bot
            </label>
            <select
              value={botConfig.aiTone}
              onChange={e => setBotConfig(prev => ({ ...prev, aiTone: e.target.value }))}
              style={{
                width: '100%', padding: '9px 12px',
                border: `1px solid ${C.border}`, borderRadius: 8,
                fontSize: 13.5, color: C.ink, background: C.bg,
                outline: 'none', boxSizing: 'border-box', cursor: 'pointer',
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
              onFocus={e => {
                e.currentTarget.style.borderColor = C.blue
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(26,107,255,0.1)'
              }}
              onBlur={e => {
                e.currentTarget.style.borderColor = C.border
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <option value="professional">Professional</option>
              <option value="friendly">Friendly</option>
              <option value="casual">Casual</option>
            </select>
          </div>

          {/* Task 3.3: FAQs Configuration */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.mid, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                FAQs
              </label>
              <button
                type="button"
                onClick={addFaq}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '5px 10px', borderRadius: 6,
                  background: C.blueLight, border: 'none',
                  color: C.blue, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}
              >
                + Ajouter
              </button>
            </div>
            {botConfig.aiFaqs.length === 0 ? (
              <div style={{ 
                padding: '20px', textAlign: 'center', 
                background: C.bgAlt, borderRadius: 8, color: C.mid, fontSize: 13 
              }}>
                Aucune FAQ configurée. Cliquez sur "Ajouter" pour en créer une.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {botConfig.aiFaqs.map((faq, index) => (
                  <div key={index} style={{
                    background: C.bgAlt, borderRadius: 8, padding: 12,
                    display: 'flex', flexDirection: 'column', gap: 8,
                  }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <input
                          type="text"
                          value={faq.q}
                          onChange={e => updateFaq(index, 'q', e.target.value)}
                          placeholder="Question"
                          style={{
                            width: '100%', padding: '8px 10px',
                            border: `1px solid ${C.border}`, borderRadius: 6,
                            fontSize: 13, color: C.ink, background: C.bg,
                            outline: 'none', boxSizing: 'border-box',
                          }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <input
                          type="text"
                          value={faq.a}
                          onChange={e => updateFaq(index, 'a', e.target.value)}
                          placeholder="Réponse"
                          style={{
                            width: '100%', padding: '8px 10px',
                            border: `1px solid ${C.border}`, borderRadius: 6,
                            fontSize: 13, color: C.ink, background: C.bg,
                            outline: 'none', boxSizing: 'border-box',
                          }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFaq(index)}
                        style={{
                          padding: '6px 8px', borderRadius: 6,
                          background: C.redBg, border: 'none',
                          color: C.red, fontSize: 12, cursor: 'pointer',
                          display: 'flex', alignItems: 'center',
                        }}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Task 3.4: Routing Rules Configuration */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.mid, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Règles de Routage
              </label>
              <button
                type="button"
                onClick={addRoutingRule}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '5px 10px', borderRadius: 6,
                  background: C.blueLight, border: 'none',
                  color: C.blue, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}
              >
                + Ajouter
              </button>
            </div>
            {botConfig.routingRules.length === 0 ? (
              <div style={{ 
                padding: '20px', textAlign: 'center', 
                background: C.bgAlt, borderRadius: 8, color: C.mid, fontSize: 13 
              }}>
                Aucune règle de routage configurée. Cliquez sur "Ajouter" pour en créer une.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {botConfig.routingRules.map((rule, index) => (
                  <div key={index} style={{
                    background: C.bgAlt, borderRadius: 8, padding: 12,
                    display: 'flex', flexDirection: 'column', gap: 8,
                  }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <input
                          type="text"
                          value={rule.condition}
                          onChange={e => updateRoutingRule(index, 'condition', e.target.value)}
                          placeholder="Condition (ex: contains:pricing)"
                          style={{
                            width: '100%', padding: '8px 10px',
                            border: `1px solid ${C.border}`, borderRadius: 6,
                            fontSize: 13, color: C.ink, background: C.bg,
                            outline: 'none', boxSizing: 'border-box',
                          }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <input
                          type="text"
                          value={rule.action}
                          onChange={e => updateRoutingRule(index, 'action', e.target.value)}
                          placeholder="Action (ex: route_to:support)"
                          style={{
                            width: '100%', padding: '8px 10px',
                            border: `1px solid ${C.border}`, borderRadius: 6,
                            fontSize: 13, color: C.ink, background: C.bg,
                            outline: 'none', boxSizing: 'border-box',
                          }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeRoutingRule(index)}
                        style={{
                          padding: '6px 8px', borderRadius: 6,
                          background: C.redBg, border: 'none',
                          color: C.red, fontSize: 12, cursor: 'pointer',
                          display: 'flex', alignItems: 'center',
                        }}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Task 3.5: Save Button with Loading/Success States */}
          <button
            onClick={handleSaveBotConfigClick}
            disabled={botConfigSaving}
            style={{
              width: '100%', padding: '12px 0',
              background: botConfigSaving ? C.mid : (botConfigSuccess ? C.green : C.blue),
              color: '#fff',
              border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600,
              cursor: botConfigSaving ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s, transform 0.1s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
            onMouseEnter={e => {
              if (!botConfigSaving && !botConfigSuccess) {
                (e.currentTarget as HTMLButtonElement).style.background = '#0047cc'
              }
            }}
            onMouseLeave={e => {
              if (!botConfigSaving && !botConfigSuccess) {
                (e.currentTarget as HTMLButtonElement).style.background = C.blue
              }
            }}
          >
            {botConfigSaving ? (
              <>Enregistrement…</>
            ) : botConfigSuccess ? (
              <>✓ Enregistré</>
            ) : (
              <>Enregistrer la configuration AI</>
            )}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
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