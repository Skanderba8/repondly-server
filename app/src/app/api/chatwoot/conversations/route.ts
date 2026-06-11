import { NextRequest, NextResponse } from 'next/server'
import { getConversations, deleteConversation } from '@/lib/chatwoot'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { withTiming } from '@/lib/timing'

export const GET = withTiming(async (request: NextRequest) => {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const business = await prisma.business.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        chatwootAccountId: true,
        chatwootApiToken: true,
      },
    })

    if (!business?.chatwootAccountId || !business?.chatwootApiToken) {
      return NextResponse.json({ error: 'Chatwoot not connected for this business.' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = (searchParams.get('status') || 'open') as any
    const page = parseInt(searchParams.get('page') || '1')

    const data = await getConversations(
      business.chatwootAccountId,
      business.chatwootApiToken,
      { status, page }
    )

    const list: any[] = data.data?.payload || []

    // Fetch all conversation logs for this business in one query
    const logs = await prisma.conversationLog.findMany({
      where: { businessId: business.id },
      select: {
        chatwootConversationId: true,
        status: true,
        botEnabled: true,
      },
    })

    const logMap = new Map<number, { status: string; botEnabled: boolean }>()
    for (const log of logs) {
      logMap.set(log.chatwootConversationId, {
        status: log.status ?? '',
        botEnabled: log.botEnabled,
      })
    }

    // Enrich conversations with Repondly metadata
    const enriched = list.map((conv) => {
      const log = logMap.get(conv.id)
      const needsHuman = log
        ? log.status === 'HANDED_OVER' || log.botEnabled === false
        : false
      const botActive = log ? log.status === 'ACTIVE' && log.botEnabled === true : true
      const isArchived = log ? log.status === 'RESOLVED' : conv.status === 'resolved'

      return {
        ...conv,
        needsHuman,
        botActive,
        isArchived,
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        meta: data.data?.meta,
        payload: enriched,
      },
    })
  } catch (err: any) {
    console.error('[chatwoot/conversations]', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
})

export const DELETE = withTiming(async (request: NextRequest) => {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const business = await prisma.business.findUnique({
      where: { email: session.user.email },
      select: {
        chatwootAccountId: true,
        chatwootApiToken: true,
      },
    })

    if (!business?.chatwootAccountId || !business?.chatwootApiToken) {
      return NextResponse.json({ error: 'Chatwoot not connected for this business.' }, { status: 403 })
    }

    const body = await request.json()
    const { conversationId } = body

    if (!conversationId) {
      return NextResponse.json({ error: 'Missing conversationId' }, { status: 400 })
    }

    await deleteConversation(business.chatwootAccountId, business.chatwootApiToken, conversationId)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[chatwoot/conversations DELETE]', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
})
