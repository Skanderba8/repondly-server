import { type PaymentStatus, Prisma, type OrderStatus } from '@prisma/client'
import { NextResponse } from 'next/server'
import { requireBusinessApiSession } from '@/lib/auth'
import { getOrders, mapOrder, ORDER_STATUS_VALUES, PAYMENT_STATUS_VALUES } from '@/lib/orders'
import { prisma } from '@/lib/prisma'

type CreateOrderItemBody = {
  productName?: string
  quantity?: number
  unitPrice?: number
}

type CreateOrderBody = {
  contactId?: string
  deliveryMethod?: string
  deliveryAddress?: string
  notes?: string
  paymentStatus?: PaymentStatus
  items?: CreateOrderItemBody[]
}

function parseMoney(value: number | string | Prisma.Decimal) {
  return new Prisma.Decimal(value).toDecimalPlaces(2)
}

export async function GET(request: Request) {
  const { response, session } = await requireBusinessApiSession()

  if (response || !session) {
    return response
  }

  const { searchParams } = new URL(request.url)
  const statusParam = searchParams.get('status')
  const status = statusParam && ORDER_STATUS_VALUES.includes(statusParam as OrderStatus)
    ? (statusParam as OrderStatus)
    : undefined

  const orders = await getOrders(session.user.id, status)
  return NextResponse.json({ success: true, data: orders })
}

export async function POST(request: Request) {
  const { response, session } = await requireBusinessApiSession()

  if (response || !session) {
    return response
  }

  const body = (await request.json()) as CreateOrderBody
  const contactId = body.contactId?.trim()
  const items = (body.items ?? [])
    .map((item) => ({
      productName: item.productName?.trim() ?? '',
      quantity: Number(item.quantity ?? 0),
      unitPrice: Number(item.unitPrice ?? 0),
    }))
    .filter((item) => item.productName && item.quantity > 0)

  if (!contactId) {
    return NextResponse.json({ success: false, error: 'Le contact est obligatoire.' }, { status: 400 })
  }

  if (items.length === 0) {
    return NextResponse.json({ success: false, error: 'Ajoutez au moins un article valide.' }, { status: 400 })
  }

  if (body.paymentStatus && !PAYMENT_STATUS_VALUES.includes(body.paymentStatus)) {
    return NextResponse.json({ success: false, error: 'Statut de paiement invalide.' }, { status: 400 })
  }

  const order = await prisma.$transaction(async (tx) => {
    const contact = await tx.contact.findFirst({
      where: {
        id: contactId,
        businessId: session.user.id,
      },
      select: { id: true },
    })

    if (!contact) {
      throw new Error('CONTACT_NOT_FOUND')
    }

    const lastOrder = await tx.order.findFirst({
      where: { businessId: session.user.id },
      orderBy: { orderNumber: 'desc' },
      select: { orderNumber: true },
    })

    const preparedItems = items.map((item) => {
      const unitPrice = parseMoney(item.unitPrice)
      const totalPrice = unitPrice.mul(item.quantity).toDecimalPlaces(2)

      return {
        productName: item.productName,
        quantity: item.quantity,
        unitPrice,
        totalPrice,
      }
    })

    const totalAmount = preparedItems.reduce(
      (sum, item) => sum.add(item.totalPrice),
      new Prisma.Decimal(0),
    )

    return tx.order.create({
      data: {
        businessId: session.user.id,
        contactId: contact.id,
        orderNumber: (lastOrder?.orderNumber ?? 0) + 1,
        deliveryMethod: body.deliveryMethod?.trim() || null,
        deliveryAddress: body.deliveryAddress?.trim() || null,
        notes: body.notes?.trim() || null,
        paymentStatus: body.paymentStatus ?? 'PAS_ENCORE',
        totalAmount,
        items: {
          create: preparedItems,
        },
      },
      include: {
        contact: true,
        items: {
          orderBy: { id: 'asc' },
        },
      },
    })
  }).catch((error: unknown) => {
    if (error instanceof Error && error.message === 'CONTACT_NOT_FOUND') {
      return null
    }

    throw error
  })

  if (!order) {
    return NextResponse.json({ success: false, error: 'Contact introuvable.' }, { status: 404 })
  }

  return NextResponse.json({ success: true, data: mapOrder(order) }, { status: 201 })
}
