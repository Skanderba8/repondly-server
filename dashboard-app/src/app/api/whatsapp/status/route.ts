// src/app/api/whatsapp/status/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getInboxes } from '@/lib/chatwoot'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    console.log('--- FETCHING INBOXES FROM CHATWOOT ---')
    // 1. Fetch live inboxes from Chatwoot
    const inboxesRes = await getInboxes()
    
    // LOG WHAT CHATWOOT ACTUALLY RETURNS
    console.log('CHATWOOT PAYLOAD:', JSON.stringify(inboxesRes.payload, null, 2))

    // 2. Check if a WhatsApp channel exists
    // Note: I added toLowerCase() to make this check bulletproof against casing issues
    const waInbox = inboxesRes.payload.find(i => 
      i.channel_type.toLowerCase() === 'channel::whatsapp'
    )
    
    const isConnected = !!waInbox
    const phoneNumber = waInbox?.phone_number || null

    console.log('IS CONNECTED?', isConnected, 'PHONE:', phoneNumber)

    // 3. Keep Prisma synced
    const business = await prisma.business.update({
      where: { email: session.user.email },
      data: {
        whatsappConnected: isConnected,
        ...(waInbox ? { whatsappInboxId: waInbox.id } : {})
      },
      select: {
        whatsappConnected: true,
        whatsappPhoneNumberId: true,
        wabaId: true,
        whatsappInboxId: true,
      },
    })

    return NextResponse.json({
      ...business,
      whatsappConnected: isConnected,
      phoneNumber: phoneNumber
    })

  } catch (error) {
    // IF IT FAILS, THIS WILL TELL US WHY
    console.error('[WhatsApp Status API] CRITICAL ERROR:', error)

    const business = await prisma.business.findUnique({
      where: { email: session.user.email },
      select: { whatsappConnected: true }
    })
    return NextResponse.json(business ?? { whatsappConnected: false })
  }
}