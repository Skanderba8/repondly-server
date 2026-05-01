import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const CHATWOOT_API_URL = process.env.CHATWOOT_API_URL || "";
const CHATWOOT_SUPERADMIN_TOKEN = process.env.CHATWOOT_SUPERADMIN_TOKEN || "";
const CHATWOOT_ACCOUNT_ID = 5;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const userEmail = session.user.email;

  const business = await prisma.business.findUnique({
    where: { email: userEmail }
  });

  if (!business) {
    return NextResponse.json({ error: 'Business not found' }, { status: 404 });
  }

  // ==========================================
  // BRANCH 1: FACEBOOK & INSTAGRAM CONNECTION
  // ==========================================
  if (body.fbAccessToken) {
    console.log('Processing Facebook/Instagram Connection...');

    const fbToken = body.fbAccessToken;
    const pagesUrl = "https://graph.facebook.com/v21.0/me/accounts?access_token=" + fbToken;
    const pagesRes = await fetch(pagesUrl);
    const pagesData: any = await pagesRes.json();

    if (!pagesData.data || pagesData.data.length === 0) {
      return NextResponse.json({ error: 'No Facebook Pages found.' }, { status: 400 });
    }

    for (const page of pagesData.data) {
      const pageId = page.id;
      const pageToken = page.access_token;
      const pageName = page.name;

      // Create Facebook Messenger Inbox
      await fetch(CHATWOOT_API_URL + "/api/v1/accounts/" + CHATWOOT_ACCOUNT_ID + "/inboxes", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api_access_token': CHATWOOT_SUPERADMIN_TOKEN,
        },
        body: JSON.stringify({
          name: "FB - " + pageName,
          channel: {
            type: 'facebook',
            page_id: pageId,
            user_access_token: fbToken,
            page_access_token: pageToken
          }
        })
      });

      // Check if an Instagram Business Account is linked to this page
      const igUrl = "https://graph.facebook.com/v21.0/" + pageId + "?fields=instagram_business_account&access_token=" + pageToken;
      const igRes = await fetch(igUrl);
      const igData: any = await igRes.json();

      if (igData && igData.instagram_business_account) {
        // Create Instagram Inbox
        await fetch(CHATWOOT_API_URL + "/api/v1/accounts/" + CHATWOOT_ACCOUNT_ID + "/inboxes", {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api_access_token': CHATWOOT_SUPERADMIN_TOKEN,
          },
          body: JSON.stringify({
            name: "IG - " + pageName,
            channel: {
              type: 'instagram',
              page_id: pageId,
              user_access_token: fbToken,
              page_access_token: pageToken
            }
          })
        });
      }
    }

    // Update Database
    await prisma.business.update({
      where: { email: userEmail },
      data: {
        channels: { push: ['FACEBOOK', 'INSTAGRAM'] },
      },
    });

    await prisma.activityLog.create({
      data: {
        businessId: business.id,
        action: 'META_PAGES_CONNECTED',
        metadata: { pagesConnected: pagesData.data.length },
      },
    });

    return NextResponse.json({ success: true });
  }

  // ==========================================
  // BRANCH 2: WHATSAPP EMBEDDED SIGNUP 
  // ==========================================
  let wabaId: string = "";
  let phoneNumberId: string = "";

  if (body.code) {
    const clientId = process.env.META_APP_ID || "";
    const clientSecret = process.env.META_APP_SECRET || "";
    const tokenUrl = "https://graph.facebook.com/v21.0/oauth/access_token?client_id=" + clientId + "&client_secret=" + clientSecret + "&code=" + body.code + "&redirect_uri=";

    const tokenRes = await fetch(tokenUrl);
    const tokenData: any = await tokenRes.json();

    if (tokenData.error) {
      return NextResponse.json({ error: 'Token exchange failed' }, { status: 400 });
    }
    
    const userToken = tokenData.access_token;
    
    // URL Encoded the brackets to prevent VS Code parser crashes
    const bizUrl = "https://graph.facebook.com/v21.0/me/businesses?fields=whatsapp_business_accounts%7Bid,name%7D&access_token=" + userToken;
    const bizRes = await fetch(bizUrl);
    const bizData: any = await bizRes.json();
    
    const waba = bizData && bizData.data && bizData.data && bizData.data.whatsapp_business_accounts && bizData.data.whatsapp_business_accounts.data && bizData.data.whatsapp_business_accounts.data;
    
    if (!waba) {
      return NextResponse.json({ error: 'No WABA found' }, { status: 400 });
    }
    wabaId = waba.id;

    const phonesUrl = "https://graph.facebook.com/v21.0/" + wabaId + "/phone_numbers?access_token=" + userToken;
    const phonesRes = await fetch(phonesUrl);
    const phonesData: any = await phonesRes.json();
    const phoneObj = phonesData && phonesData.data && phonesData.data;
    
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

  // Create WhatsApp Inbox
  const sysToken = process.env.META_SYSTEM_USER_TOKEN || "";
  const getPhoneUrl = "https://graph.facebook.com/v21.0/" + phoneNumberId + "?fields=display_phone_number&access_token=" + sysToken;
  
  const phoneInfoRes = await fetch(getPhoneUrl);
  const phoneInfoData: any = await phoneInfoRes.json();
  const phoneNumber = phoneInfoData.display_phone_number || phoneNumberId;

  const createInboxUrl = CHATWOOT_API_URL + "/api/v1/accounts/" + CHATWOOT_ACCOUNT_ID + "/inboxes";
  const inboxRes = await fetch(createInboxUrl, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json', 
      'api_access_token': CHATWOOT_SUPERADMIN_TOKEN 
    },
    body: JSON.stringify({
      channel: {
        type: 'whatsapp',
        phone_number: phoneNumber,
        provider: 'whatsapp_cloud',
        provider_config: { 
          api_key: sysToken, 
          phone_number_id: phoneNumberId, 
          business_account_id: wabaId 
        },
      },
      name: "WhatsApp - " + phoneNumber,
    }),
  });

  const inboxData: any = await inboxRes.json();
  
  if (!inboxData || !inboxData.id) {
    return NextResponse.json({ error: 'Inbox creation failed' }, { status: 400 });
  }

  await prisma.business.update({
    where: { email: userEmail },
    data: {
      wabaId: wabaId,
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
      metadata: { wabaId: wabaId, phoneNumberId: phoneNumberId, phoneNumber: phoneNumber, inboxId: inboxData.id } 
    },
  });

  return NextResponse.json({ success: true });
}