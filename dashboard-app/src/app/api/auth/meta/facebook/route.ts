import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { code } = await req.json()
  if (!code) return NextResponse.json({ error: 'Missing code' }, { status: 400 })

  // Exchange code for token
  const tokenRes = await fetch(
    `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${process.env.META_APP_ID}&client_secret=${process.env.META_APP_SECRET}&code=${code}`
  )
  const tokenData = await tokenRes.json()
  if (!tokenData.access_token) {
    return NextResponse.json({ error: 'Token exchange failed' }, { status: 400 })
  }

  // Get pages
  const pagesRes = await fetch(
    `https://graph.facebook.com/v21.0/me/accounts?access_token=${tokenData.access_token}`
  )
  const pagesData = await pagesRes.json()
  const page = pagesData?.data?.[0]
  if (!page) return NextResponse.json({ error: 'No Facebook page found' }, { status: 400 })

  const pageId = page.id
  const pageToken = page.access_token
  const pageName = page.name

  // Create Chatwoot inbox
  const inboxRes = await fetch(
    `${process.env.CHATWOOT_BASE_URL}/api/v1/accounts/${process.env.CHATWOOT_ACCOUNT_ID}/inboxes`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api_access_token': process.env.CHATWOOT_API_TOKEN!,
      },
      body: JSON.stringify({
        channel: {
          type: 'facebook',
          page_access_token: pageToken,
          page_id: pageId,
        },
        name: `Facebook - ${pageName}`,
      }),
    }
  )
  const inboxData = await inboxRes.json()
  if (!inboxData.id) {
    return NextResponse.json({ error: 'Inbox creation failed: ' + JSON.stringify(inboxData) }, { status: 400 })
  }

  await prisma.business.update({
    where: { email: session.user.email },
    data: {
      facebookPageId: pageId,
      facebookPageToken: pageToken,
      facebookInboxId: inboxData.id,
      facebookConnected: true,
      channels: { push: 'FACEBOOK' },
    },
  })

  return NextResponse.json({ success: true })
}