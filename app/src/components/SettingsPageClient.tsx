'use client'

import { startTransition, useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

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

export function SettingsPageClient({ initialBusiness, initialChannels }: SettingsPageClientProps) {
  const [business, setBusiness] = useState(initialBusiness)
  const [channels, setChannels] = useState(initialChannels)
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
      data?: { url: string }
    }

    if (!result.success || !result.data?.url) {
      setConnectingChannels((current) => ({ ...current, [channel]: false }))
      setChannelStates((current) => ({
        ...current,
        [channel]: { type: 'error', message: result.error ?? 'Impossible de démarrer la connexion Unipile.' },
      }))
      return
    }

    window.location.href = result.data.url
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

      <section className="nx-card p-4 md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-[14px] font-semibold text-[color:var(--text-primary)]">Abonnement</h2>
            <div className="mt-2 flex items-center gap-2"><Badge variant={business.plan} /><span className="text-[12.5px] text-[color:var(--text-secondary)]">Plan actuel</span></div>
          </div>
          <a href="#" className="text-[12.5px] font-semibold text-[color:var(--text-primary)] underline-offset-2 hover:underline">Mettre à niveau</a>
        </div>
      </section>
    </div>
  )
}
