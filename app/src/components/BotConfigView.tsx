'use client'

import { useMemo, useState } from 'react'
import { Plus, RotateCcw, Send, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { BotConfig } from '@/types'

type BotConfigViewProps = {
  config: BotConfig
}

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

type BotConfigResponse = {
  success: boolean
  data?: BotConfig
}

type BotTestResponse = {
  success: boolean
  data?: {
    response: string
  }
}

type AvailabilityMode = 'always' | 'scheduled'

type BusinessDay = {
  key: string
  label: string
  open: boolean
  from: string
  to: string
}

type DeliveryZone = {
  location: string
  enabled: boolean
  price: string
  condition: string
}

type PaymentKey = 'cashDelivery' | 'onSite' | 'card'

type OrderPolicies = {
  cancellation: boolean
  cancellationCondition: string
  modification: boolean
  modificationCondition: string
  return: boolean
  returnCondition: string
}

type ExtraFaqItem = {
  question: string
  answer: string
}

type KnowledgeConfig = {
  version: 2
  businessHours: BusinessDay[]
  delivery: {
    enabled: boolean
    zones: DeliveryZone[]
  }
  paymentMethods: Record<PaymentKey, boolean>
  boutiqueAddress: string
  deliveryDelay: string
  policies: OrderPolicies
  handoffEnabled: boolean
  botScheduleWeekend: boolean
  extraFaq: ExtraFaqItem[]
}

const DAY_TEMPLATES: BusinessDay[] = [
  { key: 'monday', label: 'Lundi', open: true, from: '09:00', to: '18:00' },
  { key: 'tuesday', label: 'Mardi', open: true, from: '09:00', to: '18:00' },
  { key: 'wednesday', label: 'Mercredi', open: true, from: '09:00', to: '18:00' },
  { key: 'thursday', label: 'Jeudi', open: true, from: '09:00', to: '18:00' },
  { key: 'friday', label: 'Vendredi', open: true, from: '09:00', to: '18:00' },
  { key: 'saturday', label: 'Samedi', open: false, from: '09:00', to: '14:00' },
  { key: 'sunday', label: 'Dimanche', open: false, from: '09:00', to: '14:00' },
]

const DEFAULT_KNOWLEDGE: KnowledgeConfig = {
  version: 2,
  businessHours: DAY_TEMPLATES,
  delivery: {
    enabled: true,
    zones: [
      { location: 'Grand Tunis', enabled: true, price: '7', condition: '' },
      { location: 'Autres regions', enabled: true, price: '10', condition: '' },
    ],
  },
  paymentMethods: {
    cashDelivery: true,
    onSite: false,
    card: false,
  },
  boutiqueAddress: '',
  deliveryDelay: '',
  policies: {
    cancellation: true,
    cancellationCondition: '',
    modification: true,
    modificationCondition: '',
    return: false,
    returnCondition: '',
  },
  handoffEnabled: true,
  botScheduleWeekend: true,
  extraFaq: [],
}

const PAYMENT_OPTIONS: Array<{ key: PaymentKey; label: string }> = [
  { key: 'cashDelivery', label: 'Cash a la livraison' },
  { key: 'onSite', label: 'Sur place' },
  { key: 'card', label: 'Carte' },
]

function createDraft(config: BotConfig): BotConfig {
  return { ...config }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isString(value: unknown) {
  return typeof value === 'string'
}

function parseLegacyFaq(value: unknown): ExtraFaqItem[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .filter((item) => isRecord(item) && isString(item.question) && isString(item.answer))
    .map((item) => ({
      question: String(item.question),
      answer: String(item.answer),
    }))
}

function parseKnowledgeConfig(value: string): KnowledgeConfig {
  const trimmed = value.trim()

  if (!trimmed) {
    return DEFAULT_KNOWLEDGE
  }

  try {
    const parsed = JSON.parse(trimmed) as unknown

    if (isRecord(parsed) && parsed.version === 2) {
      return {
        ...DEFAULT_KNOWLEDGE,
        ...parsed,
        businessHours: Array.isArray(parsed.businessHours) ? parsed.businessHours as BusinessDay[] : DEFAULT_KNOWLEDGE.businessHours,
        delivery: isRecord(parsed.delivery)
          ? {
              enabled: typeof parsed.delivery.enabled === 'boolean' ? parsed.delivery.enabled : DEFAULT_KNOWLEDGE.delivery.enabled,
              zones: Array.isArray(parsed.delivery.zones) ? parsed.delivery.zones as DeliveryZone[] : DEFAULT_KNOWLEDGE.delivery.zones,
            }
          : DEFAULT_KNOWLEDGE.delivery,
        paymentMethods: isRecord(parsed.paymentMethods) ? { ...DEFAULT_KNOWLEDGE.paymentMethods, ...parsed.paymentMethods } : DEFAULT_KNOWLEDGE.paymentMethods,
        policies: isRecord(parsed.policies) ? { ...DEFAULT_KNOWLEDGE.policies, ...parsed.policies } : DEFAULT_KNOWLEDGE.policies,
        extraFaq: parseLegacyFaq(parsed.extraFaq),
      }
    }

    const legacyFaq = parseLegacyFaq(parsed)
    if (legacyFaq.length > 0) {
      return { ...DEFAULT_KNOWLEDGE, extraFaq: legacyFaq }
    }
  } catch {}

  return {
    ...DEFAULT_KNOWLEDGE,
    extraFaq: [{ question: 'Informations generales', answer: trimmed }],
  }
}

function serializeKnowledgeConfig(config: KnowledgeConfig) {
  return JSON.stringify(config)
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 rounded-[var(--radius-btn)] border border-[color:var(--border)] bg-[color:var(--bg-card)] px-3.5 py-3">
      {[0, 1, 2].map((dot) => (
        <span
          key={dot}
          className="h-1.5 w-1.5 animate-pulse rounded-full bg-[color:var(--text-muted)]"
          style={{ animationDelay: `${dot * 120}ms` }}
        />
      ))}
    </div>
  )
}

export function BotConfigView({ config }: BotConfigViewProps) {
  const [draft, setDraft] = useState(() => createDraft(config))
  const [savedConfig, setSavedConfig] = useState(config)
  const [knowledge, setKnowledge] = useState<KnowledgeConfig>(() => parseKnowledgeConfig(config.botKnowledge))
  const [availabilityMode, setAvailabilityMode] = useState<AvailabilityMode>(() => (config.botWorkingHoursStart || config.botWorkingHoursEnd ? 'scheduled' : 'always'))
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [history, setHistory] = useState<ChatMessage[]>([])
  const [testing, setTesting] = useState(false)

  const knowledgeCount = serializeKnowledgeConfig(knowledge).length
  const historyForApi = useMemo(() => history.map((item) => ({ role: item.role, content: item.content })), [history])

  function updateBusinessDay(index: number, field: keyof BusinessDay, value: string | boolean) {
    setKnowledge((current) => ({
      ...current,
      businessHours: current.businessHours.map((day, dayIndex) => (dayIndex === index ? { ...day, [field]: value } : day)),
    }))
  }

  function updateDeliveryZone(index: number, field: keyof DeliveryZone, value: string | boolean) {
    setKnowledge((current) => ({
      ...current,
      delivery: {
        ...current.delivery,
        zones: current.delivery.zones.map((zone, zoneIndex) => (zoneIndex === index ? { ...zone, [field]: value } : zone)),
      },
    }))
  }

  function addDeliveryZone() {
    setKnowledge((current) => ({
      ...current,
      delivery: {
        ...current.delivery,
        zones: [...current.delivery.zones, { location: '', enabled: true, price: '', condition: '' }],
      },
    }))
  }

  function removeDeliveryZone(index: number) {
    setKnowledge((current) => ({
      ...current,
      delivery: {
        ...current.delivery,
        zones: current.delivery.zones.filter((_, zoneIndex) => zoneIndex !== index),
      },
    }))
  }

  function updateExtraFaq(index: number, field: keyof ExtraFaqItem, value: string) {
    setKnowledge((current) => ({
      ...current,
      extraFaq: current.extraFaq.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item)),
    }))
  }

  function addExtraFaq() {
    setKnowledge((current) => ({
      ...current,
      extraFaq: [...current.extraFaq, { question: '', answer: '' }],
    }))
  }

  function removeExtraFaq(index: number) {
    setKnowledge((current) => ({
      ...current,
      extraFaq: current.extraFaq.filter((_, itemIndex) => itemIndex !== index),
    }))
  }

  async function saveConfig() {
    setSaving(true)

    const nextDraft: BotConfig = {
      ...draft,
      botKnowledge: serializeKnowledgeConfig(knowledge),
      botWorkingHoursStart: availabilityMode === 'always' ? '' : draft.botWorkingHoursStart,
      botWorkingHoursEnd: availabilityMode === 'always' ? '' : draft.botWorkingHoursEnd,
    }

    try {
      const response = await fetch('/api/bot/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextDraft),
      })

      if (!response.ok) {
        throw new Error('BOT_CONFIG_SAVE_FAILED')
      }

      const result = (await response.json()) as BotConfigResponse
      if (result.data) {
        setSavedConfig(result.data)
        setDraft(result.data)
        setKnowledge(parseKnowledgeConfig(result.data.botKnowledge))
        setAvailabilityMode(result.data.botWorkingHoursStart || result.data.botWorkingHoursEnd ? 'scheduled' : 'always')
      }
    } finally {
      setSaving(false)
    }
  }

  async function sendMessage() {
    const content = message.trim()
    if (!content || testing) {
      return
    }

    const nextHistory: ChatMessage[] = [...history, { role: 'user', content }]
    setHistory(nextHistory)
    setMessage('')
    setTesting(true)

    try {
      const response = await fetch('/api/bot/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content, history: historyForApi }),
      })

      if (!response.ok) {
        throw new Error('BOT_TEST_FAILED')
      }

      const result = (await response.json()) as BotTestResponse
      setHistory((current) => [...current, { role: 'assistant', content: result.data?.response ?? '' }])
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="grid h-[calc(100dvh-var(--topbar-height)-48px)] min-h-0 gap-4 overflow-hidden lg:grid-cols-[minmax(0,1fr)_minmax(340px,420px)]">
      <div className="min-h-0 overflow-y-auto pr-1">
        <section className="space-y-4 pb-1">
          <div className="nx-card p-4 md:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="nx-section-label">Activation</p>
                <h2 className="mt-1 text-[14px] font-semibold text-[color:var(--text-primary)]">Bot automatique</h2>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={draft.botEnabled}
                className={cn('nx-toggle', draft.botEnabled && 'is-on')}
                onClick={() => setDraft({ ...draft, botEnabled: !draft.botEnabled })}
              >
                <span className="nx-toggle-thumb" />
              </button>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <button type="button" className={cn('nx-btn justify-center', availabilityMode === 'always' ? 'nx-btn-primary' : 'nx-btn-secondary')} onClick={() => setAvailabilityMode('always')}>
                24/7
              </button>
              <button type="button" className={cn('nx-btn justify-center', availabilityMode === 'scheduled' ? 'nx-btn-primary' : 'nx-btn-secondary')} onClick={() => setAvailabilityMode('scheduled')}>
                Horaires specifique
              </button>
            </div>

            {availabilityMode === 'scheduled' ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="nx-field">
                  <label className="nx-label" htmlFor="bot-hours-start">Debut</label>
                  <input id="bot-hours-start" type="time" className="nx-input" value={draft.botWorkingHoursStart} onChange={(event) => setDraft({ ...draft, botWorkingHoursStart: event.target.value })} />
                </div>
                <div className="nx-field">
                  <label className="nx-label" htmlFor="bot-hours-end">Fin</label>
                  <input id="bot-hours-end" type="time" className="nx-input" value={draft.botWorkingHoursEnd} onChange={(event) => setDraft({ ...draft, botWorkingHoursEnd: event.target.value })} />
                </div>
                <label className="flex items-center gap-2 text-[13px] text-[color:var(--text-secondary)] sm:col-span-2">
                  <input
                    type="checkbox"
                    checked={knowledge.botScheduleWeekend}
                    onChange={(event) => setKnowledge((current) => ({ ...current, botScheduleWeekend: event.target.checked }))}
                  />
                  Actif aussi pendant le weekend complet
                </label>
              </div>
            ) : null}
          </div>

          <div className="nx-card p-4 md:p-5">
            <p className="nx-section-label">Persona</p>
            <div className="nx-field mt-4">
              <label className="nx-label" htmlFor="bot-name">Nom du bot</label>
              <input id="bot-name" className="nx-input" value={draft.botName} onChange={(event) => setDraft({ ...draft, botName: event.target.value })} placeholder={savedConfig.businessName} />
            </div>
          </div>

          <div className="nx-card p-4 md:p-5">
            <p className="nx-section-label">Horaires boutique</p>
            <div className="mt-4 grid gap-2">
              {knowledge.businessHours.map((day, index) => (
                <div key={day.key} className="grid gap-2 rounded-[var(--radius-card)] border border-[color:var(--border)] bg-[color:var(--bg-page)] p-3 sm:grid-cols-[92px_120px_1fr_1fr] sm:items-center">
                  <p className="text-[13px] font-medium text-[color:var(--text-primary)]">{day.label}</p>
                  <select className="nx-input" value={day.open ? 'open' : 'closed'} onChange={(event) => updateBusinessDay(index, 'open', event.target.value === 'open')}>
                    <option value="open">Ouvert</option>
                    <option value="closed">Ferme</option>
                  </select>
                  <input type="time" className="nx-input" value={day.from} disabled={!day.open} onChange={(event) => updateBusinessDay(index, 'from', event.target.value)} />
                  <input type="time" className="nx-input" value={day.to} disabled={!day.open} onChange={(event) => updateBusinessDay(index, 'to', event.target.value)} />
                </div>
              ))}
            </div>
          </div>

          <div className="nx-card p-4 md:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="nx-section-label">Livraison</p>
                <h2 className="mt-1 text-[14px] font-semibold text-[color:var(--text-primary)]">Zones et frais</h2>
              </div>
              <select
                className="nx-input w-[120px]"
                value={knowledge.delivery.enabled ? 'yes' : 'no'}
                onChange={(event) => setKnowledge((current) => ({ ...current, delivery: { ...current.delivery, enabled: event.target.value === 'yes' } }))}
              >
                <option value="yes">Oui</option>
                <option value="no">Non</option>
              </select>
            </div>

            {knowledge.delivery.enabled ? (
              <div className="mt-4 space-y-3">
                {knowledge.delivery.zones.map((zone, index) => (
                  <div key={index} className="rounded-[var(--radius-card)] border border-[color:var(--border)] bg-[color:var(--bg-page)] p-3">
                    <div className="grid gap-2 sm:grid-cols-[1fr_120px_120px_40px]">
                      <input className="nx-input" value={zone.location} onChange={(event) => updateDeliveryZone(index, 'location', event.target.value)} placeholder="Zone, ex: Grand Tunis" />
                      <select className="nx-input" value={zone.enabled ? 'yes' : 'no'} onChange={(event) => updateDeliveryZone(index, 'enabled', event.target.value === 'yes')}>
                        <option value="yes">Livre</option>
                        <option value="no">Pas livre</option>
                      </select>
                      <input className="nx-input" value={zone.price} onChange={(event) => updateDeliveryZone(index, 'price', event.target.value)} placeholder="Prix DT" disabled={!zone.enabled} />
                      <button type="button" className="nx-btn nx-btn-ghost nx-btn-icon-md" onClick={() => removeDeliveryZone(index)} aria-label="Supprimer la zone">
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                    <input className="nx-input mt-2" value={zone.condition} onChange={(event) => updateDeliveryZone(index, 'condition', event.target.value)} placeholder="Condition, ex: seulement commandes +50 DT" disabled={!zone.enabled} />
                  </div>
                ))}
                <button type="button" className="nx-btn nx-btn-secondary nx-btn-sm" onClick={addDeliveryZone}>
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  Ajouter une zone
                </button>
              </div>
            ) : null}
          </div>

          <div className="nx-card p-4 md:p-5">
            <p className="nx-section-label">Paiement</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {PAYMENT_OPTIONS.map((option) => (
                <label key={option.key} className="flex items-center gap-2 rounded-[var(--radius-card)] border border-[color:var(--border)] bg-[color:var(--bg-page)] p-3 text-[13px] text-[color:var(--text-secondary)]">
                  <input
                    type="checkbox"
                    checked={knowledge.paymentMethods[option.key]}
                    onChange={(event) =>
                      setKnowledge((current) => ({
                        ...current,
                        paymentMethods: { ...current.paymentMethods, [option.key]: event.target.checked },
                      }))
                    }
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </div>

          <div className="nx-card p-4 md:p-5">
            <p className="nx-section-label">Informations boutique</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="nx-field">
                <label className="nx-label" htmlFor="boutique-address">Adresse boutique</label>
                <input id="boutique-address" className="nx-input" value={knowledge.boutiqueAddress} onChange={(event) => setKnowledge((current) => ({ ...current, boutiqueAddress: event.target.value }))} />
              </div>
              <div className="nx-field">
                <label className="nx-label" htmlFor="delivery-delay">Delai de livraison</label>
                <input id="delivery-delay" className="nx-input" value={knowledge.deliveryDelay} onChange={(event) => setKnowledge((current) => ({ ...current, deliveryDelay: event.target.value }))} placeholder="Ex: 24h a 48h" />
              </div>
            </div>
          </div>

          <div className="nx-card p-4 md:p-5">
            <p className="nx-section-label">Commandes</p>
            <div className="mt-4 grid gap-3 lg:grid-cols-3">
              {[
                ['cancellation', 'cancellationCondition', 'Annulation'],
                ['modification', 'modificationCondition', 'Modification'],
                ['return', 'returnCondition', 'Retour'],
              ].map(([enabledKey, conditionKey, label]) => (
                <div key={enabledKey} className="rounded-[var(--radius-card)] border border-[color:var(--border)] bg-[color:var(--bg-page)] p-3">
                  <label className="nx-label" htmlFor={`policy-${enabledKey}`}>{label}</label>
                  <select
                    id={`policy-${enabledKey}`}
                    className="nx-input mt-2"
                    value={knowledge.policies[enabledKey as keyof OrderPolicies] ? 'yes' : 'no'}
                    onChange={(event) =>
                      setKnowledge((current) => ({
                        ...current,
                        policies: { ...current.policies, [enabledKey]: event.target.value === 'yes' },
                      }))
                    }
                  >
                    <option value="yes">Oui</option>
                    <option value="no">Non</option>
                  </select>
                  <textarea
                    className="nx-input nx-textarea mt-2 min-h-[76px]"
                    value={String(knowledge.policies[conditionKey as keyof OrderPolicies])}
                    onChange={(event) =>
                      setKnowledge((current) => ({
                        ...current,
                        policies: { ...current.policies, [conditionKey]: event.target.value },
                      }))
                    }
                    placeholder="Condition"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="nx-card p-4 md:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="nx-section-label">Handoff</p>
                <h2 className="mt-1 text-[14px] font-semibold text-[color:var(--text-primary)]">Handoff automatique</h2>
              </div>
              <select
                className="nx-input w-[120px]"
                value={knowledge.handoffEnabled ? 'yes' : 'no'}
                onChange={(event) => setKnowledge((current) => ({ ...current, handoffEnabled: event.target.value === 'yes' }))}
              >
                <option value="yes">Oui</option>
                <option value="no">Non</option>
              </select>
            </div>
            {knowledge.handoffEnabled ? (
              <div className="nx-field mt-4">
                <label className="nx-label" htmlFor="bot-handoff">Mots cles supplementaires</label>
                <input id="bot-handoff" className="nx-input" value={draft.botHandoffKeywords} onChange={(event) => setDraft({ ...draft, botHandoffKeywords: event.target.value })} />
                <p className="mt-2 text-[12px] text-[color:var(--text-secondary)]">Recommande: oui. Le bot transfere s'il ne comprend pas, s'il manque une information ou si le client demande un humain.</p>
              </div>
            ) : null}
          </div>

          <div className="nx-card p-4 md:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="nx-section-label">FAQ libre</p>
                <h2 className="mt-1 text-[14px] font-semibold text-[color:var(--text-primary)]">Questions supplementaires</h2>
              </div>
              <button type="button" className="nx-btn nx-btn-secondary nx-btn-sm" onClick={addExtraFaq}>
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                Ajouter
              </button>
            </div>
            {knowledge.extraFaq.length > 0 ? (
              <div className="mt-4 space-y-3">
                {knowledge.extraFaq.map((item, index) => (
                  <div key={index} className="rounded-[var(--radius-card)] border border-[color:var(--border)] bg-[color:var(--bg-page)] p-3">
                    <div className="flex items-start gap-2">
                      <div className="grid min-w-0 flex-1 gap-2">
                        <input className="nx-input" value={item.question} onChange={(event) => updateExtraFaq(index, 'question', event.target.value)} placeholder="Question" />
                        <textarea className="nx-input nx-textarea min-h-[76px]" value={item.answer} onChange={(event) => updateExtraFaq(index, 'answer', event.target.value)} placeholder="Reponse" />
                      </div>
                      <button type="button" className="nx-btn nx-btn-ghost nx-btn-icon-md" onClick={() => removeExtraFaq(index)} aria-label="Supprimer la question">
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
            <p className="mt-3 text-right text-[11px] text-[color:var(--text-muted)]">{knowledgeCount}/8000</p>
          </div>

          <button type="button" className="nx-btn nx-btn-primary" disabled={saving || knowledgeCount > 8000} onClick={() => void saveConfig()}>
            Sauvegarder
          </button>
        </section>
      </div>

      <aside className="nx-card flex h-full min-h-0 flex-col p-4 md:p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="nx-section-label">Test chat</p>
              <h2 className="mt-1 text-[14px] font-semibold text-[color:var(--text-primary)]">Conversation de test</h2>
            </div>
            <button type="button" className="nx-btn nx-btn-ghost nx-btn-sm" onClick={() => setHistory([])}>
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Reinitialiser
            </button>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto rounded-[var(--radius-btn)] border border-[color:var(--border)] bg-[color:var(--bg-page)] p-3">
            {history.map((item, index) => {
              const outbound = item.role === 'user'
              return (
                <div key={`${item.role}-${index}`} className={cn('flex max-w-[82%] flex-col md:max-w-[72%]', outbound ? 'ml-auto items-end' : 'mr-auto items-start')}>
                  <div
                    className={cn(
                      'rounded-[var(--radius-btn)] border px-3.5 py-2 text-[13.5px] leading-[1.5]',
                      outbound
                        ? 'border-[color:var(--brand)] bg-[color:var(--brand)] text-[color:var(--text-on-brand)]'
                        : 'border-[color:var(--border)] bg-[color:var(--bg-card)] text-[color:var(--text-primary)]',
                    )}
                  >
                    {item.content}
                  </div>
                </div>
              )
            })}
            {testing ? <div className="mr-auto"><TypingDots /></div> : null}
          </div>

          <div className="mt-3 flex items-end gap-2">
            <textarea
              className="nx-input nx-textarea min-h-11 flex-1"
              rows={2}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  void sendMessage()
                }
              }}
              placeholder="Ecrire un message"
            />
            <button type="button" className="nx-btn nx-btn-primary nx-btn-icon-md" disabled={testing || !message.trim()} onClick={() => void sendMessage()} aria-label="Envoyer">
              <Send className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
      </aside>
    </div>
  )
}
