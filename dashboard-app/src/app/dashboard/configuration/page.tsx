'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { useTheme, palette } from '@/lib/theme'
import {
  Building2, Bot, Clock, Package, Radio,
  Plus, Trash2, Edit2, CheckCircle, AlertCircle,
  ToggleLeft, ToggleRight, Save, RefreshCw, X,
} from 'lucide-react'
import dynamic from 'next/dynamic'

const FacebookInstagramConnect = dynamic(() => import('@/components/FacebookInstagramConnect'), { ssr: false })

function makeD(dark: boolean) {
  const P = palette()
  return {
    bg: P.bg, surface: P.surface, surfaceHover: P.surface2,
    border: P.border, borderHover: P.border2,
    text: P.text, textMuted: P.text3, textSub: P.text2,
    accent: P.accent, success: P.success, danger: P.danger, warning: P.warning,
    radius: 10, radiusSm: 7,
  }
}

function useD() {
  const dark = useTheme()
  return makeD(dark)
}

type Tab = 'entreprise' | 'bot' | 'horaires' | 'catalogue' | 'canaux'

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'entreprise', label: 'Entreprise',    icon: <Building2 size={14} /> },
  { key: 'bot',        label: 'Bot',           icon: <Bot size={14} /> },
  { key: 'horaires',   label: 'Horaires',      icon: <Clock size={14} /> },
  { key: 'catalogue',  label: 'Catalogue',     icon: <Package size={14} /> },
  { key: 'canaux',     label: 'Canaux',        icon: <Radio size={14} /> },
]

const DAY_NAMES = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

function useInputStyle(): React.CSSProperties {
  const D = useD()
  const dark = useTheme()
  return {
    width: '100%', padding: '9px 12px', borderRadius: D.radiusSm,
    border: `1px solid ${D.border}`, background: D.bg,
    color: D.text, fontSize: 13, outline: 'none',
    boxSizing: 'border-box', transition: 'border-color 0.15s',
  }
}

