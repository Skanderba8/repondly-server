import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-internal-secret')
  if (secret !== process.env.INTERNAL_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { businessId, eventType, channel, message, ruleMatched, wasHandled } = body

  if (!eventType) return NextResponse.json({ error: 'Bad request' }, { status: 400 })

  const event = await prisma.botEvent.create({
    data: {
      businessId: businessId ?? null,
      eventType,
      channel: channel ?? null,
      message: message ?? null,
      ruleMatched: ruleMatched ?? null,
      wasHandled: wasHandled ?? false,
    },
  })

  return NextResponse.json(event, { status: 201 })
}
