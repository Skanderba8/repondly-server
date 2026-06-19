import { type AiChatMessage } from '@/lib/ai/config'
import { type ProductPromptRecord } from '@/lib/ai/promptBuilder'

export type OrderPhase = 'browsing' | 'collecting' | 'confirming' | 'done'

export type OrderSlotKey = 'product' | 'variant' | 'customerName' | 'phone'

export type OrderSlots = {
  phase: OrderPhase
  productName: string | null
  variantNotes: string | null
  quantity: number
  customerName: string | null
  phone: string | null
  deliveryAddress: string | null
  confirmedAt: string | null
  lastAskedSlot: OrderSlotKey | null
  summaryShownAt: string | null
}

const DEFAULT_ORDER_SLOTS: OrderSlots = {
  phase: 'browsing',
  productName: null,
  variantNotes: null,
  quantity: 1,
  customerName: null,
  phone: null,
  deliveryAddress: null,
  confirmedAt: null,
  lastAskedSlot: null,
  summaryShownAt: null,
}

const CONFIRMATION_PATTERN = /^(oui|yes|ey|ay|eh|ok|daccord|behi|tamam|na3am|نعم|تمام)$/i

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function normalizeText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\bzarka\b/g, 'bleu')
    .replace(/\bzarg[a-z]*\b/g, 'bleu')
    .replace(/\bbleue\b/g, 'bleu')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
}

function isConfirmationText(value: string) {
  const trimmed = value.trim()
  if (trimmed === '✅') return true
  return CONFIRMATION_PATTERN.test(normalizeText(trimmed).replace(/\s+/g, ''))
}

function normalizeProductText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\bbleue\b/g, 'bleu')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
}

function contextTokens(value: string) {
  return normalizeText(value)
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

function normalizeNullableString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function normalizeQuantity(value: unknown) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 1
  return Math.max(1, Math.min(99, Math.floor(value)))
}

export function normalizeOrderSlots(value: unknown): OrderSlots {
  if (!isRecord(value)) return { ...DEFAULT_ORDER_SLOTS }

  const phase = value.phase === 'collecting' || value.phase === 'confirming' || value.phase === 'done'
    ? value.phase
    : 'browsing'

  const lastAskedSlot = value.lastAskedSlot === 'product'
    || value.lastAskedSlot === 'variant'
    || value.lastAskedSlot === 'customerName'
    || value.lastAskedSlot === 'phone'
    ? value.lastAskedSlot
    : null

  return {
    phase,
    productName: normalizeNullableString(value.productName),
    variantNotes: normalizeNullableString(value.variantNotes),
    quantity: normalizeQuantity(value.quantity),
    customerName: normalizeNullableString(value.customerName),
    phone: normalizeNullableString(value.phone),
    deliveryAddress: normalizeNullableString(value.deliveryAddress),
    confirmedAt: normalizeNullableString(value.confirmedAt),
    lastAskedSlot,
    summaryShownAt: normalizeNullableString(value.summaryShownAt),
  }
}

export function extractPhone(text: string) {
  const match = text.match(/(?:\+?216[\s.-]?)?([24579]\d[\s.-]?\d{3}[\s.-]?\d{3})\b/)
  return match ? match[0].replace(/[^\d+]/g, '') : null
}

export function extractQuantity(text: string, phone: string | null) {
  const withoutPhone = phone ? text.replace(/(?:\+?216[\s.-]?)?[24579]\d[\s.-]?\d{3}[\s.-]?\d{3}\b/, ' ') : text
  const match = withoutPhone.match(/\b([1-9]\d?)\b/)
  return match ? Number(match[1]) : null
}

