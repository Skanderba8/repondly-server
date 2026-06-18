// Main AI orchestration layer: builds prompts, cleans history, enforces usage limits, calls Groq, parses replies, and stores token usage.
// Connected to webhook auto-replies and the bot test endpoint. Edit this file when changing Groq request flow, usage accounting, or history selection.
import { Prisma } from '@prisma/client'
import { AI_CONFIG, type AiChatMessage, truncateText } from '@/lib/ai/config'
import { detectCustomerLanguage, getFallbackReply } from '@/lib/ai/language'
import { parseAiResponse, type ParsedAiPayload } from '@/lib/ai/parser'
import { buildSystemPrompt, getDailyTokenLimit, normalizePromptProducts, parseKnowledgeConfig, type ProductPromptRecord, type PromptBusiness } from '@/lib/ai/promptBuilder'
import { routeIntent, type RouterIntent, type RouterResult } from '@/lib/ai/router'
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

function shouldHandover(intent: RouterIntent) {
  return intent === 'negotiation' || intent === 'complaint' || intent === 'human_request'
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

function isOrderConfirmation(message: string) {
  const normalized = normalizeForContext(message).trim()
  return isShortConfirmation(message) || /\b(commande|commander|order|acheter|passer)\b/.test(normalized)
}

function extractPhone(text: string) {
  const match = text.match(/(?:\+?216[\s.-]?)?([24579]\d[\s.-]?\d{3}[\s.-]?\d{3})\b/)
  return match ? match[0].replace(/[^\d+]/g, '') : null
}

function extractQuantity(text: string, phone: string | null) {
  const withoutPhone = phone ? text.replace(/(?:\+?216[\s.-]?)?[24579]\d[\s.-]?\d{3}[\s.-]?\d{3}\b/, ' ') : text
  const match = withoutPhone.match(/\b([1-9]\d?)\b/)
  return match ? Number(match[1]) : 1
}

function extractCustomerName(text: string, product: ProductPromptRecord, phone: string | null) {
  const productName = product.name
  const productTokens = normalizeExactProductName(productName).split(/\s+/).filter(Boolean)
  const variantTokens = new Set(product.variants.flatMap((variant) => [
    normalizeExactProductName(variant.name),
    ...variant.values.map((value) => normalizeExactProductName(value)),
  ]).filter(Boolean))
  const phoneDigits = phone?.replace(/\D/g, '') ?? ''
  const ignoredTokens = new Set(['oui', 'yes', 'commande', 'commander', 'order', 'acheter', 'passer', 'la', 'le', 'un', 'une', 'pour'])

  const tokens = text
    .replace(/[^\p{L}\p{N}\s+]/gu, ' ')
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean)
    .filter((token) => {
      const normalized = normalizeExactProductName(token)
      const digits = token.replace(/\D/g, '')
      if (!normalized) return false
      if (/^\d+$/.test(normalized)) return false
      if (phoneDigits && digits && phoneDigits.includes(digits)) return false
      if (productTokens.includes(normalized)) return false
      if (variantTokens.has(normalized)) return false
      return !ignoredTokens.has(normalized)
    })

  return tokens.slice(-3).join(' ') || null
}

function extractVariantNotes(message: string, product: ProductPromptRecord) {
  if (product.variants.length === 0) return null

  const normalizedMessage = normalizeExactProductName(message)
  const messageTokens = new Set(normalizedMessage.split(/\s+/).filter(Boolean))
  const selections = product.variants.flatMap((variant) => {
    const selectedValue = variant.values.find((value) => {
      const normalizedValue = normalizeExactProductName(value)
      return normalizedValue.length <= 2 ? messageTokens.has(normalizedValue) : normalizedMessage.includes(normalizedValue)
    })
    return selectedValue ? [`${variant.name}: ${selectedValue}`] : []
  })

  return selections.length === product.variants.length ? selections.join(', ') : null
}

function findCompleteOrderRequest(message: string, products: ProductPromptRecord[], contextProductName?: string | null) {
  const product = getMatchedProduct(message, products)
    ?? (contextProductName ? products.find((item) => item.name === contextProductName) ?? null : null)
  if (!product) return null

  const variantNotes = extractVariantNotes(message, product)
  if (product.variants.length > 0 && !variantNotes) return null

  const phone = extractPhone(message)
  if (!phone) return null

  const customerName = extractCustomerName(message, product, phone)
  if (!customerName) return null

  return {
    customerName,
    phone,
    product,
    quantity: extractQuantity(message, phone),
    variantNotes,
  }
}

function findCompleteOrderInHistory(history: AiChatMessage[], products: ProductPromptRecord[], contextProductName?: string | null) {
  for (const message of [...history].reverse()) {
    if (message.role !== 'user') continue
    const orderRequest = findCompleteOrderRequest(message.content, products, contextProductName)
    if (orderRequest) return orderRequest
  }

  return null
}

function buildOrderConfirmationReply(orderRequest: NonNullable<ReturnType<typeof findCompleteOrderRequest>>) {
  const variant = orderRequest.variantNotes ? ` (${orderRequest.variantNotes})` : ''
  return `Merci ${orderRequest.customerName}, votre commande pour ${orderRequest.quantity} x ${orderRequest.product.name}${variant} est confirmee. Nous vous contacterons rapidement si une precision est necessaire. Bonne journee.`
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
  const completeOrderRequest = findCompleteOrderRequest(trimmedMessage, products, resolvedRoute.slots.productName)
    ?? (isOrderConfirmation(trimmedMessage) ? findCompleteOrderInHistory(history, products, resolvedRoute.slots.productName) : null)

  if (completeOrderRequest) {
    return {
      reply: buildOrderConfirmationReply(completeOrderRequest),
      action: {
        type: 'order_complete',
        customerName: completeOrderRequest.customerName,
        phone: completeOrderRequest.phone,
        items: [{
          productName: completeOrderRequest.product.name,
          quantity: completeOrderRequest.quantity,
          unitPrice: Number(completeOrderRequest.product.price),
        }],
        notes: completeOrderRequest.variantNotes ?? undefined,
      },
      extraction: {
        intent: 'order_complete',
        ...getProductMediaExtraction(completeOrderRequest.product),
      },
      usage: null,
      limitExceeded: false,
    }
  }

  if (shouldHandover(resolvedRoute.intent)) {
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
      ? getMatchedProduct(resolvedRoute.slots.productName ?? trimmedMessage, products)
      : null

    return {
      reply: template,
      action: null,
      extraction: { intent: resolvedRoute.intent, slots: resolvedRoute.slots, ...getProductMediaExtraction(templateProduct) },
      usage: null,
      limitExceeded: false,
    }
  }

  const systemPrompt = buildSystemPrompt(business, products)
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
