import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const CHATWOOT_API_URL = process.env.CHATWOOT_API_URL!
const CHATWOOT_SUPERADMIN_TOKEN = process.env.CHATWOOT_SUPERADMIN_TOKEN!
const META_APP_ID = process.env.META_APP_ID!
const META_APP_SECRET = process.env.META_APP_SECRET!
const CHATWOOT_ACCOUNT_ID = 1

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.redirect(new URL('https://app.repondly.com/auth/signin'))
  }

  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(new URL('https://app.repondly.com/dashboard?error=no_code'))
  }

  try {
    // Exchange code — no redirect_uri when using JS SDK
    const tokenRes = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?` +
      `client_id=${META_APP_ID}&client_secret=${META_APP_SECRET}&code=${code}`
    )
    const tokenData = await tokenRes.json()

    console.log('Token response:', JSON.stringify(tokenData))

    if (!tokenData.access_token) {
      console.error('Token exchange failed:', tokenData)
      return NextResponse.redirect(new URL('https://app.repondly.com/dashboard?error=token_failed'))
    }

    const userToken = tokenData.access_token

    // Get WhatsApp Business Accounts
    const whatsappRes = await fetch(
      `https://graph.facebook.com/v21.0/me/whatsapp_business_accounts?access_token=${userToken}`
    )
    const whatsappData = await whatsappRes.json()
    console.log('WABA response:', JSON.stringify(whatsappData))

    const waba = whatsappData?.data?.[0]
    if (!waba) {
      return NextResponse.redirect(new URL('https://app.repondly.com/dashboard?error=no_waba'))
    }

    const wabaId = waba.id

    // Get phone numbers
    const phoneRes = await fetch(
      `https://graph.facebook.com/v21.0/${wabaId}/phone_numbers?access_token=${userToken}`
    )
    const phoneData = await phoneRes.json()
    console.log('Phone response:', JSON.stringify(phoneData))
    const phone = phoneData?.data?.[0]

    if (!phone) {
      return NextResponse.redirect(new URL('https://app.repondly.com/dashboard?error=no_phone'))
    }

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
    console.log('Inbox response:', JSON.stringify(inboxData))

    if (!inboxData.id) {
      return NextResponse.redirect(new URL('https://app.repondly.com/dashboard?error=inbox_failed'))
    }

    // Update DB
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

    return NextResponse.redirect(new URL('https://app.repondly.com/dashboard?success=whatsapp_connected'))
  } catch (err) {
    console.error('Meta callback error:', err)
    return NextResponse.redirect(new URL('https://app.repondly.com/dashboard?error=unknown'))
  }
}
