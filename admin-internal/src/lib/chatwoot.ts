// src/lib/chatwoot.ts

const BASE_URL = process.env.CHATWOOT_BASE_URL || 'https://inbox.repondly.com'
const EMAIL    = process.env.CHATWOOT_EMAIL    || ''
const PASSWORD = process.env.CHATWOOT_PASSWORD || ''

// ─── Types ─────────────────────────────────────────────────────────────────────

export type ConversationStatus = 'open' | 'resolved' | 'pending' | 'snoozed'

export interface CWContact {
  id: number
  name: string
  phone_number: string | null
  email: string | null
  avatar_url: string | null
}

export interface CWInbox {
  id: number
  name: string
  channel_type: string
}

export interface CWConversation {
  id: number
  status: ConversationStatus
  unread_count: number
  timestamp: number
  last_activity_at: number
  inbox_id: number
  inbox: CWInbox
  meta: { sender: CWContact; channel: string }
  last_non_activity_message?: {
    content: string
    created_at: number
    message_type: number
  }
}

export interface CWMessage {
  id: number
  content: string
  content_type: string
  created_at: number
  message_type: number
  status: string
  sender?: { id: number; name: string; type: string; avatar_url?: string }
  attachments?: Array<{ id: number; file_type: string; data_url: string; thumb_url: string }>
}

export interface CWConversationListResponse {
  data: {
    meta: { all_count: number; unassigned_count: number; assigned_count: number; resolved_count: number }
    payload: CWConversation[]
  }
}

export interface CWMessagesResponse {
  payload: CWMessage[]
}

export interface CWInboxFull {
  id: number
  name: string
  channel_type: string        // 'Channel::Whatsapp' | 'Channel::FacebookPage' etc.
  phone_number: string | null // WhatsApp number e.g. "+21650000000"
  enable_auto_assignment: boolean
  working_hours_enabled: boolean
}

export interface CWInboxesResponse {
  payload: CWInboxFull[]
}

// ─── Session Cache ──────────────────────────────────────────────────────────────
// Cached in module scope — persists for the lifetime of the Next.js server process.
// Re-authenticates automatically on 401.

let sessionHeaders: Record<string, string> | null = null

async function getSessionHeaders(): Promise<Record<string, string>> {
  if (sessionHeaders) return sessionHeaders

  const res = await fetch(`${BASE_URL}/auth/sign_in`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    cache: 'no-store',
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Chatwoot sign_in failed ${res.status}: ${text}`)
  }

  const accessToken  = res.headers.get('access-token')
  const client       = res.headers.get('client')
  const uid          = res.headers.get('uid')
  const tokenType    = res.headers.get('token-type') || 'Bearer'

  if (!accessToken || !client || !uid) {
    throw new Error('Chatwoot sign_in: missing auth headers in response')
  }

  sessionHeaders = {
    'Content-Type':  'application/json',
    'access-token':  accessToken,
    'client':        client,
    'uid':           uid,
    'token-type':    tokenType,
  }

  return sessionHeaders
}

// ─── API Helper (Dynamic Account ID) ───────────────────────────────────────────

async function cw<T>(accountId: number, path: string, options: RequestInit = {}, retry = true): Promise<T> {
  const headers = await getSessionHeaders()
  const url     = `${BASE_URL}/api/v1/accounts/${accountId}${path}`

  const res = await fetch(url, {
    ...options,
    headers: { ...headers, ...(options.headers || {}) },
    cache: 'no-store',
  })

  // On 401, clear cache and retry once with a fresh session
  if (res.status === 401 && retry) {
    sessionHeaders = null
    return cw<T>(accountId, path, options, false)
  }

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Chatwoot API ${res.status}: ${text}`)
  }

  return res.json() as Promise<T>
}

// ─── Provisioning (Admin Actions - Global) ─────────────────────────────────────

export async function createChatwootAccount(name: string): Promise<{ id: number; name: string }> {
  const headers = await getSessionHeaders()
  
  // Note: Global endpoint, doesn't use the `cw` wrapper
  const res = await fetch(`${BASE_URL}/api/v1/accounts`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new Error(`Failed to create Chatwoot account: ${await res.text()}`)
  }

  return res.json()
}

export async function inviteChatwootUser(accountId: number, name: string, email: string) {
  const headers = await getSessionHeaders()
  
  const res = await fetch(`${BASE_URL}/api/v1/accounts/${accountId}/account_users`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, role: 'administrator' }),
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new Error(`Failed to invite Chatwoot user: ${await res.text()}`)
  }

  return res.json()
}

// ─── Inboxes ───────────────────────────────────────────────────────────────────

export async function getInboxes(accountId: number): Promise<CWInboxesResponse> {
  return cw<CWInboxesResponse>(accountId, '/inboxes')
}

// ─── Conversations ──────────────────────────────────────────────────────────────

export async function getConversations(accountId: number, params?: {
  status?: ConversationStatus
  page?: number
}): Promise<CWConversationListResponse> {
  const status = params?.status || 'open'
  const page   = params?.page   || 1
  return cw<CWConversationListResponse>(accountId, `/conversations?status=${status}&page=${page}`)
}

// ─── Messages ──────────────────────────────────────────────────────────────────

export async function getMessages(accountId: number, conversationId: number): Promise<CWMessagesResponse> {
  return cw<CWMessagesResponse>(accountId, `/conversations/${conversationId}/messages`)
}

export async function sendMessage(accountId: number, conversationId: number, content: string): Promise<CWMessage> {
  return cw<CWMessage>(accountId, `/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ content, message_type: 'outgoing', private: false }),
  })
}

// ─── Status ────────────────────────────────────────────────────────────────────

export async function updateConversationStatus(
  accountId: number,
  conversationId: number,
  status: 'open' | 'resolved'
): Promise<CWConversation> {
  return cw<CWConversation>(accountId, `/conversations/${conversationId}/toggle_status`, {
    method: 'POST',
    body: JSON.stringify({ status }),
  })
}