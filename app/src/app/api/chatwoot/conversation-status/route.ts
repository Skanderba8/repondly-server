import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const business = await prisma.business.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    })

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    const { conversationId, status } = await req.json()
    if (!conversationId || !status) {
      return NextResponse.json({ error: 'conversationId and status required' }, { status: 400 })
    }

    if (status !== 'EN_ATTENTE' && status !== 'RESOLUE') {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const conversationStatus = await prisma.conversationStatus.upsert({
      where: { conversationId },
      update: { status },
      create: {
        businessId: business.id,
        conversationId,
        status,
      },
    })

    return NextResponse.json(conversationStatus)
  } catch (err: any) {
    console.error('[conversation-status]', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const business = await prisma.business.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    })

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    const { searchParams } = new URL(req.url)
    const conversationId = searchParams.get('conversationId')

    if (!conversationId) {
      return NextResponse.json({ error: 'conversationId required' }, { status: 400 })
    }

    const conversationStatus = await prisma.conversationStatus.findUnique({
      where: { conversationId: parseInt(conversationId) },
    })

    return NextResponse.json(conversationStatus)
  } catch (err: any) {
    console.error('[conversation-status GET]', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
