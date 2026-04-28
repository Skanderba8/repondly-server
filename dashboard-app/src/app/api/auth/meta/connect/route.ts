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

  const body = await req.json()

  let wabaId: string
  let phoneNumberId: string

  if (body.code) {
    // exchange code for token
    const tokenRes = await fetch(
  `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${process.env.META_APP_ID}&client_secret=${process.env.META_APP_SECRET}&code=${body.code}&redirect_uri=`
)
    const tokenData = await tokenRes.json()
    console.log('Token exchange:', JSON.stringify(tokenData))

    if (tokenData.error) {
      return NextResponse.json({ error: 'Token exchange failed: ' + JSON.stringify(tokenData.error) }, { status: 400 })
    }

    const userToken = tokenData.access_token

    // get WABA from user token
    const bizRes = await fetch(
      `https://graph.facebook.com/v21.0/me/businesses?fields=whatsapp_business_accounts{id,name}&access_token=${userToken}`
    )
    const bizData = await bizRes.json()
    console.log('Businesses:', JSON.stringify(bizData))

    const waba = bizData?.data?.[0]?.whatsapp_business_accounts?.data?.[0]
    if (!waba) {
      return NextResponse.json({ error: 'No WABA found' }, { status: 400 })
    }
    wabaId = waba.id

    // get phone number
    const phoneRes2 = await fetch(
      `https://graph.facebook.com/v21.0/${wabaId}/phone_numbers?access_token=${userToken}`
    )
    const phoneData2 = await phoneRes2.json()
    console.log('Phones:', JSON.stringify(phoneData2))

    const phone = phoneData2?.data?.[0]
    if (!phone) {
      return NextResponse.json({ error: 'No phone number found' }, { status: 400 })
    }
    phoneNumberId = phone.id

  } else if (body.wabaId && body.phoneNumberId) {
    wabaId = body.wabaId
    phoneNumberId = body.phoneNumberId
  } else {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // rest of your existing code — get display number, create inbox, save to DB
  const phoneRes = await fetch(
    `https://graph.facebook.com/v21.0/${phoneNumberId}?fields=display_phone_number&access_token=${process.env.META_SYSTEM_USER_TOKEN}`
  )
  const phoneData = await phoneRes.json()
  if (phoneData.error) {
    return NextResponse.json({ error: 'Failed to get phone number' }, { status: 400 })
  }
  const phoneNumber = phoneData.display_phone_number

  // create Chatwoot inbox
  const inboxRes = await fetch(
    `${process.env.CHATWOOT_API_URL}/api/v1/accounts/${5}/inboxes`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api_access_token': process.env.CHATWOOT_SUPERADMIN_TOKEN!,
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