import { NextResponse } from 'next/server'
import { requireBusinessApiSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type ChannelType = 'WHATSAPP' | 'MESSENGER' | 'INSTAGRAM'
type ConnectionStatus = 'PENDING' | 'ACTIVE'

const ChannelType = {
  WHATSAPP: 'WHATSAPP',
  MESSENGER: 'MESSENGER',
  INSTAGRAM: 'INSTAGRAM',
} as const satisfies Record<ChannelType, ChannelType>

const ConnectionStatus = {
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
} as const satisfies Record<ConnectionStatus, ConnectionStatus>

type ChannelConnectionBody = {
  channel?: ChannelType
  label?: string
  metaAppId?: string
  metaUserId?: string
  metaBusinessAccountId?: string
  metaBusinessName?: string
  metaPhoneNumberId?: string
  metaPhoneNumber?: string
  metaPageId?: string
  metaPageName?: string
  metaInstagramAccountId?: string
  metaInstagramUsername?: string
  accessToken?: string
  webhookVerifyToken?: string
}

function normalizeOptional(value?: string) {
  const normalized = value?.trim() ?? ''
  return normalized || null
}

function isSupportedChannel(channel?: string): channel is ChannelType {
  return channel === ChannelType.WHATSAPP || channel === ChannelType.MESSENGER || channel === ChannelType.INSTAGRAM
}

function getStatus(body: ChannelConnectionBody) {
  if (body.channel === ChannelType.WHATSAPP && body.metaPhoneNumberId?.trim()) {
    return ConnectionStatus.ACTIVE
  }

  if (body.channel === ChannelType.MESSENGER && body.metaPageId?.trim()) {
    return ConnectionStatus.ACTIVE
  }

  if (body.channel === ChannelType.INSTAGRAM && body.metaInstagramAccountId?.trim()) {
    return ConnectionStatus.ACTIVE
  }

  return ConnectionStatus.PENDING
}

export async function POST(request: Request) {
  const { response, session } = await requireBusinessApiSession()

  if (response || !session) {
    return response
  }

  const body = (await request.json()) as ChannelConnectionBody

  if (!isSupportedChannel(body.channel)) {
    return NextResponse.json({ success: false, error: 'Canal invalide.' }, { status: 400 })
  }

  const data = {
    label: normalizeOptional(body.label),
    metaAppId: normalizeOptional(body.metaAppId),
    metaUserId: normalizeOptional(body.metaUserId),
    metaBusinessAccountId: normalizeOptional(body.metaBusinessAccountId),
    metaBusinessName: normalizeOptional(body.metaBusinessName),
    metaPhoneNumberId: normalizeOptional(body.metaPhoneNumberId),
    metaPhoneNumber: normalizeOptional(body.metaPhoneNumber),
    metaPageId: normalizeOptional(body.metaPageId),
    metaPageName: normalizeOptional(body.metaPageName),
    metaInstagramAccountId: normalizeOptional(body.metaInstagramAccountId),
    metaInstagramUsername: normalizeOptional(body.metaInstagramUsername),
    accessToken: normalizeOptional(body.accessToken),
    webhookVerifyToken: normalizeOptional(body.webhookVerifyToken),
    status: getStatus(body),
  }

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
        data,
        select: {
          id: true,
          channel: true,
          status: true,
          label: true,
          metaPhoneNumberId: true,
          metaPhoneNumber: true,
          metaPageId: true,
          metaPageName: true,
          metaInstagramAccountId: true,
          metaInstagramUsername: true,
        },
      })
    : await prisma.businessChannelConnection.create({
        data: {
          businessId: session.user.id,
          channel: body.channel,
          ...data,
        },
        select: {
          id: true,
          channel: true,
          status: true,
          label: true,
          metaPhoneNumberId: true,
          metaPhoneNumber: true,
          metaPageId: true,
          metaPageName: true,
          metaInstagramAccountId: true,
          metaInstagramUsername: true,
        },
      })

  if (body.channel === ChannelType.WHATSAPP) {
    await prisma.business.update({
      where: { id: session.user.id },
      data: {
        waPhoneNumberId: data.metaPhoneNumberId,
        wabaId: data.metaBusinessAccountId,
        waAccessToken: data.accessToken,
        waVerifyToken: data.webhookVerifyToken,
      },
    })
  }

  return NextResponse.json({ success: true, data: connection })
}
