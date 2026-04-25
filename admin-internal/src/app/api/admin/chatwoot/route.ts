import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'
import { Pool } from 'pg'

// ─── Types ────────────────────────────────────────────────────────────────────

type ChatwootStats = {
  serviceOnline: boolean
  latency: number | null
  openConversations: number
  pendingConversations: number
  onlineAgents: number
  linkedClients: number
  dbStats: {
    totalConversations: number
    totalContacts: number
    totalMessages: number
  }
}

const OFFLINE_RESPONSE: ChatwootStats = {
  serviceOnline: false,
  latency: null,
  openConversations: 0,
  pendingConversations: 0,
  onlineAgents: 0,
  linkedClients: 0,
  dbStats: {
    totalConversations: 0,
    totalContacts: 0,
    totalMessages: 0,
  },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Check if Chatwoot is reachable and return latency.
 * Returns { online: false, latency: null } on any error or timeout.
 */
async function checkChatwootService(): Promise<{ online: boolean; latency: number | null }> {
  const start = Date.now()
  try {
    const res = await fetch('http://127.0.0.1:3000', {
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    })
    return { online: res.ok || res.status < 500, latency: Date.now() - start }
  } catch {
    return { online: false, latency: null }
  }
}

/**
 * Fetch conversations from Chatwoot API and count open/pending.
 * Returns { open: 0, pending: 0 } on any error.
 */
async function fetchConversationCounts(
  accountId: string,
  apiToken: string
): Promise<{ open: number; pending: number }> {
  try {
    const url = `http://127.0.0.1:3000/api/v1/accounts/${accountId}/conversations`
    const res = await fetch(url, {
      headers: { api_access_token: apiToken },
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return { open: 0, pending: 0 }

    const data = await res.json() as {
      data?: {
        payload?: Array<{ status: string }>
      }
    }

    const conversations: Array<{ status: string }> = data?.data?.payload ?? []
    const open = conversations.filter((c) => c.status === 'open').length
    const pending = conversations.filter((c) => c.status === 'pending').length
    return { open, pending }
  } catch {
    return { open: 0, pending: 0 }
  }
}

/**
 * Fetch agents from Chatwoot API and count those with availability_status === 'online'.
 * Returns 0 on any error.
 */
async function fetchOnlineAgentCount(
  accountId: string,
  apiToken: string
): Promise<number> {
  try {
    const url = `http://127.0.0.1:3000/api/v1/accounts/${accountId}/agents`
    const res = await fetch(url, {
      headers: { api_access_token: apiToken },
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return 0

    const agents = await res.json() as Array<{ availability_status: string }>
    return agents.filter((a) => a.availability_status === 'online').length
  } catch {
    return 0
  }
}

/**
 * Count Business records with a non-null chatwootAccountId via Prisma.
 * Returns 0 on any error.
 */
async function fetchLinkedClientsCount(): Promise<number> {
  try {
    return await prisma.business.count({
      where: { chatwootAccountId: { not: null } },
    })
  } catch {
    return 0
  }
}

/**
 * Connect directly to the Chatwoot PostgreSQL database and count
 * conversations, contacts, and messages.
 * Returns zeros on any error.
 */
async function fetchChatwootDbStats(): Promise<{
  totalConversations: number
  totalContacts: number
  totalMessages: number
}> {
  const connectionString = process.env.DATABASE_URL_CHATWOOT
  if (!connectionString) {
    return { totalConversations: 0, totalContacts: 0, totalMessages: 0 }
  }

  const pool = new Pool({
    connectionString,
    connectionTimeoutMillis: 5000,
    query_timeout: 5000,
    max: 1,
  })

  try {
    const client = await pool.connect()
    try {
      const [convResult, contactResult, msgResult] = await Promise.all([
        client.query<{ count: string }>('SELECT COUNT(*) FROM conversations'),
        client.query<{ count: string }>('SELECT COUNT(*) FROM contacts'),
        client.query<{ count: string }>('SELECT COUNT(*) FROM messages'),
      ])
      return {
        totalConversations: parseInt(convResult.rows[0].count, 10),
        totalContacts: parseInt(contactResult.rows[0].count, 10),
        totalMessages: parseInt(msgResult.rows[0].count, 10),
      }
    } finally {
      client.release()
    }
  } catch {
    return { totalConversations: 0, totalContacts: 0, totalMessages: 0 }
  } finally {
    await pool.end().catch(() => {})
  }
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  // 1. Authentication check
  const authResult = await requireAdmin(request)
  if (authResult instanceof NextResponse) return authResult

  // 2. Business logic
  try {
    const accountId = process.env.CHATWOOT_ACCOUNT_ID
    const apiToken = process.env.CHATWOOT_API_TOKEN

    // Check if Chatwoot service is reachable
    const { online: serviceOnline, latency } = await checkChatwootService()

    if (!serviceOnline) {
      return NextResponse.json(OFFLINE_RESPONSE)
    }

    if (!accountId || !apiToken) {
      console.error('[/api/admin/chatwoot] Missing CHATWOOT_ACCOUNT_ID or CHATWOOT_API_TOKEN env vars')
      return NextResponse.json(OFFLINE_RESPONSE)
    }

    // Run all data fetches in parallel — each never throws
    const [
      { open: openConversations, pending: pendingConversations },
      onlineAgents,
      linkedClients,
      dbStats,
    ] = await Promise.all([
      fetchConversationCounts(accountId, apiToken),
      fetchOnlineAgentCount(accountId, apiToken),
      fetchLinkedClientsCount(),
      fetchChatwootDbStats(),
    ])

    const stats: ChatwootStats = {
      serviceOnline: true,
      latency,
      openConversations,
      pendingConversations,
      onlineAgents,
      linkedClients,
      dbStats,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('[/api/admin/chatwoot]', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
