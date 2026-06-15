'use client'

import { startTransition, useState } from 'react'
import type { MetaAssetOption } from '@/lib/meta/oauth'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/utils'

type ConnectionStatus = 'PENDING' | 'ACTIVE' | 'DISCONNECTED' | 'ERROR'

type BusinessSettings = {
  name: string
  email: string
  phone: string
  businessType: string
  tone: string
  plan: string
}

type ChannelKey = 'WHATSAPP' | 'MESSENGER' | 'INSTAGRAM'

type ChannelSettings = {
  channel: ChannelKey
  status: ConnectionStatus | 'NOT_CONNECTED'
  label: string
  metaAppId: string
  metaUserId: string
  metaBusinessAccountId: string
  metaBusinessName: string
  metaPhoneNumberId: string
  metaPhoneNumber: string
  metaPageId: string
  metaPageName: string
  metaInstagramAccountId: string
  metaInstagramUsername: string
  accessToken: string
  webhookVerifyToken: string
  oauthOptions: MetaAssetOption[]
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
  MESSENGER: 'Messenger',
  INSTAGRAM: 'Instagram',
}

const channelDescriptions: Record<ChannelKey, string> = {
  WHATSAPP: 'Connectez le numéro WhatsApp Business depuis Meta pour commencer à recevoir les messages dans l’inbox.',
  MESSENGER: 'Connectez la page Facebook qui reçoit les messages clients. Cette page sera utilisée comme inbox Messenger.',
  INSTAGRAM: 'Connectez le compte Instagram professionnel lié à votre page Facebook pour recevoir les DM.',
}

const CHANNEL_ORDER: ChannelKey[] = ['WHATSAPP', 'MESSENGER', 'INSTAGRAM']

function getStatusTone(status: ChannelSettings['status']) {
  if (status === 'ACTIVE') return 'success'
  if (status === 'ERROR') return 'danger'
  if (status === 'DISCONNECTED') return 'warning'
  if (status === 'PENDING') return 'warning'
  return 'neutral'
}

function getStatusLabel(status: ChannelSettings['status']) {
  if (status === 'ACTIVE') return 'Connecté'
  if (status === 'ERROR') return 'Erreur'
  if (status === 'DISCONNECTED') return 'Déconnecté'
  if (status === 'PENDING') return 'À terminer'
  return 'Non connecté'
}

function buildDefaultState() {
  return { type: 'idle', message: '' } satisfies SaveState
}

