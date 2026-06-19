'use client'

import { startTransition, useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { UpgradeModal, type UpgradeModalState } from '@/components/subscription/UpgradeModal'
import type { SubscriptionState } from '@/lib/subscription'

type ConnectionStatus = 'PENDING' | 'ACTIVE' | 'DISCONNECTED' | 'ERROR'

type BusinessSettings = {
  name: string
  email: string
  phone: string
  businessType: string
  tone: string
  plan: string
}

type ChannelKey = 'WHATSAPP' | 'INSTAGRAM'

type ChannelSettings = {
  channel: ChannelKey
  status: ConnectionStatus | 'NOT_CONNECTED'
  label: string
  displayName: string
  unipileAccountId: string
  connectedAt: string | null
}

type SettingsPageClientProps = {
  initialBusiness: BusinessSettings
  initialChannels: Record<ChannelKey, ChannelSettings>
  initialSubscription: SubscriptionState | null
}

type SaveState = {
  type: 'idle' | 'success' | 'error'
  message: string
}

const channelTitles: Record<ChannelKey, string> = {
  WHATSAPP: 'WhatsApp',
  INSTAGRAM: 'Instagram',
}

const channelDescriptions: Record<ChannelKey, string> = {
  WHATSAPP: 'Scannez le QR code Unipile pour connecter votre numéro WhatsApp Business et recevoir les messages dans Répondly.',
  INSTAGRAM: 'Connectez votre compte Instagram professionnel via Unipile pour synchroniser les messages privés dans l’inbox.',
}

const channelIcons: Record<ChannelKey, string> = {
  WHATSAPP: 'WA',
  INSTAGRAM: 'IG',
}

const channelOrder: ChannelKey[] = ['WHATSAPP', 'INSTAGRAM']

const ACTIVITY_OPTIONS = [
  { value: 'clinic', label: 'Clinique' },
  { value: 'salon', label: 'Salon de beaute' },
  { value: 'ecom', label: 'E-commerce' },
  { value: 'garage', label: 'Garage' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'cafe', label: 'Cafe' },
  { value: 'real_estate', label: 'Immobilier' },
  { value: 'training', label: 'Formation' },
  { value: 'travel', label: 'Agence de voyage' },
  { value: 'fitness', label: 'Sport et fitness' },
  { value: 'home_services', label: 'Services a domicile' },
  { value: 'events', label: 'Evenementiel' },
  { value: 'professional_services', label: 'Services professionnels' },
]

function buildDefaultState(): SaveState {
  return { type: 'idle', message: '' }
}

function getStatusTone(status: ChannelSettings['status']) {
  if (status === 'ACTIVE') return 'success'
  if (status === 'ERROR') return 'danger'
  if (status === 'DISCONNECTED' || status === 'PENDING') return 'warning'
  return 'neutral'
}

function getStatusLabel(status: ChannelSettings['status']) {
  if (status === 'ACTIVE') return 'Connecté'
  if (status === 'ERROR') return 'Erreur'
  if (status === 'DISCONNECTED') return 'Déconnecté'
  if (status === 'PENDING') return 'En attente'
  return 'Non connecté'
}

function formatConnectedAt(value: string | null) {
  if (!value) {
    return null
  }

  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function formatDate(value: string | null) {
  if (!value) return 'Non defini'
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(new Date(value))
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('fr-FR').format(value)
}

function getUsageTone(used: number, limit: number) {
  if (limit <= 0) return used > 0 ? 'danger' : 'neutral'
  const ratio = used / limit
  if (ratio >= 1) return 'danger'
  if (ratio >= 0.9) return 'warning'
  if (ratio >= 0.7) return 'brand'
  return 'success'
}

function UsageMeter({ label, used, limit }: { label: string, used: number, limit: number }) {
  const ratio = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0
  const tone = getUsageTone(used, limit)

  return (
    <div className="rounded-[var(--radius-card)] border border-[color:var(--border)] bg-[color:var(--bg-page)] p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[12px] font-semibold text-[color:var(--text-primary)]">{label}</p>
        <span className={`nx-badge nx-badge-${tone}`}>{formatNumber(used)} / {formatNumber(limit)}</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-[var(--radius-btn)] bg-[color:var(--border)]">
        <div className={`h-full rounded-[var(--radius-btn)] nx-badge-${tone}`} style={{ width: `${ratio}%` }} />
      </div>
    </div>
  )
}

const statusLabels: Record<string, string> = {
  TRIALING: 'Essai gratuit',
  ACTIVE: 'Actif',
  TRIAL_EXPIRED: 'Essai termine',
  PAST_DUE: 'Paiement en attente',
  SUSPENDED: 'Suspendu',
  CANCELLED: 'Annule',
}

export function SettingsPageClient({ initialBusiness, initialChannels, initialSubscription }: SettingsPageClientProps) {
  const [business, setBusiness] = useState(initialBusiness)
  const [channels, setChannels] = useState(initialChannels)
  const [subscription, setSubscription] = useState(initialSubscription)
  const [upgradeModal, setUpgradeModal] = useState<UpgradeModalState>(null)
  const [choosingPlan, setChoosingPlan] = useState('')
  const [businessState, setBusinessState] = useState<SaveState>(buildDefaultState())
  const [channelStates, setChannelStates] = useState<Record<ChannelKey, SaveState>>({
    WHATSAPP: buildDefaultState(),
    INSTAGRAM: buildDefaultState(),
  })
  const [savingBusiness, setSavingBusiness] = useState(false)
  const [savingChannels, setSavingChannels] = useState<Record<ChannelKey, boolean>>({
    WHATSAPP: false,
    INSTAGRAM: false,
  })
  const [connectingChannels, setConnectingChannels] = useState<Record<ChannelKey, boolean>>({
    WHATSAPP: false,
    INSTAGRAM: false,
  })
  const [disconnectingChannels, setDisconnectingChannels] = useState<Record<ChannelKey, boolean>>({
    WHATSAPP: false,
    INSTAGRAM: false,
  })
  const selectedActivity = ACTIVITY_OPTIONS.some((option) => option.value === business.businessType) ? business.businessType : 'other'

  function updateBusinessField(field: keyof BusinessSettings, value: string) {
    setBusiness((current) => ({ ...current, [field]: value }))
  }

  function updateChannelField(channel: ChannelKey, value: string) {
    setChannels((current) => ({
      ...current,
      [channel]: {
        ...current[channel],
        label: value,
      },
    }))
  }

  async function saveBusiness() {
    setSavingBusiness(true)
    setBusinessState(buildDefaultState())

    const response = await fetch('/api/settings/business', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(business),
    })

    const result = await response.json() as { success: boolean; error?: string }

    setSavingBusiness(false)
    setBusinessState(
      result.success
        ? { type: 'success', message: 'Informations sauvegardées.' }
        : { type: 'error', message: result.error ?? 'Impossible de sauvegarder les paramètres.' },
    )
  }

  async function saveChannel(channel: ChannelKey) {
    setSavingChannels((current) => ({ ...current, [channel]: true }))
    setChannelStates((current) => ({ ...current, [channel]: buildDefaultState() }))

    const response = await fetch('/api/settings/channels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        channel,
        label: channels[channel].label,
      }),
    })

    const result = await response.json() as {
      success: boolean
      error?: string
      data?: {
        status: ChannelSettings['status']
        label: string | null
        displayName: string | null
        unipileAccountId: string | null
        createdAt: string
      }
    }

    setSavingChannels((current) => ({ ...current, [channel]: false }))

    if (!result.success || !result.data) {
      setChannelStates((current) => ({
        ...current,
        [channel]: { type: 'error', message: result.error ?? 'Impossible d’enregistrer ce canal.' },
      }))
      return
    }

    const channelData = result.data

    setChannels((current) => ({
      ...current,
      [channel]: {
        ...current[channel],
        status: channelData.status ?? current[channel].status,
        label: channelData.label ?? '',
        displayName: channelData.displayName ?? current[channel].displayName,
        unipileAccountId: channelData.unipileAccountId ?? current[channel].unipileAccountId,
        connectedAt: channelData.createdAt ?? current[channel].connectedAt,
      },
    }))
    setChannelStates((current) => ({ ...current, [channel]: { type: 'success', message: 'Nom enregistré.' } }))
  }

  async function connectChannel(channel: ChannelKey) {
    setConnectingChannels((current) => ({ ...current, [channel]: true }))
    setChannelStates((current) => ({ ...current, [channel]: buildDefaultState() }))

    const response = await fetch('/api/unipile/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel }),
    })

    const result = await response.json() as {
      success: boolean
      error?: string
      code?: string
      currentLimit?: number
      currentUsage?: number
      data?: { url: string }
    }

    if (!result.success || !result.data?.url) {
      setConnectingChannels((current) => ({ ...current, [channel]: false }))
      if (result.code === 'PLAN_CHANNEL_LIMIT_REACHED') {
        setUpgradeModal({
          title: 'Limite de canaux atteinte',
          body: `Votre plan actuel inclut ${result.currentLimit ?? 0} canal/canaux. Passez a un plan superieur pour connecter plus de canaux.`,
          currentLimit: result.currentLimit,
          currentUsage: result.currentUsage,
        })
      }
      setChannelStates((current) => ({
        ...current,
        [channel]: { type: 'error', message: result.error ?? 'Impossible de démarrer la connexion Unipile.' },
      }))
      return
    }

    window.location.href = result.data.url
  }

  async function choosePlan(plan: string) {
    setChoosingPlan(plan)
    const response = await fetch('/api/subscription/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    })
    const result = await response.json() as { success: boolean, error?: string, data?: SubscriptionState }

    setChoosingPlan('')

    if (!result.success || !result.data) {
      setUpgradeModal({
        title: 'Plan non modifie',
        body: result.error ?? 'Impossible de choisir ce plan pour le moment.',
      })
      return
    }

    setSubscription(result.data)
    setBusiness((current) => ({ ...current, plan: result.data?.plan ?? current.plan }))
  }

  async function disconnectChannel(channel: ChannelKey) {
    const accountId = channels[channel].unipileAccountId

    if (!accountId) {
      setChannelStates((current) => ({
        ...current,
        [channel]: { type: 'error', message: 'Aucun compte connecté à déconnecter.' },
      }))
      return
    }

    const previous = channels[channel]
    setDisconnectingChannels((current) => ({ ...current, [channel]: true }))
    setChannelStates((current) => ({ ...current, [channel]: buildDefaultState() }))
    setChannels((current) => ({
      ...current,
      [channel]: {
        ...current[channel],
        status: 'NOT_CONNECTED',
        displayName: '',
        unipileAccountId: '',
        connectedAt: null,
      },
    }))

    const response = await fetch(`/api/unipile/accounts/${encodeURIComponent(accountId)}`, {
      method: 'DELETE',
    })

    const result = await response.json() as { success: boolean; error?: string }

    setDisconnectingChannels((current) => ({ ...current, [channel]: false }))

    if (!result.success) {
      setChannels((current) => ({
        ...current,
        [channel]: previous,
      }))
      setChannelStates((current) => ({
        ...current,
        [channel]: { type: 'error', message: result.error ?? 'Impossible de déconnecter ce compte.' },
      }))
      return
    }

    setChannelStates((current) => ({
      ...current,
      [channel]: { type: 'success', message: 'Compte déconnecté.' },
    }))
  }

  return (
    <div className="nx-page max-w-4xl">
      <section className="nx-card p-4 md:p-5">
        <div className="mb-4">
          <h2 className="text-[14px] font-semibold text-[color:var(--text-primary)]">Mon entreprise</h2>
          <p className="mt-1 text-[12.5px] text-[color:var(--text-secondary)]">Informations visibles dans votre espace Répondly.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="nx-field text-[12px] font-medium text-[color:var(--text-secondary)]">Nom de l&apos;entreprise<Input value={business.name} onChange={(event) => updateBusinessField('name', event.target.value)} placeholder="Nom de l&apos;entreprise" /></label>
          <label className="nx-field text-[12px] font-medium text-[color:var(--text-secondary)]">Téléphone<Input value={business.phone} onChange={(event) => updateBusinessField('phone', event.target.value)} placeholder="Téléphone" /></label>
          <label className="nx-field text-[12px] font-medium text-[color:var(--text-secondary)] md:col-span-2">Email<Input value={business.email} onChange={(event) => updateBusinessField('email', event.target.value)} placeholder="Email" type="email" /></label>
          <label className="nx-field text-[12px] font-medium text-[color:var(--text-secondary)]">
            Type d&apos;activité
            <select
              value={selectedActivity}
              onChange={(event) => updateBusinessField('businessType', event.target.value === 'other' ? '' : event.target.value)}
              className="nx-input h-9 w-full px-3 text-[13px]"
            >
              {ACTIVITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
              <option value="other">Autre activite</option>
            </select>
          </label>
          {selectedActivity === 'other' ? (
            <label className="nx-field text-[12px] font-medium text-[color:var(--text-secondary)]">
              Activite personnalisee
              <Input value={business.businessType} onChange={(event) => updateBusinessField('businessType', event.target.value)} placeholder="Ex: boutique de meubles, cabinet avocat..." />
            </label>
          ) : null}
          <label className="nx-field text-[12px] font-medium text-[color:var(--text-secondary)]">Ton<select value={business.tone} onChange={(event) => updateBusinessField('tone', event.target.value)} className="nx-input h-9 w-full px-3 text-[13px]"><option value="friendly">Amical</option><option value="formal">Formel</option></select></label>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button onClick={() => startTransition(saveBusiness)} disabled={savingBusiness}>{savingBusiness ? 'Sauvegarde...' : 'Sauvegarder'}</Button>
          {businessState.type !== 'idle' ? <p className={businessState.type === 'success' ? 'text-[12.5px] text-[color:var(--success)]' : 'text-[12.5px] text-[color:var(--danger)]'}>{businessState.message}</p> : null}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {channelOrder.map((channel) => {
          const item = channels[channel]
          const state = channelStates[channel]
          const connectedAt = formatConnectedAt(item.connectedAt)

          return (
            <article key={channel} className="nx-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-[14px] font-semibold text-[color:var(--text-primary)]">{channelTitles[channel]}</h2>
                  <p className="mt-1 text-[12.5px] leading-[1.6] text-[color:var(--text-secondary)]">{channelDescriptions[channel]}</p>
                </div>
                <Badge tone={getStatusTone(item.status)} variant={getStatusLabel(item.status)} />
              </div>

              <label className="nx-field mt-4 text-[12px] font-medium text-[color:var(--text-secondary)]">
                Nom interne
                <Input value={item.label} onChange={(event) => updateChannelField(channel, event.target.value)} placeholder="Nom affiché dans Répondly" />
              </label>

              {item.status === 'ACTIVE' && item.unipileAccountId ? (
                <div className="mt-4 rounded-[var(--radius-btn)] border border-[color:var(--border)] bg-[color:var(--bg-page)] p-4">
                  <p className="text-[13px] font-semibold text-[color:var(--text-primary)]">{item.displayName || 'Compte connecté'}</p>
                  <p className="mt-1 text-[12.5px] text-[color:var(--text-secondary)]">Connecté{connectedAt ? ` le ${connectedAt}` : ''}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Button variant="danger" size="sm" onClick={() => startTransition(() => disconnectChannel(channel))} disabled={disconnectingChannels[channel]}>
                      {disconnectingChannels[channel] ? 'Déconnexion...' : 'Déconnecter'}
                    </Button>
                    <Button variant="ghost" onClick={() => startTransition(() => saveChannel(channel))} disabled={savingChannels[channel]}>
                      {savingChannels[channel] ? 'Enregistrement...' : 'Enregistrer le nom'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded-[var(--radius-btn)] border border-[color:var(--border)] bg-[color:var(--bg-page)] p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-btn)] border border-[color:var(--border)] bg-[color:var(--bg-card)] text-[12px] font-semibold text-[color:var(--text-primary)]">
                      {channelIcons[channel]}
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-[color:var(--text-primary)]">Connexion via Unipile</p>
                      <p className="mt-1 text-[12.5px] leading-[1.6] text-[color:var(--text-secondary)]">Lancez la connexion sécurisée Unipile pour relier ce canal à Répondly.</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Button onClick={() => startTransition(() => connectChannel(channel))} disabled={connectingChannels[channel]}>
                      {connectingChannels[channel] ? 'Redirection...' : 'Connecter via Unipile'}
                    </Button>
                    <Button variant="ghost" onClick={() => startTransition(() => saveChannel(channel))} disabled={savingChannels[channel]}>
                      {savingChannels[channel] ? 'Enregistrement...' : 'Enregistrer le nom'}
                    </Button>
                  </div>
                </div>
              )}

              {state.type !== 'idle' ? <p className={state.type === 'success' ? 'mt-3 text-[12.5px] text-[color:var(--success)]' : 'mt-3 text-[12.5px] text-[color:var(--danger)]'}>{state.message}</p> : null}
            </article>
          )
        })}
      </section>

      <section className="nx-card p-4 md:p-5">
        <h2 className="text-[14px] font-semibold text-[color:var(--text-primary)]">Connexion Unipile</h2>
        <p className="mt-2 text-[12.5px] leading-[1.7] text-[color:var(--text-secondary)]">
          Répondly utilise Unipile pour se connecter à WhatsApp et Instagram. Cliquez sur Connecter pour démarrer le processus, vous serez redirigé vers Unipile pour scanner le QR code WhatsApp ou vous connecter à Instagram.
        </p>
      </section>

      <section id="plan-utilisation" className="nx-card p-4 md:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="nx-section-label">Plan & utilisation</p>
            <h2 className="mt-1 text-[18px] font-bold text-[color:var(--text-primary)]">Abonnement</h2>
            {subscription ? (
              <div className="mt-3 grid gap-2 text-[13px] text-[color:var(--text-secondary)]">
                <p><strong className="text-[color:var(--text-primary)]">Plan actuel:</strong> {subscription.planName}</p>
                <p><strong className="text-[color:var(--text-primary)]">Statut:</strong> {statusLabels[subscription.planStatus] ?? subscription.planStatus}</p>
                {subscription.planStatus === 'TRIALING' ? <p><strong className="text-[color:var(--text-primary)]">Fin de l essai:</strong> {formatDate(subscription.trialEndsAt)} ({subscription.daysUntilTrialEnds} jour(s) restant(s))</p> : null}
                {subscription.dataDeletionScheduledAt ? <p><strong className="text-[color:var(--danger)]">Suppression prevue:</strong> {formatDate(subscription.dataDeletionScheduledAt)}</p> : null}
              </div>
            ) : (
              <p className="mt-2 text-[13px] text-[color:var(--text-secondary)]">Etat d abonnement indisponible.</p>
            )}
          </div>
          <Badge variant={subscription?.plan ?? business.plan} />
        </div>

        {subscription?.planStatus === 'TRIALING' ? (
          <div className="mt-4 rounded-[var(--radius-card)] border border-[color:var(--warning-border)] bg-[color:var(--warning-soft)] p-3">
            <p className="text-[13px] font-medium text-[color:var(--text-primary)]">Votre essai gratuit se termine le {formatDate(subscription.trialEndsAt)}. Choisissez un plan pour continuer a utiliser l assistant IA apres l essai.</p>
          </div>
        ) : null}

        {subscription ? (
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <UsageMeter label="Reponses IA" used={subscription.usage.aiReplies} limit={subscription.limits.aiRepliesPerMonth} />
            <UsageMeter label="Conversations" used={subscription.usage.conversations} limit={subscription.limits.conversationsPerMonth} />
            <UsageMeter label="Commandes & rendez-vous" used={subscription.usage.orders + subscription.usage.appointments} limit={subscription.limits.ordersAndAppointmentsPerMonth} />
            <UsageMeter label="Canaux connectes" used={subscription.usage.channels} limit={subscription.limits.channels} />
            <UsageMeter label="Produits/services" used={subscription.usage.products} limit={subscription.limits.products} />
            <UsageMeter label="Utilisateurs" used={subscription.usage.users} limit={subscription.limits.users} />
            <UsageMeter label="Campagnes promotionnelles" used={subscription.usage.broadcasts} limit={subscription.limits.broadcastsPerMonth} />
          </div>
        ) : null}

        {subscription?.warnings.length ? (
          <div className="mt-4 grid gap-2">
            {subscription.warnings.map((warning) => <p key={warning} className="rounded-[var(--radius-card)] border border-[color:var(--warning-border)] bg-[color:var(--warning-soft)] p-3 text-[13px] text-[color:var(--text-primary)]">{warning}</p>)}
          </div>
        ) : null}

        {subscription ? (
          <div className="mt-6">
            <h3 className="text-[15px] font-bold text-[color:var(--text-primary)]">Choisir un plan</h3>
            <div className="mt-3 grid gap-3 lg:grid-cols-2 xl:grid-cols-4">
              {subscription.planCards.map((card) => {
                const current = subscription.plan === card.plan && subscription.planStatus === 'ACTIVE'
                const trialing = subscription.planStatus === 'TRIALING'
                const cta = current ? 'Plan actuel' : trialing ? 'Choisir ce plan' : 'Passer a ce plan'

                return (
                  <article key={card.plan} className="rounded-[var(--radius-card)] border border-[color:var(--border)] bg-[color:var(--bg-page)] p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-[15px] font-bold text-[color:var(--text-primary)]">{card.name}</h4>
                        <p className="mt-1 text-[12px] leading-5 text-[color:var(--text-secondary)]">{card.description}</p>
                      </div>
                      {card.badge ? <span className="nx-badge nx-badge-success">{card.badge}</span> : null}
                    </div>
                    <p className="mt-4 text-[22px] font-bold text-[color:var(--text-primary)]">{card.price} DT <span className="text-[12px] font-medium text-[color:var(--text-secondary)]">/ mois</span></p>
                    <p className="mt-2 text-[12px] leading-5 text-[color:var(--text-secondary)]">{card.bestFor}</p>
                    <ul className="mt-4 grid gap-2 text-[12.5px] text-[color:var(--text-secondary)]">
                      {card.features.map((feature) => <li key={feature}>• {feature}</li>)}
                    </ul>
                    <Button className="mt-4 w-full" disabled={current} loading={choosingPlan === card.plan} onClick={() => void choosePlan(card.plan)}>
                      {cta}
                    </Button>
                  </article>
                )
              })}
            </div>
          </div>
        ) : null}
      </section>
      <UpgradeModal modal={upgradeModal} onClose={() => setUpgradeModal(null)} />
    </div>
  )
}
