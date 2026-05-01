// dashboard-app/src/app/api/meta/pages/route.ts
// GET — returns all connected FB/IG pages for the logged-in business

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const business = await prisma.business.findUnique({
    where: { email: session.user.email },
    include: {
      connectedPages: {
        where: { active: true },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!business) {
    return NextResponse.json({ error: 'Business not found' }, { status: 404 });
  }

  return NextResponse.json({
    pages: business.connectedPages,
    channels: business.channels,
  });
}

// DELETE — disconnect a page (deactivate in DB, optionally delete Chatwoot inbox)
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const pageId = searchParams.get('pageId');
  const channel = searchParams.get('channel'); // FACEBOOK or INSTAGRAM

  if (!pageId || !channel) {
    return NextResponse.json({ error: 'Missing pageId or channel' }, { status: 400 });
  }

  const business = await prisma.business.findUnique({
    where: { email: session.user.email },
  });

  if (!business) {
    return NextResponse.json({ error: 'Business not found' }, { status: 404 });
  }

  await prisma.connectedPage.updateMany({
    where: {
      businessId: business.id,
      pageId,
      channel: channel as any,
    },
    data: { active: false },
  });

  await prisma.activityLog.create({
    data: {
      businessId: business.id,
      action: 'META_PAGE_DISCONNECTED',
      metadata: { pageId, channel },
    },
  });

  return NextResponse.json({ success: true });
}