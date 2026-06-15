import { NextResponse } from 'next/server'
import { requireBusinessApiSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type ChannelType = 'WHATSAPP' | 'INSTAGRAM'

type ChannelConnectionBody = {
  channel?: ChannelType
  label?: string
}

function normalizeOptional(value?: string) {
  const normalized = value?.trim() ?? ''
  return normalized || null
}

function isSupportedChannel(channel?: string): channel is ChannelType {
  return channel === 'WHATSAPP' || channel === 'INSTAGRAM'
}

export async function POST(request: Request) {
  const { response, session } = await requireBusinessApiSession()

  if (response || !session) {
    return response
  }

  const body = await request.json() as ChannelConnectionBody

  if (!isSupportedChannel(body.channel)) {
    return NextResponse.json({ success: false, error: 'Canal invalide.' }, { status: 400 })
  }

  const label = normalizeOptional(body.label)
  const existingConnection = await prisma.businessChannelConnection.findFirst({
    where: {
      businessId: session.user.id,
      channel: body.channel,
    },
    select: { id: true },
  })

  const connection = existingConnection
    ? await prisma.businessChannelConnection.update({
        where: { id: existingConnection.id },
        data: { label },
        select: {
          channel: true,
          status: true,
          label: true,
          displayName: true,
          unipileAccountId: true,
          createdAt: true,
        },
      })
    : await prisma.businessChannelConnection.create({
        data: {
          businessId: session.user.id,
          channel: body.channel,
          label,
          status: 'PENDING',
        },
        select: {
          channel: true,
          status: true,
          label: true,
          displayName: true,
          unipileAccountId: true,
          createdAt: true,
        },
      })

  return NextResponse.json({ success: true, data: connection })
}
