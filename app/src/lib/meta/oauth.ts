import type { Prisma } from '@prisma/client'
import { ConnectionStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'

type ChannelType = 'WHATSAPP' | 'MESSENGER' | 'INSTAGRAM'

type MetaConfig = {
  appId: string
  appSecret: string
  redirectUri: string
}

type MetaOAuthState = {
  businessId: string
  channel: ChannelType
  nonce: string
}

type MetaTokenResult = {
  accessToken: string
  expiresIn: number | null
}

type MetaProfile = {
  id: string
  name: string
}

export type MetaAssetOption = {
  id: string
  label: string
  channel: ChannelType
  metaBusinessAccountId: string | null
  metaBusinessName: string | null
  metaPhoneNumberId: string | null
  metaPhoneNumber: string | null
  metaPageId: string | null
  metaPageName: string | null
  metaInstagramAccountId: string | null
  metaInstagramUsername: string | null
  accessToken: string | null
}

export type ChannelMetadata = {
  oauthAssets?: MetaAssetOption[]
  userAccessToken?: string
  userTokenExpiresAt?: string | null
  lastOAuthAt?: string
}

type MetaBusiness = {
  id: string
  name: string
}

type MetaWhatsAppPhoneNumber = {
  id: string
  displayPhoneNumber: string | null
  verifiedName: string | null
}

type MetaPage = {
  id: string
  name: string
  accessToken: string | null
  instagramAccountId: string | null
  instagramUsername: string | null
}

const GRAPH_VERSION = 'v23.0'
const META_SCOPES = [
  'business_management',
  'pages_manage_metadata',
  'pages_messaging',
  'pages_read_engagement',
  'instagram_basic',
  'instagram_manage_messages',
  'whatsapp_business_management',
  'whatsapp_business_messaging',
]

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? value as Record<string, unknown> : null
}

function asString(value: unknown) {
  return typeof value === 'string' ? value : null
}

function asNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value : []
}

function toBase64Url(value: string) {
  return Buffer.from(value, 'utf8').toString('base64url')
}

function fromBase64Url(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8')
}

export function getMetaConfig(): MetaConfig {
  const appId = process.env.META_APP_ID?.trim() ?? ''
  const appSecret = process.env.META_APP_SECRET?.trim() ?? ''
  const redirectUri = process.env.META_REDIRECT_URI?.trim() ?? ''

  if (!appId || !appSecret || !redirectUri) {
    throw new Error('META_APP_ID, META_APP_SECRET et META_REDIRECT_URI sont requis.')
  }

  return { appId, appSecret, redirectUri }
}

export function buildMetaOAuthState(input: Omit<MetaOAuthState, 'nonce'>) {
  return toBase64Url(JSON.stringify({
    ...input,
    nonce: crypto.randomUUID(),
  } satisfies MetaOAuthState))
}

export function parseMetaOAuthState(rawState: string) {
  const parsed = JSON.parse(fromBase64Url(rawState)) as unknown
  const state = asRecord(parsed)

  if (!state) {
    throw new Error('State Meta invalide.')
  }

  const businessId = asString(state.businessId)
  const channel = asString(state.channel)
  const nonce = asString(state.nonce)

  if (!businessId || !nonce || (channel !== 'WHATSAPP' && channel !== 'MESSENGER' && channel !== 'INSTAGRAM')) {
    throw new Error('State Meta invalide.')
  }

  return { businessId, channel, nonce } satisfies MetaOAuthState
}

export function buildMetaOAuthUrl(channel: ChannelType, businessId: string) {
  const { appId, redirectUri } = getMetaConfig()
  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: META_SCOPES.join(','),
    state: buildMetaOAuthState({ businessId, channel }),
  })

  return `https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth?${params.toString()}`
}

async function fetchJson(url: string) {
  const response = await fetch(url, { cache: 'no-store' })
  const payload = await response.json().catch(() => null) as unknown

  if (!response.ok) {
    const errorRecord = asRecord(payload)
    const nestedError = asRecord(errorRecord?.error)
    const errorMessage = asString(nestedError?.message) ?? asString(errorRecord?.message) ?? 'Erreur Meta.'
    throw new Error(errorMessage)
  }

  return payload
}

