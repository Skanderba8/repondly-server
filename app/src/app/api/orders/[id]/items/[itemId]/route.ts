import { Prisma } from '@prisma/client'
import { NextResponse } from 'next/server'
import { requireBusinessApiSession } from '@/lib/auth'
import { mapOrder } from '@/lib/orders'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> },
) {
  const { response, session } = await requireBusinessApiSession()

  if (response || !session) {
    return response
  }

  const { id, itemId } = await params

  const updatedOrder = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirst({
      where: {
        id,
        businessId: session.user.id,
      },
      select: { id: true },
    })

    if (!order) {
      throw new Error('ORDER_NOT_FOUND')
    }

    const item = await tx.orderItem.findFirst({
      where: {
        id: itemId,
        orderId: order.id,
      },
      select: { id: true },
    })

    if (!item) {
      throw new Error('ITEM_NOT_FOUND')
    }

    await tx.orderItem.delete({
      where: { id: item.id },
    })

    const totals = await tx.orderItem.aggregate({
      where: { orderId: order.id },
      _sum: { totalPrice: true },
    })

    return tx.order.update({
      where: { id: order.id },
      data: {
        totalAmount: totals._sum.totalPrice ?? new Prisma.Decimal(0),
      },
      include: {
        contact: true,
        items: {
          orderBy: { id: 'asc' },
        },
      },
    })
  }).catch((error: unknown) => {
    if (error instanceof Error && (error.message === 'ORDER_NOT_FOUND' || error.message === 'ITEM_NOT_FOUND')) {
      return null
    }

    throw error
  })

  if (!updatedOrder) {
    return NextResponse.json({ success: false, error: 'Commande ou article introuvable.' }, { status: 404 })
  }

  return NextResponse.json({ success: true, data: mapOrder(updatedOrder) })
}
