// Main AI orchestration layer: builds prompts, cleans history, enforces usage limits, calls Groq, parses replies, and stores token usage.
// Connected to webhook auto-replies and the bot test endpoint. Edit this file when changing Groq request flow, usage accounting, or history selection.
import { Prisma } from '@prisma/client'
import { AI_CONFIG, type AiChatMessage, truncateText } from '@/lib/ai/config'
import { detectCustomerLanguage, getFallbackReply } from '@/lib/ai/language'
import { parseAiResponse, type ParsedAiPayload } from '@/lib/ai/parser'
import { buildSystemPrompt, getDailyTokenLimit, normalizePromptProducts, parseKnowledgeConfig, type ProductPromptRecord, type PromptBusiness } from '@/lib/ai/promptBuilder'
import { routeIntent, type RouterIntent, type RouterResult } from '@/lib/ai/router'
import {
  extractOrderSlots,
  getMatchedProduct as getMatchedSlotProduct,
  getNextMissingSlot,
  getOrderProduct,
  hasRepeatedComplaint,
  isExplicitOrderConfirmation,
  isOrderSignal,
  mergeOrderSlots,
  normalizeOrderSlots,
  type OrderSlots,
  withNextMissingSlot,
  withSummaryShown,
} from '@/lib/ai/slots'
import { getTemplate } from '@/lib/ai/templates'
import { prisma } from '@/lib/prisma'

type GroqChoice = {
  message?: {
    content?: string
  }
}

type GroqUsage = {
  prompt_tokens?: number
  completion_tokens?: number
  total_tokens?: number
}

type GroqResponse = {
  model?: string
  choices?: GroqChoice[]
  usage?: GroqUsage
}

type GenerateAiReplyParams = {
  businessId: string
  conversationId?: string | null
  customerMessage: string
  history?: AiChatMessage[]
  enforceLimits: boolean
}

type ProductVariantRow = {
  id: string
  variants: unknown
}

export type GenerateAiReplyResult = ParsedAiPayload & {
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
    model: string
  } | null
  limitExceeded: boolean
}

function startOfToday() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

function oneHourAgo() {
  return new Date(Date.now() - 60 * 60 * 1000)
}

export function cleanHistory(messages: AiChatMessage[]) {
  return messages
    .filter((message) => (message.role === 'user' || message.role === 'assistant') && Boolean(message.content.trim()))
    .slice(-AI_CONFIG.MAX_HISTORY_MESSAGES)
    .map((message) => ({
      role: message.role,
      content: truncateText(message.content, AI_CONFIG.MAX_HISTORY_MESSAGE_CHARS),
    }))
}

async function getProductVariantsById(businessId: string) {
  try {
    const rows = await prisma.$queryRaw<ProductVariantRow[]>`
      SELECT id, variants
      FROM "Product"
      WHERE "businessId" = ${businessId}
        AND "isActive" = true
    `

    return new Map(rows.map((row) => [row.id, row.variants]))
  } catch {
    return new Map<string, unknown>()
  }
}

async function fetchPromptData(businessId: string) {
  const [business, products, variantsById] = await Promise.all([
    prisma.business.findUnique({
      where: { id: businessId },
      select: {
        name: true,
        businessType: true,
        tone: true,
        botName: true,
        botKnowledge: true,
        botHandoffKeywords: true,
      },
    }),
    prisma.product.findMany({
      where: {
        businessId,
        isActive: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: 10,
      select: {
        id: true,
        name: true,
        type: true,
        description: true,
        price: true,
        deliveryFee: true,
        stock: true,
        fournisseur: true,
        images: {
          orderBy: { position: 'asc' },
          take: 3,
          select: {
            dataUrl: true,
            mimeType: true,
            sizeBytes: true,
            position: true,
          },
        },
      },
    }),
    getProductVariantsById(businessId),
  ])

  return [business, normalizePromptProducts(products.map((product) => ({
    ...product,
    variants: variantsById.get(product.id),
  })))] as const
}

async function checkUsageLimits(business: PromptBusiness, businessId: string, conversationId?: string | null) {
  const sinceToday = startOfToday()
  const [tokenUsage, businessReplies, conversationReplies] = await Promise.all([
    prisma.aiUsage.aggregate({
      where: {
        businessId,
        createdAt: { gte: sinceToday },
      },
      _sum: { totalTokens: true },
    }),
    prisma.aiUsage.count({
      where: {
        businessId,
        createdAt: { gte: sinceToday },
      },
    }),
    conversationId
      ? prisma.aiUsage.count({
          where: {
            businessId,
            conversationId,
            createdAt: { gte: oneHourAgo() },
          },
        })
      : Promise.resolve(0),
  ])

  const knowledge = parseKnowledgeConfig(business.botKnowledge)
  const dailyLimit = getDailyTokenLimit(knowledge)
  const usedTokens = tokenUsage._sum.totalTokens ?? 0

  return usedTokens >= dailyLimit
    || businessReplies >= AI_CONFIG.MAX_BUSINESS_REPLIES_PER_DAY
    || conversationReplies >= AI_CONFIG.MAX_CONVERSATION_REPLIES_PER_HOUR
}

async function callGroq(systemPrompt: string, history: AiChatMessage[], customerMessage: string) {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw new Error('GROQ_API_KEY_MISSING')

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), AI_CONFIG.REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: AI_CONFIG.REPLY_MODEL,
        temperature: AI_CONFIG.TEMPERATURE,
        top_p: AI_CONFIG.TOP_P,
        max_tokens: AI_CONFIG.MAX_REPLY_TOKENS,
        messages: [
          { role: 'system', content: systemPrompt },
          ...history,
          { role: 'user', content: customerMessage },
        ],
      }),
    })

    if (!response.ok) {
      throw new Error('GROQ_REQUEST_FAILED')
    }

    return await response.json() as GroqResponse
  } finally {
    clearTimeout(timeout)
  }
}

