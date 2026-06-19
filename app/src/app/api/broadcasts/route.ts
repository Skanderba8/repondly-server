import { ChannelType } from '@prisma/client'
import { NextResponse } from 'next/server'
import { requireBusinessApiSession } from '@/lib/auth'
import { buildPlanLimitError, canUseFeature, getEffectiveLimits, getEffectivePlan } from '@/lib/plans'
import { prisma } from '@/lib/prisma'
import { ensureBusinessSubscriptionState, getOrCreateMonthlyUsage, incrementMonthlyUsage } from '@/lib/subscription'

type BroadcastBody = {
  title?: string
  content?: string
  channel?: ChannelType
  scheduledAt?: string
}

function isSupportedChannel(value: unknown): value is ChannelType {
  return typeof value === 'string' && Object.values(ChannelType).includes(value as ChannelType)
}

export async function POST(request: Request) {
  const { response, session } = await requireBusinessApiSession()

  if (response || !session) {
    return response
  }

  const body = await request.json() as BroadcastBody
  const title = body.title?.trim() ?? ''
  const content = body.content?.trim() ?? ''

  if (!title || !content || !isSupportedChannel(body.channel)) {
    return NextResponse.json({ success: false, error: 'Titre, contenu et canal sont obligatoires.' }, { status: 400 })
  }

  const business = await ensureBusinessSubscriptionState(session.user.id)

  if (!business) {
    return NextResponse.json({ success: false, error: 'Entreprise introuvable.' }, { status: 404 })
  }

  const currentPlan = getEffectivePlan(business)
  const limits = getEffectiveLimits(business)
  const usage = await getOrCreateMonthlyUsage(session.user.id)

  if (!canUseFeature(business, 'broadcasts') || usage.broadcasts >= limits.broadcastsPerMonth) {
    return NextResponse.json(
      buildPlanLimitError({
        code: 'PLAN_BROADCAST_LIMIT_REACHED',
        message: 'Vous avez utilise les campagnes promotionnelles incluses dans votre plan ce mois-ci.',
        limitType: 'broadcasts',
        currentLimit: limits.broadcastsPerMonth,
        currentUsage: usage.broadcasts,
        currentPlan,
      }),
      { status: 403 },
    )
  }

  const campaign = await prisma.$transaction(async (tx) => {
    const created = await tx.broadcastCampaign.create({
      data: {
        businessId: session.user.id,
        title,
        content,
        channel: body.channel,
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
      },
    })

    await incrementMonthlyUsage(session.user.id, 'broadcasts', 1, tx)

    return created
  })

  return NextResponse.json({ success: true, data: campaign }, { status: 201 })
}
