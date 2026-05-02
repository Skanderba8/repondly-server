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
    const inboxesRes = await getInboxes()
    const inboxes = inboxesRes.payload

    const waInbox = inboxes.find(i => i.channel_type.toLowerCase() === 'channel::whatsapp')
    const fbInbox = inboxes.find(i => i.channel_type.toLowerCase() === 'channel::facebookpage')
    const igInbox = inboxes.find(i => i.channel_type.toLowerCase() === 'channel::instagram')

    const business = await prisma.business.update({
      where: { email: session.user.email },
      data: {
        whatsappConnected: !!waInbox,
        facebookConnected: !!fbInbox,
        instagramConnected: !!igInbox,
        ...(waInbox ? { whatsappInboxId: waInbox.id } : {}),
        ...(fbInbox ? { facebookInboxId: fbInbox.id } : {}),
        ...(igInbox ? { instagramInboxId: igInbox.id } : {}),
      },
      select: {
        whatsappConnected: true,
        whatsappPhoneNumberId: true,
        facebookConnected: true,
        facebookPageId: true,
        instagramConnected: true,
        instagramAccountId: true,
      },
    })

    return NextResponse.json({
      whatsappConnected: !!waInbox,
      phoneNumber: waInbox?.phone_number || null,
      facebookConnected: !!fbInbox,
      facebookPageName: fbInbox?.name || null,
      instagramConnected: !!igInbox,
      instagramName: igInbox?.name || null,
    })

  } catch (error) {
    console.error('[channel status]', error)
    const business = await prisma.business.findUnique({
      where: { email: session.user.email },
      select: { whatsappConnected: true, facebookConnected: true, instagramConnected: true },
    })
    return NextResponse.json(business ?? { whatsappConnected: false, facebookConnected: false, instagramConnected: false })
  }
}