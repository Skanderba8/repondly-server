// dashboard-app/src/lib/chatwoot.ts
const BASE_URL = process.env.CHATWOOT_BASE_URL || 'https://inbox.repondly.com'

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

// ─── API Helper (Application Mode) ───────────────────────────────────────────

async function cw<T>(accountId: number, apiToken: string, path: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}/api/v1/accounts/${accountId}${path}`
  
  const res = await fetch(url, {
    ...options,
    headers: { 
      'Content-Type': 'application/json',
      'api_access_token': apiToken, // Uses the client's specific token from the DB
      ...(options.headers || {}) 
    },
    cache: 'no-store',
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Chatwoot API Error ${res.status}: ${text}`)
  }

  return res.json() as Promise<T>
}

// ─── Client Functions ─────────────────────────────────────────────────────────

export async function getInboxes(accountId: number, apiToken: string): Promise<CWInboxesResponse> {
  return cw<CWInboxesResponse>(accountId, apiToken, '/inboxes')
}

export async function getConversations(
  accountId: number, 
  apiToken: string, 
  params?: { status?: ConversationStatus; page?: number }
): Promise<CWConversationListResponse> {
  const status = params?.status || 'open'
  const page = params?.page || 1
  return cw<CWConversationListResponse>(accountId, apiToken, `/conversations?status=${status}&page=${page}`)
}

export async function getMessages(accountId: number, apiToken: string, conversationId: number): Promise<CWMessagesResponse> {
  return cw<CWMessagesResponse>(accountId, apiToken, `/conversations/${conversationId}/messages`)
}

export async function sendMessage(accountId: number, apiToken: string, conversationId: number, content: string): Promise<CWMessage> {
  return cw<CWMessage>(accountId, apiToken, `/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ content, message_type: 'outgoing', private: false }),
  })
}

export async function updateConversationStatus(
  accountId: number,
  apiToken: string,
  conversationId: number,
  status: 'open' | 'resolved'
): Promise<CWConversation> {
  return cw<CWConversation>(accountId, apiToken, `/conversations/${conversationId}/toggle_status`, {
    method: 'POST',
    body: JSON.stringify({ status }),
  })
}