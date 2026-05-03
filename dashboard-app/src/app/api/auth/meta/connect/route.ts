import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Always talk to Chatwoot directly — never through Nginx
const CHATWOOT_BASE_URL = process.env.CHATWOOT_BASE_URL || 'http://127.0.0.1:3000';
const CHATWOOT_ADMIN_TOKEN = process.env.CHATWOOT_ADMIN_TOKEN || '';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const userEmail = session.user.email;

  const business = await prisma.business.findUnique({
    where: { email: userEmail },
  });

  if (!business) {
    return NextResponse.json({ error: 'Business not found' }, { status: 404 });
  }

  if (!business.chatwootAccountId) {
    return NextResponse.json({ error: 'Chatwoot account not provisioned for this business' }, { status: 400 });
  }

  const chatwootAccountId = business.chatwootAccountId;

  // ==========================================
  // BRANCH 1: FACEBOOK & INSTAGRAM CONNECTION
  // ==========================================
  if (body.fbAccessToken) {
    const fbToken: string = body.fbAccessToken;

    // 1. Fetch all Pages the user manages
    const pagesRes = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,access_token&access_token=${fbToken}`
    );
    const pagesData = await pagesRes.json();

    if (!pagesData.data || pagesData.data.length === 0) {
      return NextResponse.json({ error: 'No Facebook Pages found for this account.' }, { status: 400 });
    }

    const results: { page: string; fb: boolean; ig: boolean; error?: string }[] = [];

    for (const page of pagesData.data) {
      const pageId: string = page.id;
      const pageToken: string = page.access_token;
      const pageName: string = page.name;
      let fbInboxId: number | null = null;
      let igAccountId: string | null = null;
      let igConnected = false;

      // 2. Check for existing FB connection
      const existingFb = await prisma.connectedPage.findUnique({
        where: { businessId_pageId_channel: { businessId: business.id, pageId, channel: 'FACEBOOK' } },
      });

      // 3. Create Facebook Messenger inbox in Chatwoot
      if (!existingFb) {
        const fbInboxRes = await fetch(
          `${CHATWOOT_BASE_URL}/api/v1/accounts/${chatwootAccountId}/inboxes`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'api_access_token': CHATWOOT_ADMIN_TOKEN,
            },
            body: JSON.stringify({
              name: `FB - ${pageName}`,
              channel: {
                type: 'facebook',
                page_id: pageId,
                user_access_token: fbToken,
                page_access_token: pageToken,
              },
            }),
          }
        );
        const fbInboxData = await fbInboxRes.json();
        console.log('FB inbox creation response:', JSON.stringify(fbInboxData));

        if (fbInboxData?.id) {
          fbInboxId = fbInboxData.id;
          await prisma.connectedPage.create({
            data: {
              businessId: business.id,
              pageId,
              pageName,
              pageToken,
              channel: 'FACEBOOK',
              chatwootInboxId: fbInboxId,
            },
          });
        }
      } else {
        fbInboxId = existingFb.chatwootInboxId;
      }

      // 4. Check if this Page has a linked Instagram Business Account
      const igCheckRes = await fetch(
        `https://graph.facebook.com/v21.0/${pageId}?fields=instagram_business_account&access_token=${pageToken}`
      );
      const igCheckData = await igCheckRes.json();

      if (igCheckData?.instagram_business_account?.id) {
        igAccountId = igCheckData.instagram_business_account.id;

        const existingIg = await prisma.connectedPage.findUnique({
          where: { businessId_pageId_channel: { businessId: business.id, pageId, channel: 'INSTAGRAM' } },
        });

        if (!existingIg && fbInboxId) {
          // Patch the FB inbox with the instagram_id — Chatwoot handles IG DMs via the FB page channel
          const igPatchRes = await fetch(
            `${CHATWOOT_BASE_URL}/api/v1/accounts/${chatwootAccountId}/inboxes/${fbInboxId}`,
            {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                'api_access_token': CHATWOOT_ADMIN_TOKEN,
              },
              body: JSON.stringify({
  channel: {
    instagram_id: igAccountId,
  },
}),
            }
          );
          const igPatchData = await igPatchRes.json();
          console.log('IG patch response:', JSON.stringify(igPatchData));

          await prisma.connectedPage.create({
            data: {
              businessId: business.id,
              pageId,
              pageName,
              pageToken,
              channel: 'INSTAGRAM',
              chatwootInboxId: fbInboxId, // same inbox as FB
              igAccountId,
            },
          });

          igConnected = true;
        } else if (existingIg) {
          igConnected = true;
        }
      }

      results.push({
        page: pageName,
        fb: fbInboxId !== null,
        ig: igConnected,
      });
    }

    // 5. Update channels array on Business
    const currentChannels = business.channels || [];
    const toAdd: string[] = [];
    if (!currentChannels.includes('FACEBOOK')) toAdd.push('FACEBOOK');
    if (!currentChannels.includes('INSTAGRAM')) toAdd.push('INSTAGRAM');

    if (toAdd.length > 0) {
      await prisma.business.update({
        where: { id: business.id },
        data: { channels: { push: toAdd } },
      });
    }

    await prisma.activityLog.create({
      data: {
        businessId: business.id,
        action: 'META_PAGES_CONNECTED',
        metadata: { results },
      },
    });

    return NextResponse.json({ success: true, results });
  }

  // ==========================================
  // BRANCH 2: WHATSAPP EMBEDDED SIGNUP
  // ==========================================
  let wabaId: string = '';
  let phoneNumberId: string = '';

  if (body.code) {
    const clientId = process.env.META_APP_ID || '';
    const clientSecret = process.env.META_APP_SECRET || '';

    const tokenRes = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${clientId}&client_secret=${clientSecret}&code=${body.code}&redirect_uri=`
    );
    const tokenData: any = await tokenRes.json();

    if (tokenData.error) {
      return NextResponse.json({ error: 'Token exchange failed' }, { status: 400 });
    }

    const userToken = tokenData.access_token;
    const bizRes = await fetch(
      `https://graph.facebook.com/v21.0/me/businesses?fields=whatsapp_business_accounts%7Bid,name%7D&access_token=${userToken}`
    );
    const bizData: any = await bizRes.json();
    const waba = bizData?.data?.[0]?.whatsapp_business_accounts?.data?.[0];

    if (!waba) {
      return NextResponse.json({ error: 'No WABA found' }, { status: 400 });
    }
    wabaId = waba.id;

    const phonesRes = await fetch(
      `https://graph.facebook.com/v21.0/${wabaId}/phone_numbers?access_token=${userToken}`
    );
    const phonesData: any = await phonesRes.json();
    const phoneObj = phonesData?.data?.[0];

    if (!phoneObj) {
      return NextResponse.json({ error: 'No phone number found' }, { status: 400 });
    }
    phoneNumberId = phoneObj.id;
  } else if (body.wabaId && body.phoneNumberId) {
    wabaId = body.wabaId;
    phoneNumberId = body.phoneNumberId;
  } else {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const sysToken = process.env.META_SYSTEM_USER_TOKEN || '';
  const phoneInfoRes = await fetch(
    `https://graph.facebook.com/v21.0/${phoneNumberId}?fields=display_phone_number&access_token=${sysToken}`
  );
  const phoneInfoData: any = await phoneInfoRes.json();
  const phoneNumber = phoneInfoData.display_phone_number || phoneNumberId;

  const inboxRes = await fetch(
    `${CHATWOOT_BASE_URL}/api/v1/accounts/${chatwootAccountId}/inboxes`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api_access_token': CHATWOOT_ADMIN_TOKEN,
      },
      body: JSON.stringify({
        channel: {
          type: 'whatsapp',
          phone_number: phoneNumber,
          provider: 'whatsapp_cloud',
          provider_config: {
            api_key: sysToken,
            phone_number_id: phoneNumberId,
            business_account_id: wabaId,
          },
        },
        name: `WhatsApp - ${phoneNumber}`,
      }),
    }
  );

  const inboxData: any = await inboxRes.json();

  if (!inboxData?.id) {
    return NextResponse.json({ error: 'Inbox creation failed' }, { status: 400 });
  }

  await prisma.business.update({
    where: { email: userEmail },
    data: {
      wabaId,
      whatsappPhoneNumberId: phoneNumberId,
      whatsappInboxId: inboxData.id,
      whatsappConnected: true,
      channels: { push: 'WHATSAPP' },
    },
  });

  await prisma.activityLog.create({
    data: {
      businessId: business.id,
      action: 'WHATSAPP_CONNECTED',
      metadata: { wabaId, phoneNumberId, phoneNumber, inboxId: inboxData.id },
    },
  });

  return NextResponse.json({ success: true });
}