async function exchangeCodeForToken(code: string) {
  const { appId, appSecret, redirectUri } = getMetaConfig()
  const params = new URLSearchParams({
    client_id: appId,
    client_secret: appSecret,
    redirect_uri: redirectUri,
    code,
  })

  const payload = await fetchJson(`https://graph.facebook.com/${GRAPH_VERSION}/oauth/access_token?${params.toString()}`)
  const record = asRecord(payload)
  const accessToken = asString(record?.access_token)
  const expiresIn = asNumber(record?.expires_in)

  if (!accessToken) {
    throw new Error('Meta n’a pas renvoyé de token.')
  }

  return { accessToken, expiresIn } satisfies MetaTokenResult
}

async function exchangeForLongLivedToken(token: string) {
  const { appId, appSecret } = getMetaConfig()
  const params = new URLSearchParams({
    grant_type: 'fb_exchange_token',
    client_id: appId,
    client_secret: appSecret,
    fb_exchange_token: token,
  })

  try {
    const payload = await fetchJson(`https://graph.facebook.com/${GRAPH_VERSION}/oauth/access_token?${params.toString()}`)
    const record = asRecord(payload)
    const accessToken = asString(record?.access_token)
    const expiresIn = asNumber(record?.expires_in)

    if (!accessToken) {
      return { accessToken: token, expiresIn: null } satisfies MetaTokenResult
    }

    return { accessToken, expiresIn } satisfies MetaTokenResult
  } catch {
    return { accessToken: token, expiresIn: null } satisfies MetaTokenResult
  }
}

async function graphGet(path: string, accessToken: string, searchParams?: URLSearchParams) {
  const params = searchParams ?? new URLSearchParams()
  params.set('access_token', accessToken)
  return fetchJson(`https://graph.facebook.com/${GRAPH_VERSION}${path}?${params.toString()}`)
}

async function fetchMetaProfile(accessToken: string) {
  const payload = await graphGet('/me', accessToken, new URLSearchParams({ fields: 'id,name' }))
  const record = asRecord(payload)
  const id = asString(record?.id)
  const name = asString(record?.name)

  if (!id || !name) {
    throw new Error('Impossible de lire le profil Meta.')
  }

  return { id, name } satisfies MetaProfile
}

async function fetchMetaBusinesses(accessToken: string) {
  const payload = await graphGet('/me/businesses', accessToken, new URLSearchParams({ fields: 'id,name', limit: '100' }))

  return asArray(asRecord(payload)?.data)
    .map((item) => {
      const record = asRecord(item)
      const id = asString(record?.id)
      const name = asString(record?.name)

      if (!id || !name) {
        return null
      }

      return { id, name } satisfies MetaBusiness
    })
    .filter((item): item is MetaBusiness => item !== null)
}

async function fetchWhatsAppAssets(accessToken: string, businesses: MetaBusiness[]) {
  const options: MetaAssetOption[] = []

  for (const business of businesses) {
    const payload = await graphGet(
      `/${business.id}/owned_whatsapp_business_accounts`,
      accessToken,
      new URLSearchParams({ fields: 'id,name,phone_numbers.limit(100){id,display_phone_number,verified_name}', limit: '100' }),
    ).catch(() => null)

    const data = asArray(asRecord(payload)?.data)

    for (const accountValue of data) {
      const accountRecord = asRecord(accountValue)
      const accountId = asString(accountRecord?.id)
      const accountName = asString(accountRecord?.name)

      if (!accountId) {
        continue
      }

      const phoneNumbers = asArray(asRecord(accountRecord?.phone_numbers)?.data)
        .map((phoneValue) => {
          const phoneRecord = asRecord(phoneValue)
          const id = asString(phoneRecord?.id)

          if (!id) {
            return null
          }

          return {
            id,
            displayPhoneNumber: asString(phoneRecord?.display_phone_number),
            verifiedName: asString(phoneRecord?.verified_name),
          } satisfies MetaWhatsAppPhoneNumber
        })
        .filter((item): item is MetaWhatsAppPhoneNumber => item !== null)

      for (const phoneNumber of phoneNumbers) {
        options.push({
          id: phoneNumber.id,
          label: phoneNumber.verifiedName ?? phoneNumber.displayPhoneNumber ?? `Numéro ${phoneNumber.id}`,
          channel: 'WHATSAPP',
          metaBusinessAccountId: accountId,
          metaBusinessName: accountName ?? business.name,
          metaPhoneNumberId: phoneNumber.id,
          metaPhoneNumber: phoneNumber.displayPhoneNumber,
          metaPageId: null,
          metaPageName: null,
          metaInstagramAccountId: null,
          metaInstagramUsername: null,
          accessToken,
        })
      }
    }
  }

  return options
}

