import { Prisma } from '@prisma/client'
import { NextResponse } from 'next/server'
import { requireBusinessApiSession } from '@/lib/auth'
import { mapOrder } from '@/lib/orders'
import { prisma } from '@/lib/prisma'

type CreateOrderItemBody = {
  productName?: string
  quantity?: number
  unitPrice?: number
}

function parseMoney(value: number | string | Prisma.Decimal) {
  return new Prisma.Decimal(value).toDecimalPlaces(2)
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response, session } = await requireBusinessApiSession()

  if (response || !session) {
    return response
  }

  const { id } = await params
  const body = (await request.json()) as CreateOrderItemBody
  const productName = body.productName?.trim() ?? ''
  const quantity = Number(body.quantity ?? 0)
  const unitPriceNumber = Number(body.unitPrice ?? 0)

  if (!productName || quantity <= 0 || unitPriceNumber < 0) {
    return NextResponse.json({ success: false, error: 'Article invalide.' }, { status: 400 })
  }

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

    const unitPrice = parseMoney(unitPriceNumber)
    const totalPrice = unitPrice.mul(quantity).toDecimalPlaces(2)

    await tx.orderItem.create({
      data: {
        orderId: order.id,
        productName,
        quantity,
        unitPrice,
        totalPrice,
      },
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
    if (error instanceof Error && error.message === 'ORDER_NOT_FOUND') {
      return null
    }

    throw error
  })

  if (!updatedOrder) {
    return NextResponse.json({ success: false, error: 'Commande introuvable.' }, { status: 404 })
  }

  return NextResponse.json({ success: true, data: mapOrder(updatedOrder) })
}
