import { NextResponse } from 'next/server'
import { requireBusinessApiSession } from '@/lib/auth'
import { buildPlanLimitError, getEffectiveLimits, getEffectivePlan } from '@/lib/plans'
import { ensureBusinessSubscriptionState } from '@/lib/subscription'
import { prisma } from '@/lib/prisma'
import { unipile } from '@/lib/unipile/client'

type ChannelKey = 'WHATSAPP' | 'INSTAGRAM'

type ConnectBody = {
  channel?: ChannelKey
}

function isSupportedChannel(channel?: string): channel is ChannelKey {
  return channel === 'WHATSAPP' || channel === 'INSTAGRAM'
}

export async function POST(request: Request) {
  const { response, session } = await requireBusinessApiSession()

  if (response || !session) {
    return response
  }

  const body = await request.json() as ConnectBody

  if (!isSupportedChannel(body.channel)) {
    return NextResponse.json({ success: false, error: 'Canal invalide.' }, { status: 400 })
  }

  const business = await ensureBusinessSubscriptionState(session.user.id)

  if (!business) {
    return NextResponse.json({ success: false, error: 'Entreprise introuvable.' }, { status: 404 })
  }

  const blockedStatuses = ['TRIAL_EXPIRED', 'PAST_DUE', 'SUSPENDED', 'CANCELLED']

  if (blockedStatuses.includes(business.planStatus)) {
    return NextResponse.json(
      {
        success: false,
        error: 'Votre abonnement ne permet pas de connecter un nouveau canal pour le moment.',
        code: 'PLAN_ACCESS_BLOCKED',
        limitType: 'channels',
      },
      { status: 403 },
    )
  }

  const activeChannels = await prisma.businessChannelConnection.count({
    where: {
      businessId: session.user.id,
      status: { in: ['PENDING', 'ACTIVE'] },
    },
  })
  const currentPlan = getEffectivePlan(business)
  const limits = getEffectiveLimits(business)

  if (activeChannels >= limits.channels) {
    return NextResponse.json(
      buildPlanLimitError({
        code: 'PLAN_CHANNEL_LIMIT_REACHED',
        message: 'Votre plan actuel ne permet pas d ajouter plus de canaux.',
        limitType: 'channels',
        currentLimit: limits.channels,
        currentUsage: activeChannels,
        currentPlan,
      }),
      { status: 403 },
    )
  }

  const webhookUrl = process.env.UNIPILE_WEBHOOK_URL
  const appUrl = process.env.APP_URL

  if (!webhookUrl || !appUrl) {
    return NextResponse.json({ success: false, error: 'Configuration Unipile incomplète.' }, { status: 500 })
  }

  try {
    const result = await unipile.createHostedAuthLink({
      type: 'create',
      expiresOn: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      apiUrl: webhookUrl,
      name: `${session.user.id}__${body.channel}`,
      providers: [body.channel],
      successRedirectUrl: `${appUrl}/settings?connect=success&channel=${body.channel.toLowerCase()}`,
      failureRedirectUrl: `${appUrl}/settings?connect=error`,
    })

    return NextResponse.json({ success: true, data: { url: result.url } })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Connexion Unipile impossible.' },
      { status: 502 },
    )
  }
}
