// Executes safe side effects requested by parsed AI actions, such as human handover summaries and order creation.
// Connected to parser.ts, webhook auto-replies, and the bot test endpoint. Edit this file when adding new bot actions or changing order validation.
import { Prisma } from '@prisma/client'
import { type AiAction } from '@/lib/ai/parser'
import { type ProductPromptRecord } from '@/lib/ai/promptBuilder'
import { normalizeOrderSlots } from '@/lib/ai/slots'
import { mapOrder } from '@/lib/orders'
import { prisma } from '@/lib/prisma'

type ExecuteActionParams = {
  businessId: string
  conversationId?: string | null
  contactId?: string | null
  action: AiAction | null
  products: ProductPromptRecord[]
  testMode: boolean
}

const TEST_CONTACT_EXTERNAL_ID_PREFIX = 'bot-test'

function normalizeItems(action: AiAction, products: ProductPromptRecord[]) {
  return (action.items ?? [])
    .map((item) => {
      const productName = item.productName?.trim() ?? ''
      const matchedProduct = products.find((product) => product.name.toLowerCase() === productName.toLowerCase())
      const unitPrice = Number(item.unitPrice ?? matchedProduct?.price.toNumber() ?? 0)

      return {
        productName,
        quantity: Math.max(1, Number(item.quantity ?? 1)),
        unitPrice,
      }
    })
    .filter((item) => item.productName && item.quantity > 0)
}

export function validateOrderAction(action: AiAction) {
  const items = action.items?.filter((item) => item.productName?.trim()) ?? []
  const missing = [
    items.length === 0 ? 'produit ou service' : null,
    !(action.customerName?.trim() || action.name?.trim()) ? 'nom complet' : null,
    !action.phone?.trim() ? 'telephone' : null,
  ].filter(Boolean)

  return missing as string[]
}

function buildActionNote(action: AiAction, prefix: string) {
  return [
    prefix,
    action.reason ? `Raison: ${action.reason}` : null,
    action.summary ? `Resume: ${action.summary}` : null,
    action.notes ? `Notes: ${action.notes}` : null,
  ].filter(Boolean).join('\n')
}

async function appendConversationSummary(conversationId: string | null | undefined, note: string) {
  if (!conversationId || !note) return

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { summary: true },
  })

  const current = conversation?.summary?.trim()
  await prisma.conversation.update({
    where: { id: conversationId },
    data: {
      summary: current ? `${current}\n\n${note}` : note,
    },
  })
}