export function shouldHandover(intent: RouterIntent, history: AiChatMessage[], customerMessage: string) {
  if (intent === 'human_request') return true
  if (intent === 'complaint') return hasRepeatedComplaint(history, customerMessage)
  return false
}

function normalizeForContext(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\bzarka\b/g, 'bleu')
    .replace(/\bzarg[a-z]*\b/g, 'bleu')
    .replace(/\bbleue\b/g, 'bleu')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
}

function normalizeExactProductName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\bbleue\b/g, 'bleu')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
}

function contextTokens(value: string) {
  return normalizeForContext(value)
    .split(/\s+/)
    .map((token) => token.replace(/s$/, ''))
    .filter((token) => token.length > 1)
}

function tokenMatches(queryToken: string, productToken: string) {
  if (productToken.includes(queryToken) || queryToken.includes(productToken)) return true
  if (queryToken.length > 4 && queryToken.startsWith('l')) {
    const withoutArticle = queryToken.slice(1)
    return productToken.includes(withoutArticle) || withoutArticle.includes(productToken)
  }

  return false
}

function findProductMention(text: string, products: Array<{ name: string }>) {
  const tokens = contextTokens(text)
  if (tokens.length === 0) return null

  const scored = products
    .map((product) => {
      const productTokens = contextTokens(product.name)
      const score = productTokens.filter((productToken) => tokens.some((token) => tokenMatches(token, productToken))).length
      return { product, score, total: productTokens.length }
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => (b.score / b.total) - (a.score / a.total) || b.score - a.score)

  return scored[0]?.product.name ?? null
}

function findExactProductMention(text: string, products: Array<{ name: string }>) {
  const normalized = ` ${normalizeExactProductName(text).replace(/\s+/g, ' ')} `
  return products.find((product) => normalized.includes(` ${normalizeExactProductName(product.name).replace(/\s+/g, ' ')} `))?.name ?? null
}

function getMatchedProduct<T extends { name: string }>(text: string, products: T[]) {
  const productName = findExactProductMention(text, products) ?? findProductMention(text, products)
  return productName ? products.find((product) => product.name === productName) ?? null : null
}

function getLastMentionedProduct(history: AiChatMessage[], products: Array<{ name: string }>) {
  for (const message of [...history].reverse()) {
    const productName = findProductMention(message.content, products)
    if (productName) return productName
  }

  return null
}

function isShortConfirmation(message: string) {
  return /^(oui|yes|ey|ay|eh|ok|d'accord|daccord|behi|تمام|نعم)$/i.test(normalizeForContext(message).trim())
}

function isPhotoRequest(message: string) {
  return /\b(photo|photos|image|images|taswira|taswir|تصويرة|صورة|صور)\b/i.test(normalizeForContext(message))
}

function isShowProductRequest(message: string) {
  return /\b(warini|wari|montre|montrer|affiche|afficher|voir|show|send|envoyer)\b/i.test(normalizeForContext(message))
}

function shouldReuseProduct(intent: RouterIntent, customerMessage: string) {
  return isShortConfirmation(customerMessage)
    || isPhotoRequest(customerMessage)
    || isShowProductRequest(customerMessage)
    || intent === 'order_start'
    || intent === 'order_name'
    || intent === 'order_phone'
    || intent === 'size_inquiry'
    || intent === 'price_inquiry'
}

function resolveRoutedContext(routed: RouterResult, customerMessage: string, history: AiChatMessage[], products: Array<{ name: string }>): RouterResult {
  const currentProduct = findProductMention(customerMessage, products)
  const exactCurrentProduct = findExactProductMention(customerMessage, products)
  const historyProduct = getLastMentionedProduct(history, products)
  const shouldReuse = shouldReuseProduct(routed.intent, customerMessage)
  const productName = exactCurrentProduct ?? (shouldReuse ? historyProduct ?? currentProduct : currentProduct) ?? routed.slots.productName
  const intent = isShortConfirmation(customerMessage) && historyProduct
    ? 'order_start'
    : (isPhotoRequest(customerMessage) || isShowProductRequest(customerMessage)) && productName
      ? 'product_specific'
      : exactCurrentProduct && routed.intent === 'product_inquiry'
      ? 'product_specific'
      : routed.intent

  return {
    intent,
    slots: {
      ...routed.slots,
      productName,
    },
  }
}

function getManualVerificationReason() {
  return null
}

function getHandoverReply(language: ReturnType<typeof detectCustomerLanguage>, reason?: string | null) {
  if (reason) {
    if (language === 'AR') return 'سأتحقق من هذه المعلومة وأعود إليك بعد قليل.'
    return 'Je reviens vers vous dans quelques instants pour verifier cette information.'
  }

  if (language === 'AR') return 'سأحول طلبك إلى الفريق المختص لمساعدتك بشكل مباشر.'
  return 'Je transmets votre demande a notre equipe afin de vous aider directement.'
}

function getLocalizedHandoverReply(language: ReturnType<typeof detectCustomerLanguage>, reason?: string | null) {
  if (reason) {
    if (language === 'AR') return 'سأتحقق من هذه المعلومة وأعود إليك بعد قليل.'
    return 'Je reviens vers vous dans quelques instants pour verifier cette information.'
  }

  if (language === 'AR') return 'سأحول طلبك إلى الفريق المختص لمساعدتك بشكل مباشر.'
  return 'Je transmets votre demande a notre equipe afin de vous aider directement.'
}

async function safeRouteIntent(customerMessage: string): Promise<RouterResult> {
  try {
    return await routeIntent(customerMessage)
  } catch {
    return { intent: 'unknown', slots: {} }
  }
}

function buildOrderCreatedReply(slots: OrderSlots) {
  return `Merci ${slots.customerName ?? ''}, votre commande pour ${slots.quantity} x ${slots.productName ?? 'le produit demande'} est confirmee. Nous vous contacterons rapidement si une precision est necessaire. Bonne journee.`
}

function getProductMediaExtraction(product: ProductPromptRecord | null) {
  if (!product || product.images.length === 0) return {}

  return {
    productName: product.name,
    productImages: product.images.map((image) => ({
      dataUrl: image.dataUrl,
      mimeType: image.mimeType,
      sizeBytes: image.sizeBytes,
      position: image.position,
    })),
  }
}

async function loadConversationOrderSlots(conversationId?: string | null) {
  if (!conversationId) return normalizeOrderSlots(null)

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { orderSlots: true },
  })

  return normalizeOrderSlots(conversation?.orderSlots)
}