export function findProductMention(text: string, products: Array<{ name: string }>) {
  const exact = findExactProductMention(text, products)
  if (exact) return exact

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

export function findExactProductMention(text: string, products: Array<{ name: string }>) {
  const normalized = ` ${normalizeProductText(text).replace(/\s+/g, ' ')} `
  return products.find((product) => normalized.includes(` ${normalizeProductText(product.name).replace(/\s+/g, ' ')} `))?.name ?? null
}

export function getMatchedProduct<T extends { name: string }>(text: string, products: T[]) {
  const productName = findProductMention(text, products)
  return productName ? products.find((product) => product.name === productName) ?? null : null
}

export function getLastMentionedProduct(history: AiChatMessage[], products: Array<{ name: string }>) {
  for (const message of [...history].reverse()) {
    const productName = findProductMention(message.content, products)
    if (productName) return productName
  }

  return null
}

export function extractVariantNotes(message: string, product: ProductPromptRecord | null) {
  if (!product || product.variants.length === 0) return null

  const normalizedMessage = normalizeProductText(message)
  const messageTokens = new Set(normalizedMessage.split(/\s+/).filter(Boolean))
  const selections = product.variants.flatMap((variant) => {
    const selectedValue = variant.values.find((value) => {
      const normalizedValue = normalizeProductText(value)
      return normalizedValue.length <= 2 ? messageTokens.has(normalizedValue) : normalizedMessage.includes(normalizedValue)
    })
    return selectedValue ? [`${variant.name}: ${selectedValue}`] : []
  })

  return selections.length === product.variants.length ? selections.join(', ') : null
}

function extractCustomerName(message: string, slots: OrderSlots) {
  const trimmed = message.trim()
  const normalized = normalizeText(trimmed)
  if (!trimmed || isConfirmationText(trimmed)) return null
  if (extractPhone(trimmed)) return null

  const explicit = trimmed.match(/\b(?:je suis|moi c est|moi c'est|mon nom est|je m appelle|je m'appelle|ism[iy]|ismi)\s+([\p{L}\s'-]{2,60})/iu)
  if (explicit?.[1]) return explicit[1].trim()

  if (slots.lastAskedSlot !== 'customerName') return null
  if (/\b(prix|livraison|taille|couleur|photo|combien|9adeh|ch7al|commande|commander|acheter)\b/i.test(normalized)) return null
  if (!/^[\p{L}\s'-]{2,60}$/u.test(trimmed)) return null

  return trimmed
}

export function extractOrderSlots(
  message: string,
  products: ProductPromptRecord[],
  currentSlots: OrderSlots,
  routedSlots: { productName?: string; quantity?: string; size?: string } = {},
) {
  const phone = extractPhone(message)
  const routedProductName = routedSlots.productName
    ? findProductMention(routedSlots.productName, products) ?? routedSlots.productName
    : null
  const productName = findProductMention(message, products) ?? routedProductName
  const product = productName
    ? products.find((item) => item.name === productName) ?? null
    : currentSlots.productName
      ? products.find((item) => item.name === currentSlots.productName) ?? null
      : null
  const variantNotes = extractVariantNotes(message, product)
  const explicitQuantity = extractQuantity(routedSlots.quantity ?? message, phone)
  const customerName = extractCustomerName(message, currentSlots)

  return {
    productName,
    variantNotes,
    quantity: explicitQuantity,
    customerName,
    phone,
  }
}

export function mergeOrderSlots(current: OrderSlots, extracted: ReturnType<typeof extractOrderSlots>): OrderSlots {
  const next: OrderSlots = {
    ...current,
    productName: extracted.productName ?? current.productName,
    variantNotes: extracted.variantNotes ?? current.variantNotes,
    quantity: extracted.quantity ?? current.quantity,
    customerName: extracted.customerName ?? current.customerName,
    phone: extracted.phone ?? current.phone,
  }

  if (next.phase === 'browsing' && (next.productName || next.customerName || next.phone)) {
    next.phase = 'collecting'
  }

  return next
}

export function getNextMissingSlot(slots: OrderSlots, product: ProductPromptRecord | null): OrderSlotKey | null {
  if (!slots.productName) return 'product'
  if (product?.variants.length && !slots.variantNotes) return 'variant'
  if (!slots.customerName) return 'customerName'
  if (!slots.phone) return 'phone'
  return null
}

export function isExplicitOrderConfirmation(message: string, slots: OrderSlots) {
  if (slots.phase !== 'confirming' || !slots.summaryShownAt) return false
  return isConfirmationText(message)
}

export function isOrderSignal(message: string, intent: string) {
  const normalized = normalizeText(message)
  return intent === 'order_start'
    || intent === 'order_name'
    || intent === 'order_phone'
    || /\b(commande|commander|order|acheter|passer|reserve|reserver|prendre)\b/.test(normalized)
}

export function hasRepeatedComplaint(history: AiChatMessage[], latestMessage: string) {
  const complaintPattern = /\b(reclamation|plainte|probleme|remboursement|retour|pas content|fache|arnaque|defaut|cass|retard)\b/i
  const latestIsComplaint = complaintPattern.test(normalizeText(latestMessage))
  if (!latestIsComplaint) return false

  return history
    .filter((message) => message.role === 'user')
    .slice(-6)
    .some((message) => complaintPattern.test(normalizeText(message.content)))
}

export function getOrderProduct(slots: OrderSlots, products: ProductPromptRecord[]) {
  return slots.productName ? products.find((product) => product.name === slots.productName) ?? null : null
}

export function withNextMissingSlot(slots: OrderSlots, nextMissingSlot: OrderSlotKey | null): OrderSlots {
  return {
    ...slots,
    lastAskedSlot: nextMissingSlot,
    phase: nextMissingSlot ? 'collecting' : slots.phase,
  }
}

export function withSummaryShown(slots: OrderSlots) {
  return {
    ...slots,
    phase: 'confirming' as const,
    lastAskedSlot: null,
    summaryShownAt: new Date().toISOString(),
  }
}