async function fetchPages(accessToken: string) {
  const payload = await graphGet(
    '/me/accounts',
    accessToken,
    new URLSearchParams({
      fields: 'id,name,access_token,instagram_business_account{id,username},connected_instagram_account{id,username}',
      limit: '100',
    }),
  )

  return asArray(asRecord(payload)?.data)
    .map((item) => {
      const record = asRecord(item)
      const instagramBusinessAccount = asRecord(record?.instagram_business_account)
      const connectedInstagramAccount = asRecord(record?.connected_instagram_account)
      const instagramAccount = instagramBusinessAccount ?? connectedInstagramAccount
      const id = asString(record?.id)
      const name = asString(record?.name)

      if (!id || !name) {
        return null
      }

      return {
        id,
        name,
        accessToken: asString(record?.access_token),
        instagramAccountId: asString(instagramAccount?.id),
        instagramUsername: asString(instagramAccount?.username),
      } satisfies MetaPage
    })
    .filter((item): item is MetaPage => item !== null)
}

function buildMessengerAssets(pages: MetaPage[]) {
  return pages
    .filter((page) => page.accessToken)
    .map((page) => ({
      id: page.id,
      label: page.name,
      channel: 'MESSENGER',
      metaBusinessAccountId: null,
      metaBusinessName: null,
      metaPhoneNumberId: null,
      metaPhoneNumber: null,
      metaPageId: page.id,
      metaPageName: page.name,
      metaInstagramAccountId: null,
      metaInstagramUsername: null,
      accessToken: page.accessToken,
    } satisfies MetaAssetOption))
}

function buildInstagramAssets(pages: MetaPage[]) {
  return pages
    .filter((page) => page.accessToken && page.instagramAccountId)
    .map((page) => ({
      id: page.instagramAccountId ?? page.id,
      label: page.instagramUsername ? `@${page.instagramUsername}` : page.name,
      channel: 'INSTAGRAM',
      metaBusinessAccountId: null,
      metaBusinessName: null,
      metaPhoneNumberId: null,
      metaPhoneNumber: null,
      metaPageId: page.id,
      metaPageName: page.name,
      metaInstagramAccountId: page.instagramAccountId,
      metaInstagramUsername: page.instagramUsername,
      accessToken: page.accessToken,
    } satisfies MetaAssetOption))
}

function buildTokenExpiry(expiresIn: number | null) {
  if (!expiresIn) {
    return null
  }

  return new Date(Date.now() + expiresIn * 1000)
}

function buildChannelMetadata(options: MetaAssetOption[], token: MetaTokenResult): Prisma.InputJsonValue {
  return {
    oauthAssets: options,
    userAccessToken: token.accessToken,
    userTokenExpiresAt: buildTokenExpiry(token.expiresIn)?.toISOString() ?? null,
    lastOAuthAt: new Date().toISOString(),
  } satisfies ChannelMetadata
}

