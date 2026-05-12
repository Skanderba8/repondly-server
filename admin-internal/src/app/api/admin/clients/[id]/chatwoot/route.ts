import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

// All Chatwoot calls are server-side — never exposed to the browser

type ChatwootInbox = {
  id: number
  name: string
  channel_type: string // 'Channel::Whatsapp', 'Channel::FacebookPage', etc.
  enabled: boolean
  phone_number?: string
  webhook_url?: string
  created_at: string
}

type ChatwootAgent = {
  id: number
  name: string
  email: string
  role: string
  availability_status: string
}

type ChatwootConversationStats = {
  open: number
  pending: number
  resolved: number
  all: number
}

type ChatwootAccountSummary = {
  connected: boolean
  error: string | null
  accountId: number | null
  apiToken: string | null
  inboxes: ChatwootInbox[]
  agents: ChatwootAgent[]
  conversationStats: ChatwootConversationStats
  totalMessages: number
  accountName: string | null
}

async function chatwootGet(path: string, token: string): Promise<unknown> {
  const base = process.env.CHATWOOT_BASE_URL || 'http://127.0.0.1:3000'
  const res = await fetch(`${base}${path}`, {
    headers: { api_access_token: token },
    cache: 'no-store',
    signal: AbortSignal.timeout(6000),
  })
  if (!res.ok) throw new Error(`Chatwoot ${res.status}: ${path}`)
  return res.json()
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req)
  if (auth instanceof NextResponse) return auth

  const { id } = await params

  // Load the business to get credentials
  const business = await prisma.business.findUnique({
    where: { id },
    select: { chatwootAccountId: true, chatwootApiToken: true },
  })

  if (!business) {
    return NextResponse.json({ error: 'Business not found' }, { status: 404 })
  }

  const { chatwootAccountId, chatwootApiToken } = business

  // If no credentials configured, return empty state
  if (!chatwootAccountId || !chatwootApiToken) {
    const result: ChatwootAccountSummary = {
      connected: false,
      error: 'No Chatwoot credentials configured',
      accountId: chatwootAccountId,
      apiToken: chatwootApiToken,
      inboxes: [],
      agents: [],
      conversationStats: { open: 0, pending: 0, resolved: 0, all: 0 },
      totalMessages: 0,
      accountName: null,
    }
    return NextResponse.json(result)
  }

  const accId = chatwootAccountId

  try {
    // Run all fetches in parallel — each is independently safe
    const [inboxesData, agentsData, convData] = await Promise.allSettled([
      chatwootGet(`/api/v1/accounts/${accId}/inboxes`, chatwootApiToken),
      chatwootGet(`/api/v1/accounts/${accId}/agents`, chatwootApiToken),
      chatwootGet(`/api/v1/accounts/${accId}/conversations?page=1`, chatwootApiToken),
    ])

    // Parse inboxes
    const inboxes: ChatwootInbox[] = inboxesData.status === 'fulfilled'
      ? ((inboxesData.value as { payload: ChatwootInbox[] })?.payload ?? [])
      : []

    // Parse agents
    const agents: ChatwootAgent[] = agentsData.status === 'fulfilled'
      ? ((agentsData.value as ChatwootAgent[]) ?? [])
      : []

    // Parse conversation stats
    let conversationStats: ChatwootConversationStats = { open: 0, pending: 0, resolved: 0, all: 0 }
    let totalMessages = 0
    if (convData.status === 'fulfilled') {
      const convPayload = (convData.value as { data?: { meta?: { all_count?: number; open_count?: number; pending_count?: number; resolved_count?: number } } })
      const meta = convPayload?.data?.meta
      if (meta) {
        conversationStats = {
          all: meta.all_count ?? 0,
          open: meta.open_count ?? 0,
          pending: meta.pending_count ?? 0,
          resolved: meta.resolved_count ?? 0,
        }
        totalMessages = meta.all_count ?? 0
      }
    }

    const result: ChatwootAccountSummary = {
      connected: true,
      error: null,
      accountId: accId,
      apiToken: chatwootApiToken,
      inboxes,
      agents,
      conversationStats,
      totalMessages,
      accountName: null,
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error('[chatwoot-client]', err)
    return NextResponse.json({
      connected: false,
      error: String(err),
      accountId: accId,
      apiToken: chatwootApiToken,
      inboxes: [],
      agents: [],
      conversationStats: { open: 0, pending: 0, resolved: 0, all: 0 },
      totalMessages: 0,
      accountName: null,
    } satisfies ChatwootAccountSummary)
  }
}