async function createOrder(params: ExecuteActionParams) {
  if (!params.action) return null
  const action = params.action

  const missing = validateOrderAction(action)
  if (missing.length > 0) {
    await appendConversationSummary(params.conversationId, `Action commande bloquee: champs manquants: ${missing.join(', ')}.`)
    return null
  }

  const items = normalizeItems(action, params.products)
  if (items.length === 0) return null

  const phone = action.phone?.trim() || null
  const email = action.email?.trim() || null
  const customerName = action.customerName?.trim() || action.name?.trim() || phone || email || 'Client'

  const order = await prisma.$transaction(async (tx) => {
    let contactId = params.contactId ?? null

    if (!contactId && params.testMode) {
      const connection = await tx.businessChannelConnection.findFirst({
        where: { businessId: params.businessId },
        orderBy: { createdAt: 'desc' },
        select: { id: true, channel: true },
      })

      if (!connection) return null

      const externalKey = phone ?? email ?? customerName
      const contact = await tx.contact.upsert({
        where: {
          businessId_channel_externalId: {
            businessId: params.businessId,
            channel: connection.channel,
            externalId: `${TEST_CONTACT_EXTERNAL_ID_PREFIX}:${externalKey.toLowerCase()}`,
          },
        },
        update: {
          connectionId: connection.id,
          name: customerName,
          phone,
          notes: email ? `Email: ${email}` : undefined,
          lastSeen: new Date(),
        },
        create: {
          businessId: params.businessId,
          connectionId: connection.id,
          channel: connection.channel,
          externalId: `${TEST_CONTACT_EXTERNAL_ID_PREFIX}:${externalKey.toLowerCase()}`,
          name: customerName,
          phone,
          notes: email ? `Email: ${email}` : null,
          lastSeen: new Date(),
        },
        select: { id: true },
      })

      contactId = contact.id
    }

    if (!contactId) return null

    const contact = await tx.contact.findFirst({
      where: {
        id: contactId,
        businessId: params.businessId,
      },
      select: { id: true },
    })

    if (!contact) return null

    const lastOrder = await tx.order.findFirst({
      where: { businessId: params.businessId },
      orderBy: { orderNumber: 'desc' },
      select: { orderNumber: true },
    })

    const preparedItems = items.map((item) => {
      const unitPrice = new Prisma.Decimal(item.unitPrice).toDecimalPlaces(2)
      return {
        productName: item.productName,
        quantity: item.quantity,
        unitPrice,
        totalPrice: unitPrice.mul(item.quantity).toDecimalPlaces(2),
      }
    })

    const totalAmount = preparedItems.reduce((sum, item) => sum.add(item.totalPrice), new Prisma.Decimal(0))
    const notes = [
      action.notes?.trim() ? `Notes: ${action.notes.trim()}` : null,
      action.preferredDate?.trim() ? `Date souhaitee: ${action.preferredDate.trim()}` : null,
      email ? `Email: ${email}` : null,
    ].filter(Boolean).join('\n')

    return tx.order.create({
      data: {
        businessId: params.businessId,
        contactId: contact.id,
        conversationId: params.conversationId ?? null,
        orderNumber: (lastOrder?.orderNumber ?? 0) + 1,
        status: 'NOUVEAU',
        paymentStatus: 'PAS_ENCORE',
        deliveryAddress: action.deliveryAddress?.trim() || null,
        notes: notes || null,
        totalAmount,
        items: { create: preparedItems },
      },
      include: {
        contact: true,
        items: {
          orderBy: { id: 'asc' },
        },
      },
    })
  })

  if (order) {
    await appendConversationSummary(params.conversationId, buildActionNote(action, `Commande creee #${order.orderNumber}.`))
    if (params.conversationId) {
      const conversation = await prisma.conversation.findUnique({
        where: { id: params.conversationId },
        select: { orderSlots: true },
      })
      const orderSlots = {
        ...normalizeOrderSlots(conversation?.orderSlots),
        phase: 'done' as const,
        confirmedAt: new Date().toISOString(),
      }

      await prisma.conversation.update({
        where: { id: params.conversationId },
        data: {
          status: 'CONFIRMED',
          orderSlots: orderSlots as Prisma.InputJsonValue,
        },
      })
    }
  }

  return order ? mapOrder(order) : null
}

export async function executeAiAction(params: ExecuteActionParams) {
  if (!params.action?.type) return { order: null, handled: false }

  if (params.action.type === 'human_handover') {
    if (params.conversationId) {
      await prisma.conversation.update({
        where: { id: params.conversationId },
        data: { status: 'IN_PROGRESS' },
      })
      await appendConversationSummary(params.conversationId, buildActionNote(params.action, 'Handover humain demande.'))
    }

    return { order: null, handled: true }
  }

  if (params.action.type === 'appointment_complete') {
    if (params.conversationId) {
      await prisma.conversation.update({
        where: { id: params.conversationId },
        data: { status: 'IN_PROGRESS' },
      })
      await appendConversationSummary(params.conversationId, buildActionNote(params.action, 'Rendez-vous a traiter manuellement.'))
    }

    return { order: null, handled: true }
  }

  if (params.action.type === 'order_complete') {
    const order = await createOrder(params)
    return { order, handled: Boolean(order) }
  }

  return { order: null, handled: false }
}