async function saveConversationOrderSlots(conversationId: string | null | undefined, slots: OrderSlots) {
  if (!conversationId) return

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { orderSlots: toPrismaJson(slots) },
  })
}

function buildSlotsFromHistory(history: AiChatMessage[], products: ProductPromptRecord[]) {
  return history.reduce((slots, message) => {
    if (message.role === 'user') {
      return mergeOrderSlots(slots, extractOrderSlots(message.content, products, slots))
    }

    const normalized = normalizeForContext(message.content)
    const product = getOrderProduct(slots, products)

    if ((normalized.includes('confirmez avec oui') || normalized.includes('اكد بكلمة نعم')) && !getNextMissingSlot(slots, product)) {
      return withSummaryShown(slots)
    }
    if (normalized.includes('nom complet') || normalized.includes('اسمك الكامل')) return withNextMissingSlot(slots, 'customerName')
    if (normalized.includes('telephone') || normalized.includes('رقم هاتفك')) return withNextMissingSlot(slots, 'phone')
    if (normalized.includes('quel produit') || normalized.includes('ما المنتج')) return withNextMissingSlot(slots, 'product')
    if (normalized.includes('quelle taille') || normalized.includes('ما taille')) return withNextMissingSlot(slots, 'variant')

    return slots
  }, normalizeOrderSlots(null))
}

