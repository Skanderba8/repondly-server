import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')

    const orders = await prisma.order.findMany({
      where: {
        businessId: session.user.id,
        ...(status && status !== 'ALL' && { status: status as 'PENDING' | 'CONFIRMED' | 'CANCELLED' }),
        ...(type && type !== 'ALL' && { type: type as 'ORDER' | 'APPOINTMENT' }),
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: orders })
  } catch (error) {
    console.error('[Orders GET]', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch orders' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, clientName, clientPhone, items, notes, total, datetime } = body

    if (!type) {
      return NextResponse.json({ success: false, error: 'type is required' }, { status: 400 })
    }

    const order = await prisma.order.create({
      data: {
        businessId: session.user.id,
        type,
        clientName,
        clientPhone,
        items,
        notes,
        total,
        datetime: datetime ? new Date(datetime) : null,
      },
    })

    return NextResponse.json({ success: true, data: order })
  } catch (error) {
    console.error('[Orders POST]', error)
    return NextResponse.json({ success: false, error: 'Failed to create order' }, { status: 500 })
  }
}
