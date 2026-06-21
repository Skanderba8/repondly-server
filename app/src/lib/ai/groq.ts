// Main AI orchestration layer: builds prompts, cleans history, enforces usage limits, calls Groq, parses replies, and stores token usage.
// Connected to webhook auto-replies and the bot test endpoint. Edit this file when changing Groq request flow, usage accounting, or history selection.
import { Prisma } from '@prisma/client'
import { AI_CONFIG, type AiChatMessage, truncateText } from '@/lib/ai/config'
import { detectCustomerLanguage, getFallbackReply, isTunisianLanguage } from '@/lib/ai/language'
import { parseAiResponse, type ParsedAiPayload } from '@/lib/ai/parser'
import { buildSystemPrompt, getDailyTokenLimit, normalizePromptProducts, parseKnowledgeConfig, type OrderFieldKey, type ProductPromptRecord, type PromptBusiness } from '@/lib/ai/promptBuilder'
import { routeIntent, type RouterIntent, type RouterResult } from '@/lib/ai/router'
import {
  extractOrderSlots,
  getMissingSlots,
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

function isNeutralOrderDetailMessage(message: string) {
  const normalized = message.trim()
  if (!normalized) return false
  if (/\d/.test(normalized)) return true
  if (normalized.split(/\s+/).length <= 5 && /^[\p{L}\s'-]+$/u.test(normalized)) return true
  return false
}

function resolveConversationLanguage(customerMessage: string, history: AiChatMessage[]) {
  const currentLanguage = detectCustomerLanguage(customerMessage)
  if (currentLanguage !== 'fr' || !isNeutralOrderDetailMessage(customerMessage)) return currentLanguage

  const previousUserMessage = [...history].reverse().find((message) => message.role === 'user')
  if (!previousUserMessage) return currentLanguage

  const previousLanguage = detectCustomerLanguage(previousUserMessage.content)
  return isTunisianLanguage(previousLanguage) ? previousLanguage : currentLanguage
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
    .filter((token) => token.length > 1 && !['des', 'les', 'vos', 'vot', 'avec', 'and', 'the', 'pour', 'eli'].includes(token))
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
  return [...products]
    .sort((a, b) => normalizeExactProductName(b.name).length - normalizeExactProductName(a.name).length)
    .find((product) => normalized.includes(` ${normalizeExactProductName(product.name).replace(/\s+/g, ' ')} `))?.name ?? null
}

function getMatchedProduct<T extends { name: string }>(text: string, products: T[]) {
  const productName = findExactProductMention(text, products) ?? findProductMention(text, products)
  return productName ? products.find((product) => product.name === productName) ?? null : null
}

function getMatchedProducts<T extends { name: string }>(text: string, products: T[]) {
  const productTokenGroups = products.map((product) => ({ product, tokens: contextTokens(product.name) }))
  const queryTokens = contextTokens(text).filter((token) => productTokenGroups.some((item) => item.tokens.some((productToken) => tokenMatches(token, productToken))))
  if (queryTokens.length === 0) return products.slice(0, 3)

  return productTokenGroups
    .map((item) => {
      const score = queryTokens.filter((token) => item.tokens.some((productToken) => tokenMatches(token, productToken))).length
      return { product: item.product, score }
    })
    .filter((item) => item.score === queryTokens.length)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.product)
    .slice(0, 3)
}

function getLastMentionedProduct(history: AiChatMessage[], products: Array<{ name: string }>) {
  for (const message of [...history].reverse()) {
    const productName = findProductMention(message.content, products)
    if (productName) return productName
  }

  return null
}

function isShortConfirmation(message: string) {
  return /^(oui|yes|ey|ay|eh|ok|d'accord|daccord|behi|sahha|tamam|na3am|confirm|confirmi|تمام|نعم)$/i.test(normalizeForContext(message).trim())
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
  const inquiryProductName = routed.intent === 'product_inquiry' ? routed.slots.productName ?? customerMessage : productName
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
      productName: inquiryProductName,
    },
  }
}

function getManualVerificationReason() {
  return null
}

function getHandoverReply(language: ReturnType<typeof detectCustomerLanguage>, reason?: string | null) {
  if (reason) {
    if (isTunisianLanguage(language)) return 'Behi, taw net2akdou men el info w narj3oulek.'
    if (language === 'en') return 'I will check this information and get back to you shortly.'
    return 'Je reviens vers vous dans quelques instants pour verifier cette information.'
  }

  if (isTunisianLanguage(language)) return 'Behi, taw n7awel talbek lel equipe bech y3awnouk directement.'
  if (language === 'en') return 'I will transfer your request to our team so they can help you directly.'
  return 'Je transmets votre demande a notre equipe afin de vous aider directement.'
}

function getLocalizedHandoverReply(language: ReturnType<typeof detectCustomerLanguage>, reason?: string | null) {
  return getHandoverReply(language, reason)
}

async function safeRouteIntent(customerMessage: string): Promise<RouterResult> {
  try {
    return await routeIntent(customerMessage)
  } catch {
    return { intent: 'unknown', slots: {} }
  }
}

function formatDeliveryDelay(value: string) {
  const trimmed = value.trim()
  return trimmed || 'le delai configure'
}

function buildOrderCreatedReply(slots: OrderSlots, language: ReturnType<typeof detectCustomerLanguage>, deliveryDelay: string) {
  const delay = formatDeliveryDelay(deliveryDelay)

  if (isTunisianLanguage(language)) {
    return `Merci ${slots.customerName ?? ''}, commande mte3ek ${slots.quantity} x ${slots.productName ?? 'el produit'} tconfirmet. Bech touslek entre ${delay}.`
  }

  if (language === 'en') {
    return `Thank you ${slots.customerName ?? ''}, your order for ${slots.quantity} x ${slots.productName ?? 'the requested product'} is confirmed. Delivery is expected within ${delay}.`
  }

  return `Merci ${slots.customerName ?? ''}, votre commande pour ${slots.quantity} x ${slots.productName ?? 'le produit demande'} a ete confirmee. Elle vous sera livree entre ${delay}.`
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

function getProductsMediaExtraction(products: ProductPromptRecord[]) {
  const productImages = products
    .flatMap((product) => product.images.slice(0, 1).map((image) => ({
      dataUrl: image.dataUrl,
      mimeType: image.mimeType,
      sizeBytes: image.sizeBytes,
      position: image.position,
    })))
    .slice(0, 3)

  return productImages.length > 0 ? { productImages } : {}
}

function withFirstGreeting(reply: string, firstMessage: boolean, language: ReturnType<typeof detectCustomerLanguage>, business: PromptBusiness) {
  if (!firstMessage) return reply
  const trimmed = reply.trim()
  if (/^(bonjour|ahla|marhbe|salut|hello)\b/i.test(trimmed)) return trimmed

  if (isTunisianLanguage(language)) return `Ahla, marhbe bik chez ${business.name}. ${trimmed}`
  if (language === 'en') return `Hello, welcome to ${business.name}. ${trimmed}`
  return `Bonjour, bienvenue chez ${business.name}. ${trimmed}`
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

function buildSlotsFromHistory(history: AiChatMessage[], products: ProductPromptRecord[], requiredFields: OrderFieldKey[]) {
  return history.reduce((slots, message) => {
    if (message.role === 'user') {
      return mergeOrderSlots(slots, extractOrderSlots(message.content, products, slots))
    }

    const normalized = normalizeForContext(message.content)
    const product = getOrderProduct(slots, products)

    if ((normalized.includes('vous confirmez la commande') || normalized.includes('commande haka behya') || normalized.includes('confirmez avec oui') || normalized.includes('aked b oui')) && !getNextMissingSlot(slots, product, requiredFields)) {
      return withSummaryShown(slots)
    }
    if (normalized.includes('produit souhaite')) return withNextMissingSlot(slots, 'product')
    if (normalized.includes('nom complet') || normalized.includes('esm el client') || normalized.includes('اسمك')) return withNextMissingSlot(slots, 'customerName')
    if (normalized.includes('telephone') || normalized.includes('رقم')) return withNextMissingSlot(slots, 'phone')
    if (normalized.includes('adresse livraison') || normalized.includes('adresse de livraison')) return withNextMissingSlot(slots, 'deliveryAddress')
    if (normalized.includes('quel produit') || normalized.includes('chnowa t7eb') || normalized.includes('ما المنتج')) return withNextMissingSlot(slots, 'product')
    if (normalized.includes('quelle taille') || normalized.includes('anahi') || normalized.includes('ما taille')) return withNextMissingSlot(slots, 'variant')

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
  const initialFallback = getFallbackReply(detectCustomerLanguage(trimmedMessage))
  const [business, products] = await fetchPromptData(params.businessId)

  if (!business) {
    return {
      reply: initialFallback,
      action: null,
      extraction: {},
      usage: null,
      limitExceeded: true,
    }
  }

  if (params.enforceLimits && await checkUsageLimits(business, params.businessId, params.conversationId)) {
    return {
      reply: initialFallback,
      action: null,
      extraction: {},
      usage: null,
      limitExceeded: true,
    }
  }

  const routed = await safeRouteIntent(trimmedMessage)
  const history = cleanHistory(params.history ?? [])
  const language = resolveConversationLanguage(trimmedMessage, history)
  const fallback = getFallbackReply(language)
  const firstMessage = history.length === 0
  const knowledge = parseKnowledgeConfig(business.botKnowledge)
  const requiredOrderFields = knowledge.orderCapture.enabled ? knowledge.orderCapture.requiredFields : []
  const resolvedRoute = resolveRoutedContext(routed, trimmedMessage, history, products)
  const storedSlots = params.conversationId
    ? await loadConversationOrderSlots(params.conversationId)
    : buildSlotsFromHistory(history, products, requiredOrderFields)
  const storedProduct = getOrderProduct(storedSlots, products)

  if (isExplicitOrderConfirmation(trimmedMessage, storedSlots) && !getNextMissingSlot(storedSlots, storedProduct, requiredOrderFields)) {
    return {
      reply: buildOrderCreatedReply(storedSlots, language, knowledge.deliveryDelay),
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
      },
      usage: null,
      limitExceeded: false,
    }
  }

  const extractedSlots = extractOrderSlots(trimmedMessage, products, storedSlots, resolvedRoute.slots)
  const mergedSlots = mergeOrderSlots(storedSlots, extractedSlots)
  const currentProduct = getOrderProduct(mergedSlots, products)
  const nextMissingSlot = getNextMissingSlot(mergedSlots, currentProduct, requiredOrderFields)
  const missingSlots = getMissingSlots(mergedSlots, currentProduct, requiredOrderFields)
  const questionIntent = ['product_inquiry', 'product_specific', 'price_inquiry', 'size_inquiry', 'delivery_inquiry', 'payment_inquiry'].includes(resolvedRoute.intent)
  const answeredActiveSlot = Boolean(
    (storedSlots.lastAskedSlot === 'product' && extractedSlots.productName)
    || (storedSlots.lastAskedSlot === 'variant' && extractedSlots.variantNotes)
    || (storedSlots.lastAskedSlot === 'customerName' && extractedSlots.customerName)
    || (storedSlots.lastAskedSlot === 'phone' && extractedSlots.phone)
    || (storedSlots.lastAskedSlot === 'deliveryAddress' && extractedSlots.deliveryAddress),
  )
  const orderRelevant = answeredActiveSlot
    || (storedSlots.phase !== 'browsing' && !questionIntent)
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
          missingSlots: missingSlots.join(','),
          variantName: currentProduct?.variants[0]?.name ?? 'variante',
          acknowledgedValue: extractedSlots.variantNotes ?? extractedSlots.productName ?? extractedSlots.customerName ?? extractedSlots.phone ?? '',
          isFirstMessage: firstMessage ? 'true' : '',
        },
        {
          business,
          products,
          knowledge,
          outputLanguage: language,
        },
      )

      const mediaExtraction = extractedSlots.productName && extractedSlots.productName !== storedSlots.productName
        ? getProductMediaExtraction(currentProduct)
        : {}

      return {
        reply: withFirstGreeting(template ?? fallback, firstMessage, language, business),
        action: null,
        extraction: { intent: 'order_collect', slots: collectingSlots, ...mediaExtraction },
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
        deliveryAddress: confirmingSlots.deliveryAddress ?? '',
        variantNotes: confirmingSlots.variantNotes ?? '',
      },
      {
        business,
        products,
        knowledge,
        outputLanguage: language,
      },
    )

    return {
      reply: withFirstGreeting(template ?? fallback, firstMessage, language, business),
      action: null,
      extraction: { intent: 'order_confirm', slots: confirmingSlots },
      usage: null,
      limitExceeded: false,
    }
  }

  if (mergedSlots.productName || mergedSlots.customerName || mergedSlots.phone) {
    await saveConversationOrderSlots(params.conversationId, mergedSlots)
  }

  if (shouldHandover(resolvedRoute.intent, history, trimmedMessage)) {
    return {
      reply: withFirstGreeting(getLocalizedHandoverReply(language), firstMessage, language, business),
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
      reply: withFirstGreeting(getLocalizedHandoverReply(language, manualVerificationReason), firstMessage, language, business),
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
      knowledge,
      outputLanguage: language,
    },
  )

  if (template) {
    const templateProduct = ['product_specific', 'price_inquiry'].includes(resolvedRoute.intent)
      ? getMatchedSlotProduct(resolvedRoute.slots.productName ?? trimmedMessage, products)
      : null
    const templateProducts = ['product_inquiry', 'product_specific', 'price_inquiry'].includes(resolvedRoute.intent)
      ? getMatchedProducts(resolvedRoute.slots.productName ?? trimmedMessage, products)
      : []
    const mediaExtraction = templateProducts.length > 1 ? getProductsMediaExtraction(templateProducts) : getProductMediaExtraction(templateProduct)

    return {
      reply: withFirstGreeting(template, firstMessage, language, business),
      action: null,
      extraction: { intent: resolvedRoute.intent, slots: resolvedRoute.slots, ...mediaExtraction },
      usage: null,
      limitExceeded: false,
    }
  }

  const fallbackProduct = getOrderProduct(mergedSlots, products)
  const fallbackNextSlot = getNextMissingSlot(mergedSlots, fallbackProduct, requiredOrderFields)
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

  if (parsed.action?.type === 'order_complete' && fallbackNextSlot) {
    const collectingSlots = withNextMissingSlot(mergedSlots, fallbackNextSlot)
    await saveConversationOrderSlots(params.conversationId, collectingSlots)

    const template = getTemplate(
      'order_collect',
      {
        productName: collectingSlots.productName ?? '',
        nextMissingSlot: fallbackNextSlot,
        missingSlots: getMissingSlots(collectingSlots, fallbackProduct, requiredOrderFields).join(','),
        variantName: fallbackProduct?.variants[0]?.name ?? 'variante',
        isFirstMessage: firstMessage ? 'true' : '',
      },
      {
        business,
        products,
        knowledge,
        outputLanguage: language,
      },
    )

    return {
      reply: withFirstGreeting(template ?? fallback, firstMessage, language, business),
      action: null,
      extraction: { intent: 'order_collect', slots: collectingSlots },
      usage,
      limitExceeded: false,
    }
  }

  return {
    ...parsed,
    reply: withFirstGreeting(parsed.reply, firstMessage, language, business),
    usage,
    limitExceeded: false,
  }
}

export function toPrismaJson(value: unknown): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  if (value === null || value === undefined) return Prisma.JsonNull
  return value as Prisma.InputJsonValue
}
