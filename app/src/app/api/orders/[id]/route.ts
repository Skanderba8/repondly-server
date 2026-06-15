import { type PaymentStatus, type OrderStatus } from '@prisma/client'
import { NextResponse } from 'next/server'
import { getOrderById, mapOrder, ORDER_STATUS_VALUES, PAYMENT_STATUS_VALUES } from '@/lib/orders'
import { requireBusinessApiSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type PatchOrderBody = {
  status?: OrderStatus
  paymentStatus?: PaymentStatus
  notes?: string
  deliveryMethod?: string
  deliveryAddress?: string
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response, session } = await requireBusinessApiSession()

  if (response || !session) {
    return response
  }

  const { id } = await params
  const order = await getOrderById(session.user.id, id)

  if (!order) {
    return NextResponse.json({ success: false, error: 'Commande introuvable.' }, { status: 404 })
  }

  return NextResponse.json({ success: true, data: order })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response, session } = await requireBusinessApiSession()

  if (response || !session) {
    return response
  }

  const { id } = await params
  const body = (await request.json()) as PatchOrderBody

  if (body.status && !ORDER_STATUS_VALUES.includes(body.status)) {
    return NextResponse.json({ success: false, error: 'Statut invalide.' }, { status: 400 })
  }

  if (body.paymentStatus && !PAYMENT_STATUS_VALUES.includes(body.paymentStatus)) {
    return NextResponse.json({ success: false, error: 'Statut de paiement invalide.' }, { status: 400 })
  }

  const order = await prisma.order.findFirst({
    where: {
      id,
      businessId: session.user.id,
    },
    select: { id: true },
  })

  if (!order) {
    return NextResponse.json({ success: false, error: 'Commande introuvable.' }, { status: 404 })
  }

  const updatedOrder = await prisma.order.update({
    where: { id: order.id },
    data: {
      ...(body.status ? { status: body.status } : {}),
      ...(body.paymentStatus ? { paymentStatus: body.paymentStatus } : {}),
      ...(body.notes !== undefined ? { notes: body.notes.trim() || null } : {}),
      ...(body.deliveryMethod !== undefined ? { deliveryMethod: body.deliveryMethod.trim() || null } : {}),
      ...(body.deliveryAddress !== undefined ? { deliveryAddress: body.deliveryAddress.trim() || null } : {}),
    },
    include: {
      contact: true,
      items: {
        orderBy: { id: 'asc' },
      },
    },
  })

  return NextResponse.json({ success: true, data: mapOrder(updatedOrder) })
}
