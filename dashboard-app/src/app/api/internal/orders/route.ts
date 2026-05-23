import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-internal-secret')
  if (secret !== process.env.INTERNAL_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { businessId, type, clientName, clientPhone, items, notes, total, datetime, chatwootConversationId } = body

  if (!businessId || !type) {
    return NextResponse.json({ error: 'businessId and type are required' }, { status: 400 })
  }

  const order = await prisma.order.create({
    data: {
      businessId,
      type,
      clientName: clientName ?? null,
      clientPhone: clientPhone ?? null,
      items: items ?? null,
      notes: notes ?? null,
      total: total ?? null,
      datetime: datetime ? new Date(datetime) : null,
      chatwootConversationId: chatwootConversationId ?? null,
      status: 'PENDING',
    },
  })

  return NextResponse.json(order, { status: 201 })
}