function Label({ children }: { children: React.ReactNode }) {
  const D = useD()
  const dark = useTheme()
  return (
    <label style={{ fontSize: 11, fontWeight: 500, color: D.textMuted, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      {children}
    </label>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  )
}

function SectionCard({ title, children }: { title?: string; children: React.ReactNode }) {
  const D = useD()
  const dark = useTheme()
  const isDark = dark
  return (
    <div style={{ 
      background: D.surface, 
      border: `1px solid ${D.border}`, 
      borderRadius: D.radius, 
      padding: '20px 24px', 
      marginBottom: 16,
      boxShadow: isDark 
        ? '0 1px 3px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.3)' 
        : '0 1px 3px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.08)',
      position: 'relative',
      zIndex: 1,
    }}>
      {title && <div style={{ fontSize: 13, fontWeight: 600, color: D.text, marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${D.border}` }}>{title}</div>}
      {children}
    </div>
  )
}

// ── Toast ──────────────────────────────────────────────────────────────────────
function Toast({ msg, type, onClose }: { msg: string; type: 'success' | 'error'; onClose: () => void }) {
  const D = useD()
  const dark = useTheme()
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '12px 16px', borderRadius: 10,
      background: D.surface, border: `1px solid ${D.border}`,
      boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
      maxWidth: 360,
    }}>
      {type === 'success' ? <CheckCircle size={16} color={D.success} /> : <AlertCircle size={16} color={D.danger} />}
      <span style={{ fontSize: 13, color: D.text, flex: 1 }}>{msg}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: D.textMuted, cursor: 'pointer' }}>
        <X size={14} />
      </button>
    </div>
  )
}

// ── Save button ────────────────────────────────────────────────────────────────
function SaveBtn({ saving, onClick }: { saving: boolean; onClick: () => void }) {
  const D = useD()
  const dark = useTheme()
  return (
    <div style={{ marginTop: 24, paddingTop: 16, borderTop: `1px solid ${D.border}`, display: 'flex', justifyContent: 'flex-end' }}>
      <button
        onClick={onClick}
        disabled={saving}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '9px 22px', borderRadius: D.radiusSm,
          background: D.accent, color: '#fff', border: 'none',
          fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
          opacity: saving ? 0.7 : 1, transition: 'opacity 0.15s',
        }}
      >
        {saving ? <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={13} />}
        {saving ? 'Sauvegarde...' : 'Sauvegarder'}
      </button>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ConfigurationPage() {
  const D = useD()
  const dark = useTheme()
  const [tab, setTab] = useState<Tab>('entreprise')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  // Business fields
  const [biz, setBiz] = useState({
    name: '', description: '', phone: '', address: '',
    botMode: '' as string, botName: '', greetingMessage: '',
    alwaysOpen: false, ownerPhone: '',
  })
  // BotConfig fields
  const [bc, setBc] = useState({
    botActive: true, handoverPhone: '', handoverTriggers: [] as string[],
    collectFields: [] as string[], strictInstructionBlock: '',
  })
  // Schedules
  const [schedules, setSchedules] = useState<any[]>([])
  // Products / Services
  const [products, setProducts] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  const fetchConfig = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/config')
      const data = await res.json()
      if (data.success) {
        const b = data.data
        setBiz({
          name: b.name ?? '',
          description: b.description ?? '',
          phone: b.phone ?? '',
          address: b.address ?? '',
          botMode: b.botMode ?? '',
          botName: b.botName ?? '',
          greetingMessage: b.greetingMessage ?? '',
          alwaysOpen: b.alwaysOpen ?? false,
          ownerPhone: b.ownerPhone ?? '',
        })
        if (b.botConfig) {
          setBc({
            botActive: b.botConfig.botActive ?? true,
            handoverPhone: b.botConfig.handoverPhone ?? '',
            handoverTriggers: b.botConfig.handoverTriggers ?? [],
            collectFields: b.botConfig.collectFields ?? [],
            strictInstructionBlock: b.botConfig.strictInstructionBlock ?? '',
          })
        }
        setSchedules(b.schedules ?? [])
        setProducts(b.products ?? [])
        setServices(b.services ?? [])
      }
    } catch (err) {
      showToast('Erreur lors du chargement', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchConfig() }, [fetchConfig])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ business: biz, botConfig: bc }),
      })
      const data = await res.json()
      if (data.success) showToast('Configuration sauvegardée')
      else showToast(data.error || 'Erreur', 'error')
    } catch {
      showToast('Erreur réseau', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: D.textMuted, fontSize: 13 }}>
        Chargement...
      </div>
    )
  }

  return (
    <div style={{ padding: 'clamp(12px, 3vw, 32px)', paddingBottom: 80, maxWidth: 780, margin: '0 auto', position: 'relative', zIndex: 1 }}>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{ marginBottom: 24, position: 'relative', zIndex: 2 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: D.text, margin: 0, letterSpacing: '-0.02em' }}>Configuration</h1>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 24, background: D.surface, border: `1px solid ${D.border}`, borderRadius: D.radius, padding: 4, width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch', position: 'relative', zIndex: 2 }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '7px 10px', borderRadius: D.radiusSm, border: 'none', cursor: 'pointer',
              background: tab === t.key ? D.surfaceHover : 'transparent',
              color: tab === t.key ? D.text : D.textMuted,
              fontSize: 12, fontWeight: tab === t.key ? 600 : 400,
              transition: 'all 0.15s',
              whiteSpace: 'nowrap',
              position: 'relative',
              zIndex: 1,
            }}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'entreprise' && (
        <EntrepriseTab biz={biz} setBiz={setBiz} saving={saving} onSave={handleSave} />
      )}
      {tab === 'bot' && (
        <BotTab bc={bc} setBc={setBc} biz={biz} setBiz={setBiz} saving={saving} onSave={handleSave} />
      )}
      {tab === 'horaires' && (
        <HorairesTab
          alwaysOpen={biz.alwaysOpen}
          setAlwaysOpen={v => setBiz(b => ({ ...b, alwaysOpen: v }))}
          schedules={schedules}
          setSchedules={setSchedules}
          saving={saving}
          onSave={handleSave}
          showToast={showToast}
        />
      )}
      {tab === 'catalogue' && (
        <CatalogueTab
          products={products}
          setProducts={setProducts}
          services={services}
          setServices={setServices}
          showToast={showToast}
        />
      )}
      {tab === 'canaux' && (
        <CanauxTab />
      )}
    </div>
  )
}

// ── Entreprise Tab ─────────────────────────────────────────────────────────────
function EntrepriseTab({ biz, setBiz, saving, onSave }: { biz: any; setBiz: any; saving: boolean; onSave: () => void }) {
  const D = useD()
  const dark = useTheme()
  const inputStyle = useInputStyle()
  const modes = [
    { value: 'INFO_ONLY', label: 'Informations uniquement' },
    { value: 'ORDERS', label: 'Commandes' },
    { value: 'APPOINTMENTS', label: 'Rendez-vous' },
    { value: 'BOTH', label: 'Commandes + Rendez-vous' },
  ]
  return (
    <>
      <SectionCard title="Informations">
        <div style={{ display: 'grid', gap: 14 }}>
          <Field label="Nom de l'entreprise *">
            <input
              style={inputStyle}
              value={biz.name}
              onChange={e => setBiz((b: any) => ({ ...b, name: e.target.value }))}
              placeholder="Nom..."
              onFocus={e => (e.target as HTMLInputElement).style.borderColor = D.accent}
              onBlur={e => (e.target as HTMLInputElement).style.borderColor = D.border}
            />
          </Field>
          <Field label="Description">
            <textarea
              style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }}
              value={biz.description}
              onChange={e => setBiz((b: any) => ({ ...b, description: e.target.value }))}
              placeholder="Décrivez votre activité..."
              onFocus={e => (e.target as HTMLTextAreaElement).style.borderColor = D.accent}
              onBlur={e => (e.target as HTMLTextAreaElement).style.borderColor = D.border}
            />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Field label="Téléphone">
              <input
                style={inputStyle}
                value={biz.phone}
                onChange={e => setBiz((b: any) => ({ ...b, phone: e.target.value }))}
                placeholder="+216..."
                onFocus={e => (e.target as HTMLInputElement).style.borderColor = D.accent}
                onBlur={e => (e.target as HTMLInputElement).style.borderColor = D.border}
              />
            </Field>
            <Field label="Adresse">
              <input
                style={inputStyle}
                value={biz.address}
                onChange={e => setBiz((b: any) => ({ ...b, address: e.target.value }))}
                placeholder="Adresse..."
                onFocus={e => (e.target as HTMLInputElement).style.borderColor = D.accent}
                onBlur={e => (e.target as HTMLInputElement).style.borderColor = D.border}
              />
            </Field>
          </div>
          <Field label="Mode du bot *">
            <select
              style={{ ...inputStyle, cursor: 'pointer' }}
              value={biz.botMode}
              onChange={e => setBiz((b: any) => ({ ...b, botMode: e.target.value }))}
            >
              <option value="">Sélectionner...</option>
              {modes.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </Field>
        </div>
      </SectionCard>
      <SaveBtn saving={saving} onClick={onSave} />
    </>
  )
}

// ── Bot Tab ────────────────────────────────────────────────────────────────────
function BotTab({ bc, setBc, biz, setBiz, saving, onSave }: { bc: any; setBc: any; biz: any; setBiz: any; saving: boolean; onSave: () => void }) {
  const D = useD()
  const dark = useTheme()
  const inputStyle = useInputStyle()
  const [newTrigger, setNewTrigger] = useState('')
  return (
    <>
      <SectionCard title="Paramètres du bot">
        <div style={{ display: 'grid', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: D.text }}>Bot actif</div>
              <div style={{ fontSize: 12, color: D.textMuted, marginTop: 2 }}>Le bot répond automatiquement aux clients</div>
            </div>
            <button
              onClick={() => setBc((b: any) => ({ ...b, botActive: !b.botActive }))}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: bc.botActive ? D.success : D.textMuted }}
            >
              {bc.botActive ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
            </button>
          </div>
          <Field label="Nom du bot">
            <input
              style={inputStyle}
              value={biz.botName}
              onChange={e => setBiz((b: any) => ({ ...b, botName: e.target.value }))}
              placeholder="Ex: Assistant Répondly"
              onFocus={e => (e.target as HTMLInputElement).style.borderColor = D.accent}
              onBlur={e => (e.target as HTMLInputElement).style.borderColor = D.border}
            />
          </Field>
          <Field label="Message d'accueil">
            <textarea
              style={{ ...inputStyle, resize: 'vertical', minHeight: 72 }}
              value={biz.greetingMessage}
              onChange={e => setBiz((b: any) => ({ ...b, greetingMessage: e.target.value }))}
              placeholder="Bonjour ! Comment puis-je vous aider ?"
              onFocus={e => (e.target as HTMLTextAreaElement).style.borderColor = D.accent}
              onBlur={e => (e.target as HTMLTextAreaElement).style.borderColor = D.border}
            />
          </Field>
          <Field label="Téléphone handover">
            <input
              style={inputStyle}
              value={bc.handoverPhone}
              onChange={e => setBc((b: any) => ({ ...b, handoverPhone: e.target.value }))}
              placeholder="+216 XX XXX XXX"
              onFocus={e => (e.target as HTMLInputElement).style.borderColor = D.accent}
              onBlur={e => (e.target as HTMLInputElement).style.borderColor = D.border}
            />
          </Field>
          <Field label="Téléphone propriétaire (notifications)">
            <input
              style={inputStyle}
              value={biz.ownerPhone}
              onChange={e => setBiz((b: any) => ({ ...b, ownerPhone: e.target.value }))}
              placeholder="+216 XX XXX XXX"
              onFocus={e => (e.target as HTMLInputElement).style.borderColor = D.accent}
              onBlur={e => (e.target as HTMLInputElement).style.borderColor = D.border}
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="Mots-clés de transfert humain">
        <p style={{ fontSize: 12, color: D.textMuted, margin: '0 0 14px' }}>
          Ces mots dans un message déclenchent un transfert vers un humain.
        </p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input
            style={{ ...inputStyle, flex: 1 }}
            value={newTrigger}
            onChange={e => setNewTrigger(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && newTrigger.trim()) {
                setBc((b: any) => ({ ...b, handoverTriggers: [...b.handoverTriggers, newTrigger.trim()] }))
                setNewTrigger('')
              }
            }}
            placeholder="Ajouter un mot-clé... (Entrée)"
            onFocus={e => (e.target as HTMLInputElement).style.borderColor = D.accent}
            onBlur={e => (e.target as HTMLInputElement).style.borderColor = D.border}
          />
          <button
            onClick={() => {
              if (newTrigger.trim()) {
                setBc((b: any) => ({ ...b, handoverTriggers: [...b.handoverTriggers, newTrigger.trim()] }))
                setNewTrigger('')
              }
            }}
            style={{ padding: '9px 16px', borderRadius: D.radiusSm, background: D.accent, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13 }}
          >
            <Plus size={14} />
          </button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {bc.handoverTriggers.map((t: string, i: number) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 9999, background: 'rgba(59,130,246,0.1)', color: D.accent, fontSize: 12 }}>
              {t}
              <button onClick={() => setBc((b: any) => ({ ...b, handoverTriggers: b.handoverTriggers.filter((_: string, j: number) => j !== i) }))} style={{ background: 'none', border: 'none', color: D.accent, cursor: 'pointer', padding: 0, lineHeight: 1 }}>×</button>
            </span>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Contexte & Instructions">
        <p style={{ fontSize: 12, color: D.textMuted, margin: '0 0 14px' }}>
          Informations supplémentaires que le bot doit connaître. Ces instructions sont prioritaires.
        </p>
        <textarea
          style={{ ...inputStyle, resize: 'vertical', minHeight: 100 }}
          value={bc.strictInstructionBlock}
          onChange={e => setBc((b: any) => ({ ...b, strictInstructionBlock: e.target.value }))}
          placeholder="Ex: Nous ne livrons pas en dehors de Tunis. Les paiements sont en espèces uniquement..."
          onFocus={e => (e.target as HTMLTextAreaElement).style.borderColor = D.accent}
          onBlur={e => (e.target as HTMLTextAreaElement).style.borderColor = D.border}
        />
      </SectionCard>

      <SaveBtn saving={saving} onClick={onSave} />
    </>
  )
}

// ── Horaires Tab ───────────────────────────────────────────────────────────────
function HorairesTab({ alwaysOpen, setAlwaysOpen, schedules, setSchedules, saving, onSave, showToast }: {
  alwaysOpen: boolean; setAlwaysOpen: (v: boolean) => void
  schedules: any[]; setSchedules: React.Dispatch<React.SetStateAction<any[]>>
  saving: boolean; onSave: () => void
  showToast: (msg: string, type?: 'success' | 'error') => void
}) {
  const D = useD()
  const dark = useTheme()
  const inputStyle = useInputStyle()
  const [savingSchedule, setSavingSchedule] = useState(false)

  const upsertSchedule = async (dayOfWeek: number, field: 'openTime' | 'closeTime' | 'closed', value: string | boolean) => {
    const existing = schedules.find((s: any) => s.dayOfWeek === dayOfWeek)
    const updated = { ...existing, dayOfWeek, [field]: value }

    setSavingSchedule(true)
    try {
      if (existing?.id) {
        await fetch(`/api/schedules/${existing.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [field]: value }),
        })
      } else {
        const res = await fetch('/api/schedules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dayOfWeek, openTime: updated.openTime || '09:00', closeTime: updated.closeTime || '18:00', closed: updated.closed || false }),
        })
        const data = await res.json()
        if (data.success) {
          setSchedules((prev: any[]) => {
            const filtered = prev.filter((s: any) => s.dayOfWeek !== dayOfWeek)
            return [...filtered, data.data].sort((a: any, b: any) => a.dayOfWeek - b.dayOfWeek)
          })
          return
        }
      }
      setSchedules((prev: any[]) => {
        const filtered = prev.filter((s: any) => s.dayOfWeek !== dayOfWeek)
        return [...filtered, updated].sort((a: any, b: any) => a.dayOfWeek - b.dayOfWeek)
      })
    } catch {
      showToast('Erreur lors de la sauvegarde', 'error')
    } finally {
      setSavingSchedule(false)
    }
  }

  return (
    <>
      <SectionCard>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: D.text, marginBottom: 4 }}>Toujours ouvert</div>
            <div style={{ fontSize: 12, color: D.textMuted }}>Le bot répond 24h/24, 7j/7 sans restrictions d'horaires</div>
          </div>
          <button
            onClick={() => setAlwaysOpen(!alwaysOpen)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: alwaysOpen ? D.success : D.textMuted }}
          >
            {alwaysOpen ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
          </button>
        </div>
      </SectionCard>

      {!alwaysOpen && (
        <SectionCard title="Horaires par jour">
          {savingSchedule && (
            <div style={{ fontSize: 11, color: D.textMuted, marginBottom: 12 }}>Sauvegarde en cours...</div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {DAY_NAMES.map((day, idx) => {
              const s = schedules.find((sc: any) => sc.dayOfWeek === idx)
              const closed = s?.closed ?? false
              return (
                <div key={day} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', borderRadius: D.radiusSm, background: D.bg, border: `1px solid ${D.border}` }}>
                  <div style={{ width: 80, fontSize: 12, fontWeight: 500, color: D.text }}>{day}</div>
                  <button
                    onClick={() => upsertSchedule(idx, 'closed', !closed)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: closed ? D.textMuted : D.success, flexShrink: 0 }}
                  >
                    {closed ? <ToggleLeft size={20} /> : <ToggleRight size={20} />}
                  </button>
                  {closed ? (
                    <span style={{ fontSize: 12, color: D.textMuted }}>Fermé</span>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input
                        type="time"
                        value={s?.openTime || '09:00'}
                        onChange={e => upsertSchedule(idx, 'openTime', e.target.value)}
                        style={{ ...inputStyle, width: 100, padding: '5px 8px', fontSize: 12 }}
                      />
                      <span style={{ fontSize: 12, color: D.textMuted }}>→</span>
                      <input
                        type="time"
                        value={s?.closeTime || '18:00'}
                        onChange={e => upsertSchedule(idx, 'closeTime', e.target.value)}
                        style={{ ...inputStyle, width: 100, padding: '5px 8px', fontSize: 12 }}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </SectionCard>
      )}

      <SaveBtn saving={saving} onClick={onSave} />
    </>
  )
}

// ── Catalogue Tab ──────────────────────────────────────────────────────────────
function CatalogueTab({ products, setProducts, services, setServices, showToast }: {
  products: any[]; setProducts: any; services: any[]; setServices: any
  showToast: (msg: string, type?: 'success' | 'error') => void
}) {
  const D = useD()
  const dark = useTheme()
  const inputStyle = useInputStyle()
  const [subTab, setSubTab] = useState<'products' | 'services'>('products')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', description: '', price: '', durationMinutes: '', available: true })
  const [saving, setSaving] = useState(false)

  const resetForm = () => { setForm({ name: '', description: '', price: '', durationMinutes: '', available: true }); setEditingId(null); setShowForm(false) }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const endpoint = subTab === 'products' ? '/api/products' : '/api/services'
      const payload: any = {
        name: form.name,
        description: form.description,
        price: parseFloat(form.price),
        available: form.available,
        ...(subTab === 'services' && { durationMinutes: parseInt(form.durationMinutes) }),
      }
      const method = editingId ? 'PATCH' : 'POST'
      const url = editingId ? `${endpoint}/${editingId}` : endpoint
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await res.json()
      if (data.success) {
        showToast(editingId ? 'Modifié' : 'Ajouté')
        resetForm()
        const refreshRes = await fetch(endpoint)
        const refreshData = await refreshRes.json()
        if (subTab === 'products') setProducts(refreshData.data)
        else setServices(refreshData.data)
      } else showToast(data.error || 'Erreur', 'error')
    } catch { showToast('Erreur réseau', 'error') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    const endpoint = subTab === 'products' ? `/api/products/${id}` : `/api/services/${id}`
    const res = await fetch(endpoint, { method: 'DELETE' })
    const data = await res.json()
    if (data.success) {
      showToast('Supprimé')
      if (subTab === 'products') setProducts((p: any[]) => p.filter(x => x.id !== id))
      else setServices((s: any[]) => s.filter(x => x.id !== id))
    } else showToast(data.error || 'Erreur', 'error')
  }

  const startEdit = (item: any) => {
    setForm({ name: item.name, description: item.description || '', price: String(item.price), durationMinutes: String(item.durationMinutes || ''), available: item.available })
    setEditingId(item.id)
    setShowForm(true)
  }

  const items = subTab === 'products' ? products : services

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 2, background: D.surface, border: `1px solid ${D.border}`, borderRadius: D.radiusSm, padding: 3 }}>
          {(['products', 'services'] as const).map(st => (
            <button
              key={st}
              onClick={() => { setSubTab(st); resetForm() }}
              style={{
                padding: '6px 16px', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 500,
                background: subTab === st ? D.surfaceHover : 'transparent',
                color: subTab === st ? D.text : D.textMuted, transition: 'all 0.15s',
              }}
            >
              {st === 'products' ? 'Produits' : 'Services'}
            </button>
          ))}
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true) }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: D.radiusSm, background: D.accent, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 500 }}
        >
          <Plus size={13} />
          Ajouter
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: D.radius, padding: 20, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: D.text }}>{editingId ? 'Modifier' : 'Nouveau'} {subTab === 'products' ? 'produit' : 'service'}</span>
            <button type="button" onClick={resetForm} style={{ background: 'none', border: 'none', color: D.textMuted, cursor: 'pointer' }}><X size={14} /></button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <Label>Nom *</Label>
              <input required style={inputStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nom..." onFocus={e => (e.target as HTMLInputElement).style.borderColor = D.accent} onBlur={e => (e.target as HTMLInputElement).style.borderColor = D.border} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <Label>Description</Label>
              <input style={inputStyle} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Description..." onFocus={e => (e.target as HTMLInputElement).style.borderColor = D.accent} onBlur={e => (e.target as HTMLInputElement).style.borderColor = D.border} />
            </div>
            <div>
              <Label>Prix (DT) *</Label>
              <input required type="number" step="0.01" style={inputStyle} value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0.00" onFocus={e => (e.target as HTMLInputElement).style.borderColor = D.accent} onBlur={e => (e.target as HTMLInputElement).style.borderColor = D.border} />
            </div>
            {subTab === 'services' && (
              <div>
                <Label>Durée (min) *</Label>
                <input required type="number" style={inputStyle} value={form.durationMinutes} onChange={e => setForm(f => ({ ...f, durationMinutes: e.target.value }))} placeholder="30" onFocus={e => (e.target as HTMLInputElement).style.borderColor = D.accent} onBlur={e => (e.target as HTMLInputElement).style.borderColor = D.border} />
              </div>
            )}
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', gridColumn: subTab === 'services' ? '1 / -1' : 'auto' }}>
              <input type="checkbox" checked={form.available} onChange={e => setForm(f => ({ ...f, available: e.target.checked }))} />
              <span style={{ fontSize: 12, color: D.text }}>Disponible</span>
            </label>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" disabled={saving} style={{ padding: '8px 18px', borderRadius: D.radiusSm, background: D.accent, color: '#fff', border: 'none', fontSize: 13, fontWeight: 500, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
            <button type="button" onClick={resetForm} style={{ padding: '8px 18px', borderRadius: D.radiusSm, background: 'transparent', color: D.textMuted, border: `1px solid ${D.border}`, fontSize: 13, cursor: 'pointer' }}>
              Annuler
            </button>
          </div>
        </form>
      )}

      {items.length === 0 ? (
        <div style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: D.radius, padding: 48, textAlign: 'center' }}>
          <Package size={28} color={D.border} style={{ margin: '0 auto 12px' }} />
          <p style={{ fontSize: 13, color: D.textMuted, margin: 0 }}>Aucun {subTab === 'products' ? 'produit' : 'service'}</p>
        </div>
      ) : (
        <div style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: D.radius, overflow: 'hidden' }}>
          {items.map((item, i) => (
            <div
              key={item.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px',
                borderBottom: i < items.length - 1 ? `1px solid #1A1A26` : 'none',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = D.surfaceHover}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: D.text }}>{item.name}</span>
                  {!item.available && <span style={{ fontSize: 10, color: D.danger, background: 'rgba(239,68,68,0.1)', padding: '2px 6px', borderRadius: 4 }}>Indisponible</span>}
                </div>
                {item.description && <p style={{ fontSize: 12, color: D.textMuted, margin: '2px 0 0' }}>{item.description}</p>}
                <div style={{ fontSize: 12, color: D.textSub, marginTop: 2 }}>
                  {item.price} DT{item.durationMinutes ? ` · ${item.durationMinutes} min` : ''}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button onClick={() => startEdit(item)} style={{ padding: 6, borderRadius: 6, border: 'none', background: 'transparent', color: D.textMuted, cursor: 'pointer' }}>
                  <Edit2 size={13} />
                </button>
                <button onClick={() => handleDelete(item.id)} style={{ padding: 6, borderRadius: 6, border: 'none', background: 'transparent', color: D.danger, cursor: 'pointer' }}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

// ── Canaux Tab ─────────────────────────────────────────────────────────────────
function CanauxTab() {
  return (
    <div>
      <SectionCard title="Connexions">
        <FacebookInstagramConnect />
      </SectionCard>
    </div>
  )
}
