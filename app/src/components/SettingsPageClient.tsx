'use client'

import { startTransition, useState } from 'react'
import type { ConnectionStatus } from '@prisma/client'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

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
  MESSENGER: 'Facebook Messenger',
  INSTAGRAM: 'Instagram',
}

const channelDescriptions: Record<ChannelKey, string> = {
  WHATSAPP: 'Renseignez le numéro WhatsApp Business connecté à Meta pour commencer à recevoir les messages dans l’inbox.',
  MESSENGER: 'Reliez la page Facebook qui reçoit les messages clients. Cette page sera utilisée comme inbox Messenger.',
  INSTAGRAM: 'Reliez le compte Instagram professionnel connecté à votre page Facebook pour recevoir les DM.',
}

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
      setChannelStates((current) => ({ ...current, [channel]: { type: 'success', message: 'Connexion enregistrée.' } }))
      return
    }

    setChannelStates((current) => ({
      ...current,
      [channel]: { type: 'error', message: result.error ?? 'Impossible d’enregistrer cette connexion.' },
    }))
  }

  return (
    <div className="rp-page max-w-5xl">
      <section className="rp-panel p-4 md:p-5">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-[color:var(--text-primary)]">Mon entreprise</h2>
          <p className="mt-1 text-sm text-[color:var(--text-secondary)]">Informations visibles dans votre espace Répondly.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="rp-field-label">Nom de l'entreprise<Input value={business.name} onChange={(event) => updateBusinessField('name', event.target.value)} placeholder="Nom de l'entreprise" /></label>
          <label className="rp-field-label">Téléphone<Input value={business.phone} onChange={(event) => updateBusinessField('phone', event.target.value)} placeholder="Téléphone" /></label>
          <label className="rp-field-label md:col-span-2">Email<Input value={business.email} onChange={(event) => updateBusinessField('email', event.target.value)} placeholder="Email" type="email" /></label>
          <label className="rp-field-label">Type d'activité<select value={business.businessType} onChange={(event) => updateBusinessField('businessType', event.target.value)} className="rp-field-control h-9 w-full px-3 text-[13.5px]"><option value="other">Autre</option><option value="clinic">Clinique</option><option value="salon">Salon</option><option value="ecom">E-commerce</option><option value="garage">Garage</option></select></label>
          <label className="rp-field-label">Ton<select value={business.tone} onChange={(event) => updateBusinessField('tone', event.target.value)} className="rp-field-control h-9 w-full px-3 text-[13.5px]"><option value="friendly">Amical</option><option value="formal">Formel</option></select></label>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button onClick={() => startTransition(saveBusiness)} disabled={savingBusiness}>{savingBusiness ? 'Sauvegarde...' : 'Sauvegarder'}</Button>
          {businessState.type !== 'idle' ? <p className={businessState.type === 'success' ? 'text-sm text-[color:var(--tone-success)]' : 'text-sm text-[color:var(--tone-danger)]'}>{businessState.message}</p> : null}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        {(['WHATSAPP', 'MESSENGER', 'INSTAGRAM'] as ChannelKey[]).map((channel) => {
          const item = channels[channel]
          const state = channelStates[channel]
          const saving = savingChannels[channel]

          return (
            <article key={channel} className="rp-panel p-4 md:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-[color:var(--text-primary)]">{channelTitles[channel]}</h2>
                  <p className="mt-1 text-sm text-[color:var(--text-secondary)]">{channelDescriptions[channel]}</p>
                </div>
                <Badge tone={getStatusTone(item.status)} variant={getStatusLabel(item.status)} />
              </div>

              <div className="mt-4 space-y-3">
                <label className="rp-field-label">Nom interne<Input value={item.label} onChange={(event) => updateChannelField(channel, 'label', event.target.value)} placeholder="Nom affiché dans Répondly" /></label>
                <label className="rp-field-label">Meta App ID<Input value={item.metaAppId} onChange={(event) => updateChannelField(channel, 'metaAppId', event.target.value)} placeholder="App ID Meta" /></label>
                <label className="rp-field-label">Meta User ID<Input value={item.metaUserId} onChange={(event) => updateChannelField(channel, 'metaUserId', event.target.value)} placeholder="Utilisateur Meta" /></label>
                <label className="rp-field-label">Business Account ID<Input value={item.metaBusinessAccountId} onChange={(event) => updateChannelField(channel, 'metaBusinessAccountId', event.target.value)} placeholder="Business Account ID" /></label>
                {channel === 'WHATSAPP' ? <label className="rp-field-label">Phone Number ID<Input value={item.metaPhoneNumberId} onChange={(event) => updateChannelField(channel, 'metaPhoneNumberId', event.target.value)} placeholder="Phone Number ID" /></label> : null}
                {channel === 'WHATSAPP' ? <label className="rp-field-label">Numéro WhatsApp<Input value={item.metaPhoneNumber} onChange={(event) => updateChannelField(channel, 'metaPhoneNumber', event.target.value)} placeholder="+216..." /></label> : null}
                {channel === 'MESSENGER' ? <label className="rp-field-label">Page ID<Input value={item.metaPageId} onChange={(event) => updateChannelField(channel, 'metaPageId', event.target.value)} placeholder="Facebook Page ID" /></label> : null}
                {channel === 'MESSENGER' ? <label className="rp-field-label">Nom de la page<Input value={item.metaPageName} onChange={(event) => updateChannelField(channel, 'metaPageName', event.target.value)} placeholder="Nom de la page" /></label> : null}
                {channel === 'INSTAGRAM' ? <label className="rp-field-label">Instagram Account ID<Input value={item.metaInstagramAccountId} onChange={(event) => updateChannelField(channel, 'metaInstagramAccountId', event.target.value)} placeholder="Instagram Account ID" /></label> : null}
                {channel === 'INSTAGRAM' ? <label className="rp-field-label">Nom d'utilisateur Instagram<Input value={item.metaInstagramUsername} onChange={(event) => updateChannelField(channel, 'metaInstagramUsername', event.target.value)} placeholder="@compte" /></label> : null}
                <label className="rp-field-label">Access Token<Input type="password" value={item.accessToken} onChange={(event) => updateChannelField(channel, 'accessToken', event.target.value)} placeholder="Access Token Meta" /></label>
                {channel === 'WHATSAPP' ? <label className="rp-field-label">Webhook Verify Token<Input type="password" value={item.webhookVerifyToken} onChange={(event) => updateChannelField(channel, 'webhookVerifyToken', event.target.value)} placeholder="Verify Token" /></label> : null}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Button variant="secondary" onClick={() => startTransition(() => saveChannel(channel))} disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer la connexion'}</Button>
                {state.type !== 'idle' ? <p className={state.type === 'success' ? 'text-sm text-[color:var(--tone-success)]' : 'text-sm text-[color:var(--tone-danger)]'}>{state.message}</p> : null}
              </div>
            </article>
          )
        })}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rp-panel p-4 md:p-5">
          <div>
            <h2 className="text-sm font-semibold text-[color:var(--text-primary)]">Abonnement</h2>
            <p className="mt-1 text-sm text-[color:var(--text-secondary)]">Usage et niveau de plan actuel.</p>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3"><Badge variant={business.plan} /><span className="text-sm text-[color:var(--text-secondary)]">Le suivi de quota sera branché sur les données réelles du plan.</span></div>
        </article>

        <article className="rp-panel p-4 md:p-5">
          <div>
            <h2 className="text-sm font-semibold text-[color:var(--text-primary)]">Connexion Meta</h2>
            <p className="mt-1 text-sm text-[color:var(--text-secondary)]">Chaque client doit enregistrer ici ses identifiants Meta actifs avant de pouvoir recevoir des messages dans Répondly.</p>
          </div>
          <div className="mt-4 text-sm leading-[1.6] text-[color:var(--text-secondary)]">
            <p>WhatsApp: renseignez au minimum le Phone Number ID et le token.</p>
            <p className="mt-2">Messenger: renseignez au minimum le Page ID et le token de page.</p>
            <p className="mt-2">Instagram: renseignez au minimum l’Instagram Account ID et le token associé.</p>
          </div>
        </article>
      </section>
    </div>
  )
}