export function SettingsPageClient({ initialBusiness, initialChannels }: SettingsPageClientProps) {
  const [business, setBusiness] = useState(initialBusiness)
  const [channels, setChannels] = useState(initialChannels)
  const [activeChannel, setActiveChannel] = useState<ChannelKey>('WHATSAPP')
  const [businessState, setBusinessState] = useState<SaveState>(buildDefaultState())
  const [channelStates, setChannelStates] = useState<Record<ChannelKey, SaveState>>({
    WHATSAPP: buildDefaultState(),
    MESSENGER: buildDefaultState(),
    INSTAGRAM: buildDefaultState(),
  })
  const [savingBusiness, setSavingBusiness] = useState(false)
  const [savingChannels, setSavingChannels] = useState<Record<ChannelKey, boolean>>({
    WHATSAPP: false,
    MESSENGER: false,
    INSTAGRAM: false,
  })
  const [connectingChannels, setConnectingChannels] = useState<Record<ChannelKey, boolean>>({
    WHATSAPP: false,
    MESSENGER: false,
    INSTAGRAM: false,
  })
  const [selectedAssets, setSelectedAssets] = useState<Record<ChannelKey, string>>({
    WHATSAPP: initialChannels.WHATSAPP.metaPhoneNumberId,
    MESSENGER: initialChannels.MESSENGER.metaPageId,
    INSTAGRAM: initialChannels.INSTAGRAM.metaInstagramAccountId,
  })

  function updateBusinessField(field: keyof BusinessSettings, value: string) {
    setBusiness((current) => ({ ...current, [field]: value }))
  }

  function updateChannelField(channel: ChannelKey, field: keyof ChannelSettings, value: string) {
    setChannels((current) => ({
      ...current,
      [channel]: {
        ...current[channel],
        [field]: value,
      },
    }))
  }

  function updateSelectedAsset(channel: ChannelKey, value: string) {
    setSelectedAssets((current) => ({ ...current, [channel]: value }))
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
      body: JSON.stringify(channels[channel]),
    })

    const result = await response.json() as {
      success: boolean
      error?: string
      data?: {
        status: ChannelSettings['status']
      }
    }

    setSavingChannels((current) => ({ ...current, [channel]: false }))

    if (result.success) {
      setChannels((current) => ({
        ...current,
        [channel]: {
          ...current[channel],
          status: result.data?.status ?? current[channel].status,
        },
      }))
      setChannelStates((current) => ({ ...current, [channel]: { type: 'success', message: 'Nom enregistré.' } }))
      return
    }

    setChannelStates((current) => ({
      ...current,
      [channel]: { type: 'error', message: result.error ?? 'Impossible d’enregistrer ce canal.' },
    }))
  }

  async function startMetaOAuth(channel: ChannelKey) {
    setConnectingChannels((current) => ({ ...current, [channel]: true }))
    setChannelStates((current) => ({ ...current, [channel]: buildDefaultState() }))

    const response = await fetch('/api/settings/channels/meta/start', {
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
        [channel]: { type: 'error', message: result.error ?? 'Impossible de démarrer la connexion Meta.' },
      }))
      return
    }

    window.location.href = result.data.url
  }

  async function selectMetaAsset(channel: ChannelKey) {
    const assetId = selectedAssets[channel]

    if (!assetId) {
      setChannelStates((current) => ({
        ...current,
        [channel]: { type: 'error', message: 'Sélectionnez un actif Meta avant de continuer.' },
      }))
      return
    }

    setSavingChannels((current) => ({ ...current, [channel]: true }))
    setChannelStates((current) => ({ ...current, [channel]: buildDefaultState() }))

    const response = await fetch('/api/settings/channels/meta/select', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel, assetId }),
    })

    const result = await response.json() as {
      success: boolean
      error?: string
      data?: {
        status: ChannelSettings['status']
        metaBusinessAccountId?: string | null
        metaBusinessName?: string | null
        metaPhoneNumberId?: string | null
        metaPhoneNumber?: string | null
        metaPageId?: string | null
        metaPageName?: string | null
        metaInstagramAccountId?: string | null
        metaInstagramUsername?: string | null
        accessToken?: string | null
        webhookVerifyToken?: string | null
      }
    }

    setSavingChannels((current) => ({ ...current, [channel]: false }))

    if (!result.success || !result.data) {
      setChannelStates((current) => ({
        ...current,
        [channel]: { type: 'error', message: result.error ?? 'Impossible d’activer cet actif.' },
      }))
      return
    }

    const data = result.data

    setChannels((current) => ({
      ...current,
      [channel]: {
        ...current[channel],
        status: data.status,
        metaBusinessAccountId: data.metaBusinessAccountId ?? '',
        metaBusinessName: data.metaBusinessName ?? '',
        metaPhoneNumberId: data.metaPhoneNumberId ?? '',
        metaPhoneNumber: data.metaPhoneNumber ?? '',
        metaPageId: data.metaPageId ?? '',
        metaPageName: data.metaPageName ?? '',
        metaInstagramAccountId: data.metaInstagramAccountId ?? '',
        metaInstagramUsername: data.metaInstagramUsername ?? '',
        accessToken: data.accessToken ?? '',
        webhookVerifyToken: data.webhookVerifyToken ?? '',
      },
    }))

    setChannelStates((current) => ({
      ...current,
      [channel]: { type: 'success', message: 'Connexion Meta mise à jour.' },
    }))
  }

  function renderConnectionSummary(item: ChannelSettings) {
    if (item.channel === 'WHATSAPP' && item.metaPhoneNumberId) {
      return (
        <div className="space-y-1 text-[12.5px] text-[color:var(--text-secondary)]">
          <p>Numéro connecté: {item.metaPhoneNumber || item.metaPhoneNumberId}</p>
          <p>WABA: {item.metaBusinessName || item.metaBusinessAccountId || 'Non remonté par Meta'}</p>
          <p>Verify token webhook: généré automatiquement</p>
        </div>
      )
    }

    if (item.channel === 'MESSENGER' && item.metaPageId) {
      return (
        <div className="space-y-1 text-[12.5px] text-[color:var(--text-secondary)]">
          <p>Page connectée: {item.metaPageName || item.metaPageId}</p>
          <p>Page ID: {item.metaPageId}</p>
        </div>
      )
    }

    if (item.channel === 'INSTAGRAM' && item.metaInstagramAccountId) {
      return (
        <div className="space-y-1 text-[12.5px] text-[color:var(--text-secondary)]">
          <p>Compte connecté: {item.metaInstagramUsername ? `@${item.metaInstagramUsername.replace(/^@/, '')}` : item.metaInstagramAccountId}</p>
          <p>Page liée: {item.metaPageName || item.metaPageId || 'Non remontée'}</p>
        </div>
      )
    }

    return (
      <p className="text-[12.5px] leading-[1.6] text-[color:var(--text-muted)]">
        La connexion OAuth Meta remplit automatiquement les identifiants et tokens nécessaires. Cliquez sur « Connecter avec Meta », autorisez les permissions, puis choisissez l’actif à activer si plusieurs sont trouvés.
      </p>
    )
  }

  const item = channels[activeChannel]
  const state = channelStates[activeChannel]
  const saving = savingChannels[activeChannel]
  const connecting = connectingChannels[activeChannel]

  return (
    <div className="nx-page max-w-4xl">
      {/* Business info */}
      <section className="nx-card p-4 md:p-5">
        <div className="mb-4">
          <h2 className="text-[14px] font-semibold text-[color:var(--text-primary)]">Mon entreprise</h2>
          <p className="mt-1 text-[12.5px] text-[color:var(--text-secondary)]">Informations visibles dans votre espace Répondly.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="nx-field text-[12px] font-medium text-[color:var(--text-secondary)]">Nom de l'entreprise<Input value={business.name} onChange={(event) => updateBusinessField('name', event.target.value)} placeholder="Nom de l'entreprise" /></label>
          <label className="nx-field text-[12px] font-medium text-[color:var(--text-secondary)]">Téléphone<Input value={business.phone} onChange={(event) => updateBusinessField('phone', event.target.value)} placeholder="Téléphone" /></label>
          <label className="nx-field text-[12px] font-medium text-[color:var(--text-secondary)] md:col-span-2">Email<Input value={business.email} onChange={(event) => updateBusinessField('email', event.target.value)} placeholder="Email" type="email" /></label>
          <label className="nx-field text-[12px] font-medium text-[color:var(--text-secondary)]">Type d'activité<select value={business.businessType} onChange={(event) => updateBusinessField('businessType', event.target.value)} className="nx-input h-9 w-full px-3 text-[13px]"><option value="other">Autre</option><option value="clinic">Clinique</option><option value="salon">Salon</option><option value="ecom">E-commerce</option><option value="garage">Garage</option></select></label>
          <label className="nx-field text-[12px] font-medium text-[color:var(--text-secondary)]">Ton<select value={business.tone} onChange={(event) => updateBusinessField('tone', event.target.value)} className="nx-input h-9 w-full px-3 text-[13px]"><option value="friendly">Amical</option><option value="formal">Formel</option></select></label>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button onClick={() => startTransition(saveBusiness)} disabled={savingBusiness}>{savingBusiness ? 'Sauvegarde...' : 'Sauvegarder'}</Button>
          {businessState.type !== 'idle' ? <p className={businessState.type === 'success' ? 'text-[12.5px] text-[color:var(--success)]' : 'text-[12.5px] text-[color:var(--danger)]'}>{businessState.message}</p> : null}
        </div>
      </section>

      {/* Channel connections — tabbed */}
      <section className="nx-card p-4 md:p-5">
        <div className="mb-4">
          <h2 className="text-[14px] font-semibold text-[color:var(--text-primary)]">Canaux connectés</h2>
          <p className="mt-1 text-[12.5px] text-[color:var(--text-secondary)]">Connectez chaque canal Meta puis choisissez l’actif à utiliser dans Répondly.</p>
        </div>

        <div role="tablist" aria-label="Canaux" className="nx-no-scrollbar flex gap-2 overflow-x-auto border-b border-[color:var(--border)] pb-3">
          {CHANNEL_ORDER.map((channel) => {
            const channelItem = channels[channel]
            const active = channel === activeChannel
            return (
              <button
                key={channel}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveChannel(channel)}
                className={cn('nx-filter-chip shrink-0', active && 'is-active')}
              >
                <span>{channelTitles[channel]}</span>
                <Badge dot tone={getStatusTone(channelItem.status)} className="ml-0.5" />
              </button>
            )
          })}
        </div>

        <div className="mt-4 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <p className="max-w-[460px] text-[12.5px] leading-[1.55] text-[color:var(--text-secondary)]">{channelDescriptions[activeChannel]}</p>
            <Badge tone={getStatusTone(item.status)} variant={getStatusLabel(item.status)} />
          </div>

          <label className="nx-field text-[12px] font-medium text-[color:var(--text-secondary)] max-w-md">Nom interne<Input value={item.label} onChange={(event) => updateChannelField(activeChannel, 'label', event.target.value)} placeholder="Nom affiché dans Répondly" /></label>

          <div className="rounded-[var(--radius-btn)] border border-[color:var(--border)] bg-[color:var(--bg-page)] p-3">
            {renderConnectionSummary(item)}
          </div>

          {item.oauthOptions.length > 1 ? (
            <label className="nx-field text-[12px] font-medium text-[color:var(--text-secondary)] max-w-md">
              Actif Meta
              <select value={selectedAssets[activeChannel]} onChange={(event) => updateSelectedAsset(activeChannel, event.target.value)} className="nx-input h-9 w-full px-3 text-[13px]">
                <option value="">Sélectionner un actif</option>
                {item.oauthOptions.map((option) => (
                  <option key={option.id} value={option.id}>{option.label}</option>
                ))}
              </select>
            </label>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="primary" onClick={() => startTransition(() => startMetaOAuth(activeChannel))} disabled={connecting}>
              {connecting ? 'Redirection...' : item.status === 'ACTIVE' ? 'Reconnecter avec Meta' : 'Connecter avec Meta'}
            </Button>
            {item.oauthOptions.length > 1 ? <Button variant="secondary" onClick={() => startTransition(() => selectMetaAsset(activeChannel))} disabled={saving}>{saving ? 'Activation...' : 'Activer la sélection'}</Button> : null}
            <Button variant="ghost" onClick={() => startTransition(() => saveChannel(activeChannel))} disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer le nom'}</Button>
            {state.type !== 'idle' ? <p className={state.type === 'success' ? 'text-[12.5px] text-[color:var(--success)]' : 'text-[12.5px] text-[color:var(--danger)]'}>{state.message}</p> : null}
          </div>
        </div>
      </section>

      {/* Subscription */}
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