export function parseChannelMetadata(value: Prisma.JsonValue | null): ChannelMetadata {
  const record = asRecord(value)

  if (!record) {
    return {}
  }

  const options = asArray(record.oauthAssets)
    .map((item) => {
      const option = asRecord(item)
      const id = asString(option?.id)
      const label = asString(option?.label)
      const channel = asString(option?.channel)

      if (!id || !label || (channel !== 'WHATSAPP' && channel !== 'MESSENGER' && channel !== 'INSTAGRAM')) {
        return null
      }

      return {
        id,
        label,
        channel,
        metaBusinessAccountId: asString(option?.metaBusinessAccountId),
        metaBusinessName: asString(option?.metaBusinessName),
        metaPhoneNumberId: asString(option?.metaPhoneNumberId),
        metaPhoneNumber: asString(option?.metaPhoneNumber),
        metaPageId: asString(option?.metaPageId),
        metaPageName: asString(option?.metaPageName),
        metaInstagramAccountId: asString(option?.metaInstagramAccountId),
        metaInstagramUsername: asString(option?.metaInstagramUsername),
        accessToken: asString(option?.accessToken),
      } satisfies MetaAssetOption
    })
    .filter((item): item is MetaAssetOption => item !== null)

  return {
    oauthAssets: options,
    userAccessToken: asString(record.userAccessToken) ?? undefined,
    userTokenExpiresAt: asString(record.userTokenExpiresAt),
    lastOAuthAt: asString(record.lastOAuthAt) ?? undefined,
  }
}

function applySelectedAsset(channel: ChannelType, option: MetaAssetOption, existingVerifyToken: string | null) {
  if (channel === 'WHATSAPP') {
    return {
      status: ConnectionStatus.ACTIVE,
      metaBusinessAccountId: option.metaBusinessAccountId,
      metaBusinessName: option.metaBusinessName,
      metaPhoneNumberId: option.metaPhoneNumberId,
      metaPhoneNumber: option.metaPhoneNumber,
      metaPageId: null,
      metaPageName: null,
      metaInstagramAccountId: null,
      metaInstagramUsername: null,
      accessToken: option.accessToken,
      webhookVerifyToken: existingVerifyToken ?? crypto.randomUUID().replace(/-/g, ''),
    }
  }

  if (channel === 'MESSENGER') {
    return {
      status: ConnectionStatus.ACTIVE,
      metaPageId: option.metaPageId,
      metaPageName: option.metaPageName,
      metaInstagramAccountId: null,
      metaInstagramUsername: null,
      metaPhoneNumberId: null,
      metaPhoneNumber: null,
      accessToken: option.accessToken,
      webhookVerifyToken: null,
    }
  }

  return {
    status: ConnectionStatus.ACTIVE,
    metaPageId: option.metaPageId,
    metaPageName: option.metaPageName,
    metaInstagramAccountId: option.metaInstagramAccountId,
    metaInstagramUsername: option.metaInstagramUsername,
    metaPhoneNumberId: null,
    metaPhoneNumber: null,
    accessToken: option.accessToken,
    webhookVerifyToken: null,
  }
}

