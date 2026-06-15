import { NextResponse } from 'next/server'
import { requireBusinessApiSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const { response, session } = await requireBusinessApiSession()

  if (response || !session) {
    return response
  }

  const accounts = await prisma.businessChannelConnection.findMany({
    where: {
      businessId: session.user.id,
      channel: {
        in: ['WHATSAPP', 'INSTAGRAM'],
      },
    },
    select: {
      channel: true,
      status: true,
      label: true,
      displayName: true,
      unipileAccountId: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  })

  return NextResponse.json({ success: true, data: accounts })
}
