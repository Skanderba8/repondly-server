import { NextRequest, NextResponse } from 'next/server'
import { getInboxes } from '@/lib/chatwoot'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate the user
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Get BOTH their specific Chatwoot Account ID and API Token
    const business = await prisma.business.findUnique({
      where: { email: session.user.email },
      select: { 
        chatwootAccountId: true,
        chatwootApiToken: true // <-- ADDED THIS
      }
    })

    if (!business?.chatwootAccountId || !business?.chatwootApiToken) {
      return NextResponse.json({ error: 'No Chatwoot account linked' }, { status: 400 })
    }

    // 3. Fetch inboxes using BOTH the dynamic Account ID and Token!
    const inboxesRes = await getInboxes(
      business.chatwootAccountId,
      business.chatwootApiToken // <-- ADDED THIS
    )
    const inboxes = inboxesRes.payload

    // 4. Look for the WhatsApp inbox (or just let it safely return false if you don't use it anymore)
    const waInbox = inboxes.find((i: any) => i.channel_type.toLowerCase() === 'channel::whatsapp')

    if (waInbox) {
      return NextResponse.json({
        whatsappConnected: true,
        phoneNumber: waInbox.phone_number
      })
    }

    return NextResponse.json({ whatsappConnected: false })
  } catch (err: any) {
    console.error('[whatsapp/status]', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}