function buildSlotStatePrompt(slots: OrderSlots, nextMissingSlot: string | null) {
  const lines = [
    '',
    'Etat conversation commande:',
    `- Phase: ${slots.phase}`,
    `- Produit identifie: ${slots.productName ?? '[manquant]'}`,
    `- Variante: ${slots.variantNotes ?? '[manquant ou non requise]'}`,
    `- Quantite: ${slots.quantity}`,
    `- Nom client: ${slots.customerName ?? '[manquant]'}`,
    `- Telephone: ${slots.phone ?? '[manquant]'}`,
    `- Adresse livraison: ${slots.deliveryAddress ?? '[non fournie]'}`,
    `- Prochaine information a demander: ${nextMissingSlot ?? '[aucune]'}`,
    'Regles slot-state:',
    '- Ne cree jamais de commande dans le fallback LLM.',
    '- Si une information manque, pose uniquement la prochaine question naturelle.',
    '- Si toutes les informations sont presentes, demande une confirmation explicite.',
  ]

  return lines.join('\n')
}

export async function generateAiReply(params: GenerateAiReplyParams): Promise<GenerateAiReplyResult> {
  const trimmedMessage = truncateText(params.customerMessage, AI_CONFIG.MAX_INPUT_CHARS)
  const language = detectCustomerLanguage(trimmedMessage)
  const fallback = getFallbackReply(language)
  const [business, products] = await fetchPromptData(params.businessId)

  if (!business) {
    return {
      reply: fallback,
      action: null,
      extraction: {},
      usage: null,
      limitExceeded: true,
    }
  }

  if (params.enforceLimits && await checkUsageLimits(business, params.businessId, params.conversationId)) {
    return {
      reply: fallback,
      action: null,
      extraction: {},
      usage: null,
      limitExceeded: true,
    }
  }

  const routed = await safeRouteIntent(trimmedMessage)
  const history = cleanHistory(params.history ?? [])
  const resolvedRoute = resolveRoutedContext(routed, trimmedMessage, history, products)
  const storedSlots = params.conversationId
    ? await loadConversationOrderSlots(params.conversationId)
    : buildSlotsFromHistory(history, products)
  const storedProduct = getOrderProduct(storedSlots, products)

  if (isExplicitOrderConfirmation(trimmedMessage, storedSlots) && !getNextMissingSlot(storedSlots, storedProduct)) {
    return {
      reply: buildOrderCreatedReply(storedSlots),
      action: {
        type: 'order_complete',
        customerName: storedSlots.customerName ?? undefined,
        phone: storedSlots.phone ?? undefined,
        items: [{
          productName: storedSlots.productName ?? '',
          quantity: storedSlots.quantity,
          unitPrice: Number(storedProduct?.price ?? 0),
        }],
        deliveryAddress: storedSlots.deliveryAddress ?? undefined,
        notes: storedSlots.variantNotes ?? undefined,
      },
      extraction: {
        intent: 'order_complete',
        ...getProductMediaExtraction(storedProduct),
      },
      usage: null,
      limitExceeded: false,
    }
  }

  const mergedSlots = mergeOrderSlots(
    storedSlots,
    extractOrderSlots(trimmedMessage, products, storedSlots, resolvedRoute.slots),
  )
  const currentProduct = getOrderProduct(mergedSlots, products)
  const nextMissingSlot = getNextMissingSlot(mergedSlots, currentProduct)
  const questionIntent = ['product_inquiry', 'product_specific', 'price_inquiry', 'size_inquiry', 'delivery_inquiry', 'payment_inquiry'].includes(resolvedRoute.intent)
  const orderRelevant = (storedSlots.phase !== 'browsing' && !questionIntent)
    || isOrderSignal(trimmedMessage, resolvedRoute.intent)
    || Boolean(storedSlots.productName && isShortConfirmation(trimmedMessage))

  if (orderRelevant) {
    if (nextMissingSlot) {
      const collectingSlots = withNextMissingSlot(mergedSlots, nextMissingSlot)
      await saveConversationOrderSlots(params.conversationId, collectingSlots)

      const template = getTemplate(
        'order_collect',
        {
          productName: collectingSlots.productName ?? '',
          nextMissingSlot,
          variantName: currentProduct?.variants[0]?.name ?? 'variante',
        },
        {
          business,
          products,
          knowledge: parseKnowledgeConfig(business.botKnowledge),
          outputLanguage: language,
        },
      )

      return {
        reply: template ?? fallback,
        action: null,
        extraction: { intent: 'order_collect', slots: collectingSlots, ...getProductMediaExtraction(currentProduct) },
        usage: null,
        limitExceeded: false,
      }
    }

    const confirmingSlots = withSummaryShown(mergedSlots)
    await saveConversationOrderSlots(params.conversationId, confirmingSlots)

    const template = getTemplate(
      'order_confirm',
      {
        productName: confirmingSlots.productName ?? '',
        quantity: String(confirmingSlots.quantity),
        customerName: confirmingSlots.customerName ?? '',
        phone: confirmingSlots.phone ?? '',
        variantNotes: confirmingSlots.variantNotes ?? '',
      },
      {
        business,
        products,
        knowledge: parseKnowledgeConfig(business.botKnowledge),
        outputLanguage: language,
      },
    )

    return {
      reply: template ?? fallback,
      action: null,
      extraction: { intent: 'order_confirm', slots: confirmingSlots, ...getProductMediaExtraction(currentProduct) },
      usage: null,
      limitExceeded: false,
    }
  }

  if (mergedSlots.productName || mergedSlots.customerName || mergedSlots.phone) {
    await saveConversationOrderSlots(params.conversationId, mergedSlots)
  }

  if (shouldHandover(resolvedRoute.intent, history, trimmedMessage)) {
    return {
      reply: getLocalizedHandoverReply(language),
      action: {
        type: 'human_handover',
        reason: resolvedRoute.intent,
      },
      extraction: { reason: resolvedRoute.intent },
      usage: null,
      limitExceeded: false,
    }
  }

  const manualVerificationReason = getManualVerificationReason()
  if (manualVerificationReason) {
    return {
      reply: getLocalizedHandoverReply(language, manualVerificationReason),
      action: {
        type: 'human_handover',
        reason: manualVerificationReason,
      },
      extraction: { reason: manualVerificationReason, intent: resolvedRoute.intent, slots: resolvedRoute.slots },
      usage: null,
      limitExceeded: false,
    }
  }

  const template = getTemplate(
    resolvedRoute.intent,
    {
      productName: resolvedRoute.slots.productName ?? '',
      size: resolvedRoute.slots.size ?? '',
      quantity: resolvedRoute.slots.quantity ?? '',
      isFirstMessage: history.length === 0 ? 'true' : '',
    },
    {
      business,
      products,
      knowledge: parseKnowledgeConfig(business.botKnowledge),
      outputLanguage: language,
    },
  )

  if (template) {
    const templateProduct = ['product_specific', 'price_inquiry'].includes(resolvedRoute.intent)
      ? getMatchedSlotProduct(resolvedRoute.slots.productName ?? trimmedMessage, products)
      : null

    return {
      reply: template,
      action: null,
      extraction: { intent: resolvedRoute.intent, slots: resolvedRoute.slots, ...getProductMediaExtraction(templateProduct) },
      usage: null,
      limitExceeded: false,
    }
  }

  const fallbackProduct = getOrderProduct(mergedSlots, products)
  const fallbackNextSlot = getNextMissingSlot(mergedSlots, fallbackProduct)
  const systemPrompt = truncateText(
    `${buildSystemPrompt(business, products)}${buildSlotStatePrompt(mergedSlots, fallbackNextSlot)}`,
    AI_CONFIG.MAX_SYSTEM_PROMPT_CHARS,
  )
  const payload = await callGroq(systemPrompt, history, trimmedMessage)
  const rawContent = payload.choices?.[0]?.message?.content?.trim()
  const parsed = rawContent ? parseAiResponse(rawContent, trimmedMessage) : parseAiResponse(fallback, trimmedMessage)
  const usage = {
    promptTokens: payload.usage?.prompt_tokens ?? 0,
    completionTokens: payload.usage?.completion_tokens ?? 0,
    totalTokens: payload.usage?.total_tokens ?? 0,
    model: payload.model ?? AI_CONFIG.REPLY_MODEL,
  }

  if (params.enforceLimits) {
    await prisma.aiUsage.create({
      data: {
        businessId: params.businessId,
        conversationId: params.conversationId ?? null,
        model: usage.model,
        promptTokens: usage.promptTokens,
        completionTokens: usage.completionTokens,
        totalTokens: usage.totalTokens,
      },
    })
  }

  return {
    ...parsed,
    usage,
    limitExceeded: false,
  }
}

export function toPrismaJson(value: unknown): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  if (value === null || value === undefined) return Prisma.JsonNull
  return value as Prisma.InputJsonValue
}
