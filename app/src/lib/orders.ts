import { type PaymentStatus, Prisma, type OrderStatus as PrismaOrderStatus } from '@prisma/client'
import { ORDER_STATUS_VALUES, PAYMENT_STATUS_VALUES, ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from '@/lib/order-meta'
import { prisma } from '@/lib/prisma'
import { buildInitials } from '@/lib/utils/initials'
import type { Contact, Order, OrderItem, OrderStatus } from '@/types'

type OrderRecord = Prisma.OrderGetPayload<{
  include: {
    contact: true
    items: true
  }
}>

export { ORDER_STATUS_VALUES, PAYMENT_STATUS_VALUES, ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS }

function formatDecimal(value: Prisma.Decimal | number | string) {
  return new Prisma.Decimal(value).toFixed(2)
}

function mapContact(contact: {
  id: string
  name: string | null
  username: string | null
  phone: string | null
  totalConversations: number
  tags: string[]
  notes: string | null
  lastSeen: Date | null
}): Contact {
  return {
    id: contact.id,
    name: contact.name ?? contact.username ?? undefined,
    phone: contact.phone ?? undefined,
    initials: buildInitials(contact.name ?? contact.username ?? undefined, contact.phone ?? undefined),
    totalConversations: contact.totalConversations,
    tags: contact.tags,
    notes: contact.notes ?? undefined,
    lastSeen: contact.lastSeen?.toISOString(),
  }
}

function mapOrderItem(item: {
  id: string
  productName: string
  quantity: number
  unitPrice: Prisma.Decimal
  totalPrice: Prisma.Decimal
}): OrderItem {
  return {
    id: item.id,
    productName: item.productName,
    quantity: item.quantity,
    unitPrice: formatDecimal(item.unitPrice),
    totalPrice: formatDecimal(item.totalPrice),
  }
}

export function mapOrder(order: OrderRecord): Order {
  return {
    id: order.id,
    contactId: order.contactId,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    deliveryMethod: order.deliveryMethod ?? undefined,
    deliveryAddress: order.deliveryAddress ?? undefined,
    notes: order.notes ?? undefined,
    totalAmount: formatDecimal(order.totalAmount),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    contact: mapContact(order.contact),
    items: order.items.map(mapOrderItem),
  }
}

export async function getOrders(businessId: string, status?: PrismaOrderStatus) {
  const orders = await prisma.order.findMany({
    where: {
      businessId,
      ...(status ? { status } : {}),
    },
    include: {
      contact: true,
      items: {
        orderBy: { id: 'asc' },
      },
    },
    orderBy: [
      { createdAt: 'desc' },
      { orderNumber: 'desc' },
    ],
  })

  return orders.map(mapOrder)
}

export async function getOrderById(businessId: string, id: string) {
  const order = await prisma.order.findFirst({
    where: { id, businessId },
    include: {
      contact: true,
      items: {
        orderBy: { id: 'asc' },
      },
    },
  })

  return order ? mapOrder(order) : null
}
