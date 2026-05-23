import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { status } = body

    if (!status) {
      return NextResponse.json({ success: false, error: 'status is required' }, { status: 400 })
    }

    const order = await prisma.order.findFirst({
      where: { id, businessId: session.user.id },
    })

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })
    }

    const updated = await prisma.order.update({
      where: { id },
      data: { status },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('[Orders PATCH]', error)
    return NextResponse.json({ success: false, error: 'Failed to update order' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const order = await prisma.order.findFirst({
      where: { id, businessId: session.user.id },
    })

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })
    }

    await prisma.order.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Orders DELETE]', error)
    return NextResponse.json({ success: false, error: 'Failed to delete order' }, { status: 500 })
  }
}
