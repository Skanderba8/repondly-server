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

    const { conversationId } = await req.json()
    if (!conversationId) {
      return NextResponse.json({ error: 'conversationId required' }, { status: 400 })
    }

    const conversationView = await prisma.conversationView.upsert({
      where: {
        businessId_conversationId: {
          businessId: business.id,
          conversationId: parseInt(conversationId),
        },
      },
      update: {
        lastViewedAt: new Date(),
      },
      create: {
        businessId: business.id,
        conversationId: parseInt(conversationId),
        lastViewedAt: new Date(),
      },
    })

    return NextResponse.json(conversationView)
  } catch (err: any) {
    console.error('[conversation-view POST]', err.message)
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

    // If conversationId is provided, return single view
    if (conversationId) {
      const conversationView = await prisma.conversationView.findUnique({
        where: {
          businessId_conversationId: {
            businessId: business.id,
            conversationId: parseInt(conversationId),
          },
        },
      })
      return NextResponse.json(conversationView)
    }

    // Otherwise, return all conversation views for the business
    const conversationViews = await prisma.conversationView.findMany({
      where: { businessId: business.id },
    })

    return NextResponse.json(conversationViews)
  } catch (err: any) {
    console.error('[conversation-view GET]', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
