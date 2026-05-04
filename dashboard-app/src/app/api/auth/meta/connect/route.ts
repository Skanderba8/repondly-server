import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const CHATWOOT_BASE_URL = process.env.CHATWOOT_BASE_URL || 'http://127.0.0.1:3000'
const CHATWOOT_ADMIN_TOKEN = process.env.CHATWOOT_ADMIN_TOKEN || ''

export async function POST(req: NextRequest) {
  // ── 0. Auth ──────────────────────────────────────────────────────────────────
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const userEmail = session.user.email

  console.log('\n══════════════════════════════════════════')
  console.log('[meta/connect] START — user:', userEmail)
  console.log('[meta/connect] body keys:', Object.keys(body))
  console.log('[meta/connect] CHATWOOT_BASE_URL:', CHATWOOT_BASE_URL)
  console.log('[meta/connect] CHATWOOT_ADMIN_TOKEN set?', !!CHATWOOT_ADMIN_TOKEN, '— length:', CHATWOOT_ADMIN_TOKEN.length)

  // ── 1. Load business ─────────────────────────────────────────────────────────
  const business = await prisma.business.findUnique({
    where: { email: userEmail },
    select: {
      id: true,
      chatwootAccountId: true,
      chatwootApiToken: true,
      channels: true,
    },
  })

  console.log('[meta/connect] business found?', !!business)
  console.log('[meta/connect] chatwootAccountId:', business?.chatwootAccountId)
  console.log('[meta/connect] chatwootApiToken set?', !!business?.chatwootApiToken)

  if (!business) {
    return NextResponse.json({ error: 'Business not found' }, { status: 404 })
  }

  if (!business.chatwootAccountId) {
    console.error('[meta/connect] ❌ No chatwootAccountId on this business — inbox creation will fail')
    return NextResponse.json(
      { error: 'Chatwoot account not provisioned for this business. Ask an admin to run the sync.' },
      { status: 400 }
    )
  }

  const chatwootAccountId = business.chatwootAccountId

  // ── 2. Facebook / Instagram branch ──────────────────────────────────────────
  if (body.fbAccessToken) {
    const fbToken: string = body.fbAccessToken
    console.log('[meta/connect] fbAccessToken length:', fbToken.length)

    // 2a. Fetch Pages
    console.log('[meta/connect] → fetching pages from Graph API…')
    const pagesRes = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,access_token&access_token=${fbToken}`
    )
    const pagesData = await pagesRes.json()
    console.log('[meta/connect] pages response status:', pagesRes.status)
    console.log('[meta/connect] pages data:', JSON.stringify(pagesData))

    if (pagesData.error) {
      console.error('[meta/connect] ❌ Graph API error fetching pages:', pagesData.error)
      return NextResponse.json({ error: `Facebook API error: ${pagesData.error.message}` }, { status: 400 })
    }

    if (!pagesData.data || pagesData.data.length === 0) {
      console.error('[meta/connect] ❌ No pages found for this token')
      return NextResponse.json({ error: 'No Facebook Pages found for this account.' }, { status: 400 })
    }

    console.log('[meta/connect] pages found:', pagesData.data.map((p: any) => `${p.name} (${p.id})`))

    const results: { page: string; fb: boolean; ig: boolean; fbInboxId?: number | null; error?: string }[] = []

    for (const page of pagesData.data) {
      const pageId: string    = page.id
      const pageToken: string = page.access_token
      const pageName: string  = page.name
      let fbInboxId: number | null = null
      let igConnected = false

      console.log(`\n[meta/connect] ── Processing page: "${pageName}" (${pageId})`)

      // 2b. Check existing FB connection in DB
      const existingFb = await prisma.connectedPage.findUnique({
        where: { businessId_pageId_channel: { businessId: business.id, pageId, channel: 'FACEBOOK' } },
      })
      console.log(`[meta/connect]   existing FB record:`, existingFb ? `yes (inboxId=${existingFb.chatwootInboxId})` : 'no')

      // 2c. Create Facebook inbox in Chatwoot
      if (!existingFb) {
        const fbInboxUrl = `${CHATWOOT_BASE_URL}/api/v1/accounts/${chatwootAccountId}/inboxes`
        const fbInboxPayload = {
          name: `FB - ${pageName}`,
          channel: {
            type: 'facebook',
            page_id: pageId,
            user_access_token: fbToken,
            page_access_token: pageToken,
          },
        }

        console.log(`[meta/connect]   → POST ${fbInboxUrl}`)
        console.log(`[meta/connect]   payload:`, JSON.stringify(fbInboxPayload))

        let fbInboxRes: Response
        try {
          fbInboxRes = await fetch(fbInboxUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'api_access_token': CHATWOOT_ADMIN_TOKEN,
            },
            body: JSON.stringify(fbInboxPayload),
          })
        } catch (fetchErr: any) {
          console.error(`[meta/connect]   ❌ Network error reaching Chatwoot:`, fetchErr.message)
          results.push({ page: pageName, fb: false, ig: false, error: `Cannot reach Chatwoot: ${fetchErr.message}` })
          continue
        }

        const fbInboxData = await fbInboxRes.json()
        console.log(`[meta/connect]   Chatwoot FB inbox response status:`, fbInboxRes.status)
        console.log(`[meta/connect]   Chatwoot FB inbox response body:`, JSON.stringify(fbInboxData))

        if (fbInboxData?.id) {
          fbInboxId = fbInboxData.id
          console.log(`[meta/connect]   ✅ FB inbox created — id:`, fbInboxId)

          await prisma.connectedPage.create({
            data: {
              businessId: business.id,
              pageId,
              pageName,
              pageToken,
              channel: 'FACEBOOK',
              chatwootInboxId: fbInboxId,
            },
          })
          console.log(`[meta/connect]   ✅ DB record created for FB page`)
        } else {
          console.error(`[meta/connect]   ❌ Chatwoot did NOT return an inbox id — full response:`, JSON.stringify(fbInboxData))
          results.push({ page: pageName, fb: false, ig: false, error: `Chatwoot inbox creation failed: ${JSON.stringify(fbInboxData)}` })
          continue
        }
      } else {
        fbInboxId = existingFb.chatwootInboxId
        console.log(`[meta/connect]   skipping FB inbox creation (already exists, inboxId=${fbInboxId})`)
      }

      // 2d. Check for linked Instagram Business Account
      console.log(`[meta/connect]   → checking for linked Instagram account on page ${pageId}…`)
      const igCheckRes = await fetch(
        `https://graph.facebook.com/v21.0/${pageId}?fields=instagram_business_account&access_token=${pageToken}`
      )
      const igCheckData = await igCheckRes.json()
      console.log(`[meta/connect]   IG check response:`, JSON.stringify(igCheckData))

      if (igCheckData?.instagram_business_account?.id) {
        const igAccountId = igCheckData.instagram_business_account.id
        console.log(`[meta/connect]   Instagram account found: ${igAccountId}`)

        const existingIg = await prisma.connectedPage.findUnique({
          where: { businessId_pageId_channel: { businessId: business.id, pageId, channel: 'INSTAGRAM' } },
        })
        console.log(`[meta/connect]   existing IG record:`, existingIg ? `yes (inboxId=${existingIg.chatwootInboxId})` : 'no')

        if (!existingIg && fbInboxId) {
          // Patch the FB inbox to also handle Instagram DMs
          const igPatchUrl = `${CHATWOOT_BASE_URL}/api/v1/accounts/${chatwootAccountId}/inboxes/${fbInboxId}`
          const igPatchPayload = { channel: { instagram_id: igAccountId } }

          console.log(`[meta/connect]   → PATCH ${igPatchUrl}`)
          console.log(`[meta/connect]   patch payload:`, JSON.stringify(igPatchPayload))

          const igPatchRes = await fetch(igPatchUrl, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'api_access_token': CHATWOOT_ADMIN_TOKEN,
            },
            body: JSON.stringify(igPatchPayload),
          })
          const igPatchData = await igPatchRes.json()
          console.log(`[meta/connect]   Chatwoot IG patch response status:`, igPatchRes.status)
          console.log(`[meta/connect]   Chatwoot IG patch response body:`, JSON.stringify(igPatchData))

          await prisma.connectedPage.create({
            data: {
              businessId: business.id,
              pageId,
              pageName,
              pageToken,
              channel: 'INSTAGRAM',
              chatwootInboxId: fbInboxId,
              igAccountId,
            },
          })
          igConnected = true
          console.log(`[meta/connect]   ✅ IG inbox patched + DB record created`)
        } else if (existingIg) {
          igConnected = true
          console.log(`[meta/connect]   skipping IG patch (already exists)`)
        }
      } else {
        console.log(`[meta/connect]   no Instagram Business Account linked to this page`)
      }

      results.push({ page: pageName, fb: fbInboxId !== null, ig: igConnected, fbInboxId })
    }

    // 2e. Update channels array
    const currentChannels = business.channels || []
    const toAdd: string[] = []
    if (!currentChannels.includes('FACEBOOK')) toAdd.push('FACEBOOK')
    if (!currentChannels.includes('INSTAGRAM')) toAdd.push('INSTAGRAM')
    if (toAdd.length > 0) {
      await prisma.business.update({
        where: { id: business.id },
        data: { channels: { push: toAdd } },
      })
    }

    await prisma.activityLog.create({
      data: { businessId: business.id, action: 'META_PAGES_CONNECTED', metadata: { results } },
    })

    console.log('\n[meta/connect] FINAL RESULTS:', JSON.stringify(results))
    console.log('══════════════════════════════════════════\n')

    // Surface any Chatwoot errors to the client so you can see them in the UI too
    const hasErrors = results.some(r => r.error)
    if (hasErrors) {
      return NextResponse.json({
        success: false,
        error: results.map(r => r.error).filter(Boolean).join('; '),
        results,
      }, { status: 500 })
    }

    return NextResponse.json({ success: true, results })
  }

  return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
}