export async function syncMetaConnectionFromCode(input: {
  businessId: string
  channel: ChannelType
  code: string
}) {
  const shortLivedToken = await exchangeCodeForToken(input.code)
  const token = await exchangeForLongLivedToken(shortLivedToken.accessToken)
  const [profile, businesses, pages] = await Promise.all([
    fetchMetaProfile(token.accessToken),
    fetchMetaBusinesses(token.accessToken),
    fetchPages(token.accessToken),
  ])

  const whatsappAssets = await fetchWhatsAppAssets(token.accessToken, businesses)
  const assetsByChannel: Record<ChannelType, MetaAssetOption[]> = {
    WHATSAPP: whatsappAssets,
    MESSENGER: buildMessengerAssets(pages),
    INSTAGRAM: buildInstagramAssets(pages),
  }

  const assets = assetsByChannel[input.channel]

  if (assets.length === 0) {
    throw new Error('Aucun actif Meta compatible n’a été trouvé pour ce canal.')
  }

  const metadata = buildChannelMetadata(assets, token)
  const existingConnection = await prisma.businessChannelConnection.findFirst({
    where: {
      businessId: input.businessId,
      channel: input.channel,
    },
    select: {
      id: true,
      webhookVerifyToken: true,
    },
  })

  const selectedAsset = assets.length === 1 ? assets[0] : null
  const selectionData = selectedAsset
    ? applySelectedAsset(input.channel, selectedAsset, existingConnection?.webhookVerifyToken ?? null)
    : {
        status: ConnectionStatus.PENDING,
        metaPhoneNumberId: null,
        metaPhoneNumber: null,
        metaPageId: null,
        metaPageName: null,
        metaInstagramAccountId: null,
        metaInstagramUsername: null,
        accessToken: null,
        webhookVerifyToken: existingConnection?.webhookVerifyToken ?? null,
      }

  const connection = existingConnection
    ? await prisma.businessChannelConnection.update({
        where: { id: existingConnection.id },
        data: {
          metaAppId: getMetaConfig().appId,
          metaUserId: profile.id,
          metaBusinessAccountId: selectedAsset?.metaBusinessAccountId ?? null,
          metaBusinessName: selectedAsset?.metaBusinessName ?? null,
          tokenExpiresAt: buildTokenExpiry(token.expiresIn),
          metadata,
          ...selectionData,
        },
      })
    : await prisma.businessChannelConnection.create({
        data: {
          businessId: input.businessId,
          channel: input.channel,
          label: selectedAsset?.label ?? null,
          metaAppId: getMetaConfig().appId,
          metaUserId: profile.id,
          metaBusinessAccountId: selectedAsset?.metaBusinessAccountId ?? null,
          metaBusinessName: selectedAsset?.metaBusinessName ?? null,
          tokenExpiresAt: buildTokenExpiry(token.expiresIn),
          metadata,
          ...selectionData,
        },
      })

  if (input.channel === 'WHATSAPP' && selectedAsset) {
    await prisma.business.update({
      where: { id: input.businessId },
      data: {
        waPhoneNumberId: selectedAsset.metaPhoneNumberId,
        wabaId: selectedAsset.metaBusinessAccountId,
        waAccessToken: selectedAsset.accessToken,
        waVerifyToken: connection.webhookVerifyToken,
      },
    })
  }

  return {
    connectionId: connection.id,
    status: connection.status,
    requiresSelection: assets.length > 1,
  }
}

export async function selectMetaAsset(input: {
  businessId: string
  channel: ChannelType
  assetId: string
}) {
  const connection = await prisma.businessChannelConnection.findFirst({
    where: {
      businessId: input.businessId,
      channel: input.channel,
    },
    select: {
      id: true,
      webhookVerifyToken: true,
      metadata: true,
    },
  })

  if (!connection) {
    throw new Error('Connexion Meta introuvable.')
  }

  const metadata = parseChannelMetadata(connection.metadata)
  const selectedAsset = metadata.oauthAssets?.find((item) => item.id === input.assetId)

  if (!selectedAsset) {
    throw new Error('Actif Meta introuvable.')
  }

  const updatedConnection = await prisma.businessChannelConnection.update({
    where: { id: connection.id },
    data: applySelectedAsset(input.channel, selectedAsset, connection.webhookVerifyToken),
    select: {
      status: true,
      metaBusinessAccountId: true,
      metaBusinessName: true,
      metaPhoneNumberId: true,
      metaPhoneNumber: true,
      metaPageId: true,
      metaPageName: true,
      metaInstagramAccountId: true,
      metaInstagramUsername: true,
      accessToken: true,
      webhookVerifyToken: true,
    },
  })

  if (input.channel === 'WHATSAPP') {
    await prisma.business.update({
      where: { id: input.businessId },
      data: {
        waPhoneNumberId: updatedConnection.metaPhoneNumberId,
        wabaId: updatedConnection.metaBusinessAccountId,
        waAccessToken: updatedConnection.accessToken,
        waVerifyToken: updatedConnection.webhookVerifyToken,
      },
    })
  }

  return updatedConnection
}
