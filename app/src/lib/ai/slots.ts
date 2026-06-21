import { type AiChatMessage } from '@/lib/ai/config'
import { type OrderFieldKey, type ProductPromptRecord } from '@/lib/ai/promptBuilder'

export type OrderPhase = 'browsing' | 'collecting' | 'confirming' | 'done'
export type OrderSlotKey = 'product' | 'variant' | 'customerName' | 'phone' | 'deliveryAddress'

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

const PHONE_PATTERN = /(?:\+?216[\s.-]?)?\d(?:[\s.-]?\d){5,11}\b/
const CONFIRMATION_PATTERN = /^(oui|yes|ey|ay|eh|ok|daccord|behi|sahha|tamam|na3am|confirmi|confirm)$/i
const ADDRESS_PATTERN = /\b(rue|avenue|av|cite|route|residence|immeuble|etage|appartement|app|bloc|tunis|ariana|marsa|sousse|sfax|nabeul|ben arous|bizerte|manouba|kram|lac|menzah|manar|mourouj|charguia|ghazela|jardin|centre ville)\b/i

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

function normalizeProductText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\bbleue\b/g, 'bleu')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
}

function isConfirmationText(value: string) {
  return CONFIRMATION_PATTERN.test(normalizeText(value).replace(/\s+/g, ''))
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
    || value.lastAskedSlot === 'deliveryAddress'
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
  const match = text.match(PHONE_PATTERN)
  return match ? match[0].replace(/[^\d+]/g, '') : null
}

export function extractQuantity(text: string, phone: string | null) {
  const withoutPhone = phone ? text.replace(PHONE_PATTERN, ' ') : text
  const match = withoutPhone.match(/(?:\b(?:quantite|quantité|qty|qte|x|fois|pieces|pièces|pcs|unit[eé]s?|nheb|je veux|je prends|prendre|commander|commande)\s+|\b)([1-9]\d?)\s*(?:x|fois|pieces|pièces|pcs|unit[eé]s?)\b/i)
  return match ? Number(match[1]) : null
}

function contextTokens(value: string) {
  return normalizeText(value)
    .split(/\s+/)
    .map((token) => token.replace(/s$/, ''))
    .filter((token) => token.length > 1)
}

function tokenMatches(queryToken: string, productToken: string) {
  if (productToken.includes(queryToken) || queryToken.includes(productToken)) return true
  if (canonicalProductToken(queryToken) === canonicalProductToken(productToken)) return true
  if (queryToken.length > 4 && queryToken.startsWith('l')) {
    const withoutArticle = queryToken.slice(1)
    return productToken.includes(withoutArticle) || withoutArticle.includes(productToken)
  }

  return false
}

function canonicalProductToken(value: string) {
  return value
    .replace(/ou/g, 'o')
    .replace(/[ae]$/i, '')
}

