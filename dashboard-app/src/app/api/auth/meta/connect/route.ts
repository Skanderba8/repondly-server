import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const CHATWOOT_API_URL = process.env.CHATWOOT_API_URL!
const CHATWOOT_SUPERADMIN_TOKEN = process.env.CHATWOOT_SUPERADMIN_TOKEN!
const CHATWOOT_ACCOUNT_ID = 1

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { accessToken } = await req.json()
  if (!accessToken) return NextResponse.json({ error: 'No token' }, { status: 400 })

  // Get WABA directly with the user token
  const whatsappRes = await fetch(
    `https://graph.facebook.com/v21.0/me/whatsapp_business_accounts?access_token=${accessToken}`
  )
  const whatsappData = await whatsappRes.json()
  console.log('WABA:', JSON.stringify(whatsappData))

  const waba = whatsappData?.data?.[0]
  if (!waba) return NextResponse.json({ error: 'No WABA found: ' + JSON.stringify(whatsappData) }, { status: 400 })

  const wabaId = waba.id

  // Get phone number
  const phoneRes = await fetch(
    `https://graph.facebook.com/v21.0/${wabaId}/phone_numbers?access_token=${accessToken}`
  )
  const phoneData = await phoneRes.json()
  console.log('Phone:', JSON.stringify(phoneData))
  const phone = phoneData?.data?.[0]
  if (!phone) return NextResponse.json({ error: 'No phone: ' + JSON.stringify(phoneData) }, { status: 400 })

  const phoneNumberId = phone.id
  const phoneNumber = phone.display_phone_number

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
    return NextResponse.json({ error: 'Inbox failed: ' + JSON.stringify(inboxData) }, { status: 400 })
  }

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
