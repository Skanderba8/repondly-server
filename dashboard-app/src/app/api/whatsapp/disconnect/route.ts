// src/app/api/whatsapp/status/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const business = await prisma.business.findUnique({
    where: { email: session.user.email },
    select: {
      whatsappConnected: true,
      whatsappPhoneNumberId: true,
      wabaId: true,
      whatsappInboxId: true,
    },
  })

  return NextResponse.json(business ?? { whatsappConnected: false })
}