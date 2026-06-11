import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const business = await prisma.business.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      chatwootAccountId: true,
    },
  })

  const connectedPages = await prisma.connectedPage.findMany({
    where: { businessId: session.user.id, active: true },
    select: { channel: true, pageName: true },
  })

  return NextResponse.json({
    whatsappConnected: connectedPages.some(p => p.channel === 'whatsapp'),
    connectedPages,
  })
}