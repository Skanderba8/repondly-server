import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

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

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req)
  if (auth instanceof NextResponse) return auth

  const { id } = await params

  // Load business to get Chatwoot credentials
  const business = await prisma.business.findUnique({
    where: { id },
    select: { chatwootAccountId: true, chatwootApiToken: true },
  })

  if (!business) {
    return NextResponse.json({ error: 'Business not found' }, { status: 404 })
  }

  // Sync Chatwoot inbox status if credentials exist
  if (business.chatwootAccountId && business.chatwootApiToken) {
    try {
      const inboxesData = await chatwootGet(
        `/api/v1/accounts/${business.chatwootAccountId}/inboxes`,
        business.chatwootApiToken
      )
      const inboxes = (inboxesData as { payload?: Array<{ id: number; channel_type: string; enabled: boolean }> })?.payload ?? []

      const whatsappInbox = inboxes.find(i => i.channel_type === 'Channel::Whatsapp')
      const facebookInbox = inboxes.find(i => i.channel_type === 'Channel::FacebookPage')
      const instagramInbox = inboxes.find(i => i.channel_type === 'Channel::Instagram')

      await prisma.business.update({
        where: { id },
        data: {
          whatsappConnected: whatsappInbox?.enabled ?? false,
          whatsappInboxId: whatsappInbox?.id ?? null,
          facebookConnected: facebookInbox?.enabled ?? false,
          facebookInboxId: facebookInbox?.id ?? null,
          instagramConnected: instagramInbox?.enabled ?? false,
          instagramInboxId: instagramInbox?.id ?? null,
        },
      })

      console.log('[sync] Updated channel status for business', id, 'from Chatwoot')
    } catch (err) {
      console.error('[sync] Failed to sync Chatwoot status:', err)
    }
  }

  // Also sync with bot if available
  try {
    const res = await fetch('http://127.0.0.1:3001/admin/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessId: id }),
    })
    const data = await res.json().catch(() => ({}))
    return NextResponse.json({ success: true, synced: true, botData: data }, { status: res.status })
  } catch {
    return NextResponse.json({ success: true, synced: true, botUnavailable: true })
  }
}