export function findExactProductMention(text: string, products: Array<{ name: string }>) {
  const normalized = ` ${normalizeProductText(text).replace(/\s+/g, ' ')} `
  return [...products]
    .sort((a, b) => normalizeProductText(b.name).length - normalizeProductText(a.name).length)
    .find((product) => normalized.includes(` ${normalizeProductText(product.name).replace(/\s+/g, ' ')} `))?.name ?? null
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

  return selections.length > 0 ? selections.join(', ') : null
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function stripMatchedProductName(value: string, productName: string | null) {
  if (!productName) return value

  const productTokens = normalizeProductText(productName).split(/\s+/).filter(Boolean)
  if (productTokens.length === 0) return value

  const words = value.trim().split(/\s+/)
  const remaining = words.filter((word) => !productTokens.includes(normalizeProductText(word)))
  return remaining.join(' ').trim()
}

function stripKnownOrderParts(value: string, productName: string | null, customerName: string | null, phone: string | null, variantNotes: string | null) {
  let next = value
  if (phone) next = next.replace(PHONE_PATTERN, ' ')
  if (productName) next = stripMatchedProductName(next, productName)
  if (customerName) {
    for (const token of customerName.split(/\s+/).filter(Boolean)) {
      next = next.replace(new RegExp(`\\b${escapeRegExp(token)}\\b`, 'i'), ' ')
    }
  }
  if (variantNotes) {
    const [, valuePart] = variantNotes.split(':')
    if (valuePart?.trim()) next = next.replace(new RegExp(`\\b${escapeRegExp(valuePart.trim())}\\b`, 'i'), ' ')
  }

  return next.replace(/\s+/g, ' ').trim()
}

function extractCustomerName(message: string, slots: OrderSlots, productName: string | null) {
  const phoneMatch = message.match(PHONE_PATTERN)
  const beforePhone = phoneMatch?.index !== undefined ? message.slice(0, phoneMatch.index) : message
  const afterPhone = phoneMatch?.index !== undefined ? message.slice(phoneMatch.index + phoneMatch[0].length) : ''
  const source = beforePhone.trim() || extractNameFromAddressTail(afterPhone) || (slots.lastAskedSlot === 'customerName' ? afterPhone : message)
  const trimmed = stripMatchedProductName(source, productName).trim()
  const normalized = normalizeText(trimmed)
  if (!trimmed || isConfirmationText(trimmed)) return null
  if (productName && !phoneMatch) return null

  const explicit = trimmed.match(/\b(?:je suis|moi c est|moi c'est|mon nom est|je m appelle|je m'appelle|ism[iy]|ismi|esmi|ena)\s+([\p{L}\s'-]{2,60})/iu)
  if (explicit?.[1]) return explicit[1].trim()

  if (slots.lastAskedSlot !== 'customerName' && !phoneMatch) return null
  if (/\b(prix|livraison|taille|couleur|photo|combien|9adeh|ch7al|chniya|chnowa|fama|souma|soum|commande|commander|ncommandi|acheter|nheb|n7eb)\b/i.test(normalized)) return null
  if (!/^[\p{L}\s'-]{2,60}$/u.test(trimmed)) return null

  return trimmed
}

function extractNameFromAddressTail(value: string) {
  const words = value.trim().split(/\s+/).filter(Boolean)
  if (words.length < 5 || !ADDRESS_PATTERN.test(value)) return null

  const tail = words.slice(-3).join(' ')
  return /^[\p{L}\s'-]{5,60}$/u.test(tail) ? tail : null
}

function extractDeliveryAddress(message: string, slots: OrderSlots, productName: string | null, customerName: string | null, phone: string | null, variantNotes: string | null) {
  const phoneMatch = message.match(PHONE_PATTERN)
  const afterPhone = phoneMatch?.index !== undefined ? message.slice(phoneMatch.index + phoneMatch[0].length).trim() : ''
  const candidate = afterPhone
    ? stripKnownOrderParts(afterPhone, productName, customerName, null, variantNotes)
    : stripKnownOrderParts(message, productName, customerName, phone, variantNotes)

  if (!candidate) return null
  if (slots.lastAskedSlot === 'deliveryAddress') return candidate
  if (afterPhone && /[\p{L}]/u.test(candidate) && (/\d/.test(candidate) || candidate.split(/\s+/).filter(Boolean).length >= 2)) return candidate
  if (ADDRESS_PATTERN.test(candidate)) return candidate

  return null
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
  const explicitQuantity = currentSlots.lastAskedSlot === 'deliveryAddress'
    ? null
    : extractQuantity(routedSlots.quantity ?? message, phone)
  const customerName = extractCustomerName(message, currentSlots, productName ?? currentSlots.productName)
  const deliveryAddress = extractDeliveryAddress(
    message,
    currentSlots,
    productName ?? currentSlots.productName,
    customerName ?? currentSlots.customerName,
    phone ?? currentSlots.phone,
    variantNotes ?? currentSlots.variantNotes,
  )

  return {
    productName,
    variantNotes,
    quantity: explicitQuantity,
    customerName,
    phone,
    deliveryAddress,
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
    deliveryAddress: extracted.deliveryAddress ?? current.deliveryAddress,
  }

  if (next.phase === 'browsing' && (next.productName || next.customerName || next.phone || next.deliveryAddress)) {
    next.phase = 'collecting'
  }

  return next
}

export function getMissingSlots(slots: OrderSlots, product: ProductPromptRecord | null, requiredFields: OrderFieldKey[] = ['productOrService', 'name', 'phone', ...(product?.variants.length ? ['variant' as const] : [])]): OrderSlotKey[] {
  return [
    requiredFields.includes('productOrService') && !slots.productName ? 'product' : null,
    requiredFields.includes('variant') && product?.variants.length && !slots.variantNotes ? 'variant' : null,
    requiredFields.includes('name') && !slots.customerName ? 'customerName' : null,
    requiredFields.includes('phone') && !slots.phone ? 'phone' : null,
    requiredFields.includes('deliveryAddress') && !slots.deliveryAddress ? 'deliveryAddress' : null,
  ].filter((slot): slot is OrderSlotKey => Boolean(slot))
}

export function getNextMissingSlot(slots: OrderSlots, product: ProductPromptRecord | null, requiredFields?: OrderFieldKey[]): OrderSlotKey | null {
  return getMissingSlots(slots, product, requiredFields)[0] ?? null
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
    || /\b(commande|commander|ncommandi|commandi|order|acheter|passer|reserve|reserver|prendre|nheb|n7eb|nekhou|ne5ou)\b/.test(normalized)
}

export function hasRepeatedComplaint(history: AiChatMessage[], latestMessage: string) {
  const complaintPattern = /\b(reclamation|plainte|probleme|mochkla|moshkel|remboursement|retour|pas content|fache|za3fan|ghalet|arnaque|defaut|cass|retard|t3attlet)\b/i
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
