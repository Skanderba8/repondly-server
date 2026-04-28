import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const CHATWOOT_API_URL = process.env.CHATWOOT_API_URL!
const CHATWOOT_SUPERADMIN_TOKEN = process.env.CHATWOOT_SUPERADMIN_TOKEN!
const CHATWOOT_ACCOUNT_ID = 5

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Now we receive wabaId and phoneNumberId directly from the frontend
  // (sent by the Meta message event — no Graph API call needed to find them)
  const { wabaId, phoneNumberId } = await req.json()

  if (!wabaId || !phoneNumberId) {
    return NextResponse.json({ error: 'Missing wabaId or phoneNumberId' }, { status: 400 })
  }

  // Get the phone number display string using your System User Token
  // (this is a permanent token from Meta Business Manager, not the user's OAuth token)
  const phoneRes = await fetch(
    `https://graph.facebook.com/v21.0/${phoneNumberId}?fields=display_phone_number&access_token=${process.env.META_SYSTEM_USER_TOKEN}`
  )
  const phoneData = await phoneRes.json()
  console.log('Phone data:', JSON.stringify(phoneData))

  if (phoneData.error) {
    return NextResponse.json({ error: 'Failed to get phone number: ' + JSON.stringify(phoneData.error) }, { status: 400 })
  }

  const phoneNumber = phoneData.display_phone_number

  // Create Chatwoot inbox
  const inboxRes = await fetch(
    `${CHATWOOT_API_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/inboxes`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api_access_token': CHATWOOT_SUPERADMIN_TOKEN,
      },
      body: JSON.stringify({
        channel: {
          type: 'whatsapp',
          phone_number: phoneNumber,
          provider: 'whatsapp_cloud',
          provider_config: {
            api_key: process.env.META_SYSTEM_USER_TOKEN,
            phone_number_id: phoneNumberId,
            business_account_id: wabaId,
          },
        },
        name: `WhatsApp - ${phoneNumber}`,
      }),
    }
  )

  const inboxData = await inboxRes.json()
  console.log('Inbox:', JSON.stringify(inboxData))

  if (!inboxData.id) {
    return NextResponse.json({ error: 'Inbox creation failed: ' + JSON.stringify(inboxData) }, { status: 400 })
  }

  // Save to DB
  await prisma.business.update({
    where: { email: session.user.email },
    data: {
      wabaId,
      whatsappPhoneNumberId: phoneNumberId,
      whatsappInboxId: inboxData.id,
      whatsappConnected: true,
      channels: { push: 'WHATSAPP' },
    },
  })

  const business = await prisma.business.findUnique({ where: { email: session.user.email } })
  if (business) {
    await prisma.activityLog.create({
      data: {
        businessId: business.id,
        action: 'WHATSAPP_CONNECTED',
        metadata: { wabaId, phoneNumberId, phoneNumber, inboxId: inboxData.id },
      },
    })
  }

  return NextResponse.json({ success: true })
}