type RequestOptions = {
  method?: 'GET' | 'POST' | 'DELETE'
  body?: unknown
  searchParams?: Record<string, string | number | undefined>
}

export type UnipileAccount = {
  id: string
  type: string
  name: string
  connection_status: 'OK' | 'CREDENTIALS' | 'ERROR'
  created_at: string
}

export type UnipileChat = {
  id: string
  account_id: string
  type: string
  name: string | null
  unread_count: number
  last_message_at: string | null
  attendees: Array<{ id: string; name: string | null; provider_id: string }>
}

export type UnipileMessage = {
  id: string
  chat_id: string
  account_id: string
  sender_id: string
  text: string | null
  attachments: Array<{ type: string; url: string }>
  created_at: string
  is_sender: boolean
}

export type UnipileAttendee = {
  id: string
  name: string | null
  provider_id: string
  avatar_url: string | null
}

type HostedAuthLinkParams = {
  type: 'create'
  expiresOn: string
  apiUrl: string
  name: string
  providers: string[]
  successRedirectUrl: string
  failureRedirectUrl: string
}

function getBaseUrl() {
  const baseUrl = process.env.UNIPILE_DSN

  if (!baseUrl) {
    throw new Error('UNIPILE_DSN is required')
  }

  return baseUrl.replace(/\/+$/, '')
}

function getApiKey() {
  const apiKey = process.env.UNIPILE_API_KEY

  if (!apiKey) {
    throw new Error('UNIPILE_API_KEY is required')
  }

  return apiKey
}

function buildUrl(pathname: string, searchParams?: Record<string, string | number | undefined>) {
  const url = new URL(`${getBaseUrl()}${pathname}`)

  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value))
      }
    }
  }

  return url
}

function extractErrorMessage(payload: unknown, statusText: string) {
  if (typeof payload === 'string' && payload.trim()) {
    return payload
  }

  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>

    for (const key of ['message', 'error', 'detail']) {
      const value = record[key]

      if (typeof value === 'string' && value.trim()) {
        return value
      }
    }
  }

  return statusText || 'Unipile request failed'
}

async function request<T>(pathname: string, options: RequestOptions = {}) {
  const response = await fetch(buildUrl(pathname, options.searchParams), {
    method: options.method ?? 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-API-KEY': getApiKey(),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  })

  const text = await response.text()
  let payload: unknown = null

  if (text) {
    try {
      payload = JSON.parse(text) as unknown
    } catch {
      payload = text
    }
  }

  if (!response.ok) {
    throw new Error(extractErrorMessage(payload, response.statusText))
  }

  return payload as T
}

function unwrapList<T>(payload: unknown) {
  if (Array.isArray(payload)) {
    return payload as T[]
  }

  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>

    for (const key of ['items', 'results', 'accounts', 'chats', 'messages']) {
      const value = record[key]

      if (Array.isArray(value)) {
        return value as T[]
      }
    }
  }

  return [] as T[]
}

function unwrapItem<T>(payload: unknown) {
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>

    if (record.object && typeof record.object === 'object') {
      return record.object as T
    }

    if (record.item && typeof record.item === 'object') {
      return record.item as T
    }
  }

  return payload as T
}

export const unipile = {
  async listAccounts() {
    return unwrapList<UnipileAccount>(await request('/accounts'))
  },

  async getAccount(id: string) {
    return unwrapItem<UnipileAccount>(await request(`/accounts/${id}`))
  },

  async deleteAccount(id: string) {
    await request(`/accounts/${id}`, { method: 'DELETE' })
  },

  async createHostedAuthLink(params: HostedAuthLinkParams) {
    return unwrapItem<{ url: string; object: 'HostedAuthLink' }>(
      await request('/hosted/accounts/link', {
        method: 'POST',
        body: params,
      }),
    )
  },

  async listChats(accountId: string, params?: { limit?: number; cursor?: string }) {
    return unwrapList<UnipileChat>(
      await request(`/accounts/${accountId}/chats`, {
        searchParams: {
          limit: params?.limit,
          cursor: params?.cursor,
        },
      }),
    )
  },

  async getChat(accountId: string, chatId: string) {
    return unwrapItem<UnipileChat>(await request(`/accounts/${accountId}/chats/${chatId}`))
  },

  async listMessages(accountId: string, chatId: string, params?: { limit?: number; cursor?: string }) {
    return unwrapList<UnipileMessage>(
      await request(`/accounts/${accountId}/chats/${chatId}/messages`, {
        searchParams: {
          limit: params?.limit,
          cursor: params?.cursor,
        },
      }),
    )
  },

  async sendMessage(accountId: string, chatId: string, text: string) {
    return unwrapItem<UnipileMessage>(
      await request(`/accounts/${accountId}/chats/${chatId}/messages`, {
        method: 'POST',
        body: { text },
      }),
    )
  },

  async sendMedia(accountId: string, chatId: string, mediaUrl: string, caption?: string) {
    return unwrapItem<UnipileMessage>(
      await request(`/accounts/${accountId}/chats/${chatId}/messages`, {
        method: 'POST',
        body: {
          media_url: mediaUrl,
          caption,
        },
      }),
    )
  },

  async getAttendee(accountId: string, attendeeId: string) {
    return unwrapItem<UnipileAttendee>(await request(`/accounts/${accountId}/attendees/${attendeeId}`))
  },
}
