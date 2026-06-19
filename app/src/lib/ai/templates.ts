// Deterministic structured templates for common bot intents.
// French is the default output language; Arabic is used only for pure Arabic-script input.
import { type CustomerLanguage } from '@/lib/ai/language'
import { type KnowledgeConfig, type ProductPromptRecord, type PromptBusiness } from '@/lib/ai/promptBuilder'

export type BusinessContext = {
  business: PromptBusiness
  products: ProductPromptRecord[]
  knowledge: KnowledgeConfig
  outputLanguage: CustomerLanguage
}

function normalize(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\bzarka\b/g, 'bleu')
    .replace(/\bzarg[a-z]*\b/g, 'bleu')
    .replace(/\bbleue\b/g, 'bleu')
}

function tokenize(value: string) {
  return normalize(value)
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
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

function getMatchingProducts(slots: Record<string, string>, products: ProductPromptRecord[]) {
  const queryTokens = tokenize(slots.productName ?? '')
  if (queryTokens.length === 0) return products.slice(0, 4)

  return products
    .filter((product) => {
      const productTokens = tokenize(product.name)
      return queryTokens.every((token) => productTokens.some((productToken) => tokenMatches(token, productToken)))
    })
    .slice(0, 4)
}

function getProduct(slots: Record<string, string>, products: ProductPromptRecord[]) {
  const productName = normalize(slots.productName ?? '')
  if (!productName) return null

  const directMatch = products.find((product) => normalize(product.name) === productName)
  if (directMatch) return directMatch

  return getMatchingProducts(slots, products)[0] ?? null
}

function formatAmount(value: { toFixed: (digits: number) => string }) {
  return `${value.toFixed(2)} DT`
}

function formatOrderTotal(product: ProductPromptRecord | null, quantity: number) {
  if (!product) return null

  const itemsTotal = Number(product.price) * quantity
  const deliveryFee = Number(product.deliveryFee)
  const total = itemsTotal + deliveryFee

  return {
    itemLine: `${quantity} x ${product.name}: ${itemsTotal.toFixed(2)} DT`,
    deliveryLine: deliveryFee > 0 ? `Livraison: ${deliveryFee.toFixed(2)} DT` : null,
    totalLine: `Total: ${total.toFixed(2)} DT`,
  }
}

function getFrenchOrderQuestion(slots: Record<string, string>, product: ProductPromptRecord | null) {
  const nextMissingSlot = slots.nextMissingSlot

  if (nextMissingSlot === 'product') return 'Quel produit souhaitez-vous commander ?'
  if (nextMissingSlot === 'variant') {
    const variantName = slots.variantName || product?.variants[0]?.name || 'variante'
    return `Quelle ${variantName.toLowerCase()} souhaitez-vous ?`
  }
  if (nextMissingSlot === 'customerName') return 'Parfait. Quel est votre nom complet ?'
  if (nextMissingSlot === 'phone') return 'Merci. Quel est votre numero de telephone ?'

  return null
}

function getArabicOrderQuestion(slots: Record<string, string>, product: ProductPromptRecord | null) {
  const nextMissingSlot = slots.nextMissingSlot

  if (nextMissingSlot === 'product') return 'Ù…Ø§ Ø§Ù„Ù…Ù†ØªØ¬ Ø§Ù„Ø°ÙŠ ØªØ±ÙŠØ¯ Ø·Ù„Ø¨Ù‡ØŸ'
  if (nextMissingSlot === 'variant') {
    const variantName = slots.variantName || product?.variants[0]?.name || 'Ø§Ù„Ø®ÙŠØ§Ø±'
    return `Ù…Ø§ ${variantName} Ø§Ù„Ø°ÙŠ ØªØ±ÙŠØ¯Ù‡ØŸ`
  }
  if (nextMissingSlot === 'customerName') return 'ØªÙ…Ø§Ù…. Ù…Ø§ Ø§Ø³Ù…Ùƒ Ø§Ù„ÙƒØ§Ù…Ù„ØŸ'
  if (nextMissingSlot === 'phone') return 'Ø´ÙƒØ±Ø§. Ù…Ø§ Ø±Ù‚Ù… Ù‡Ø§ØªÙÙƒØŸ'

  return null
}

function listProducts(products: ProductPromptRecord[]) {
  const names = products.map((product) => product.name)
  if (names.length === 0) return null
  return names.join(', ')
}

function formatVariants(product: ProductPromptRecord | null) {
  if (!product || product.variants.length === 0) return null

  const grouped = new Map<string, { name: string; values: string[] }>()

  for (const variant of product.variants) {
    const key = variant.name.trim().toLowerCase()
    const existing = grouped.get(key)

    if (existing) {
      existing.values = [...new Set([...existing.values, ...variant.values])]
    } else {
      grouped.set(key, { name: variant.name, values: [...new Set(variant.values)] })
    }
  }

  return Array.from(grouped.values())
    .map((variant) => `${variant.name}: ${variant.values.join(', ')}`)
    .join(' | ')
}

function formatDeliveryFr(context: BusinessContext) {
  if (!context.knowledge.delivery.enabled) return 'La livraison n est pas disponible actuellement.'
  const enabledZones = context.knowledge.delivery.zones.filter((zone) => zone.enabled)
  if (enabledZones.length === 0) return 'La livraison est disponible, mais les zones et frais doivent etre confirmes.'

  return enabledZones
    .slice(0, 3)
    .map((zone) => {
      const location = zone.location || 'zone non precisee'
      const price = zone.price ? `${zone.price} DT` : 'frais a confirmer'
      return `${location}: ${price}`
    })
    .join(' | ')
}

function formatDeliveryAr(context: BusinessContext) {
  if (!context.knowledge.delivery.enabled) return 'Ø§Ù„ØªÙˆØµÙŠÙ„ ØºÙŠØ± Ù…ØªÙˆÙØ± Ø­Ø§Ù„ÙŠØ§.'
  const enabledZones = context.knowledge.delivery.zones.filter((zone) => zone.enabled)
  if (enabledZones.length === 0) return 'Ø§Ù„ØªÙˆØµÙŠÙ„ Ù…ØªÙˆÙØ±ØŒ Ù„ÙƒÙ† Ø§Ù„Ù…Ù†Ø§Ø·Ù‚ ÙˆØ§Ù„Ø±Ø³ÙˆÙ… ØªØ­ØªØ§Ø¬ Ø¥Ù„Ù‰ ØªØ£ÙƒÙŠØ¯.'

  return enabledZones
    .slice(0, 3)
    .map((zone) => {
      const location = zone.location || 'Ù…Ù†Ø·Ù‚Ø© ØºÙŠØ± Ù…Ø­Ø¯Ø¯Ø©'
      const price = zone.price ? `${zone.price} DT` : 'Ø§Ù„Ø±Ø³ÙˆÙ… ØªØ­ØªØ§Ø¬ Ø¥Ù„Ù‰ ØªØ£ÙƒÙŠØ¯'
      return `${location}: ${price}`
    })
    .join(' | ')
}

function formatPaymentsFr(context: BusinessContext) {
  const methods = [
    context.knowledge.paymentMethods.cashDelivery ? 'paiement a la livraison' : null,
    context.knowledge.paymentMethods.onSite ? 'paiement sur place' : null,
    context.knowledge.paymentMethods.card ? 'paiement par carte' : null,
  ].filter(Boolean)

  return methods.length > 0 ? methods.join(', ') : null
}

function formatPaymentsAr(context: BusinessContext) {
  const methods = [
    context.knowledge.paymentMethods.cashDelivery ? 'Ø§Ù„Ø¯ÙØ¹ Ø¹Ù†Ø¯ Ø§Ù„Ø§Ø³ØªÙ„Ø§Ù…' : null,
    context.knowledge.paymentMethods.onSite ? 'Ø§Ù„Ø¯ÙØ¹ ÙÙŠ Ø§Ù„Ù…Ø­Ù„' : null,
    context.knowledge.paymentMethods.card ? 'Ø§Ù„Ø¯ÙØ¹ Ø¨Ø§Ù„Ø¨Ø·Ø§Ù‚Ø©' : null,
  ].filter(Boolean)

  return methods.length > 0 ? methods.join('ØŒ ') : null
}

function getFrenchTemplate(intent: string, slots: Record<string, string>, product: ProductPromptRecord | null, products: string | null, context: BusinessContext) {
  if (intent === 'greeting') {
    return `Bonjour, bienvenue chez ${context.business.name}. Comment puis-je vous aider aujourd hui ?`
  }

  if (intent === 'product_inquiry') {
    if (!products) return null
    return `Voici les options correspondantes: ${products}. Indiquez le produit exact qui vous interesse pour recevoir les details.`
  }

  if (intent === 'product_specific') {
    if (!product) return null
    const description = product.description ? `\n- Details: ${product.description}` : ''
    const variants = formatVariants(product)
    const variantLine = variants ? `\n- Variantes: ${variants}` : ''
    return `${product.name}\n- Prix: ${formatAmount(product.price)}${description}${variantLine}\n\nJe vous envoie la photo. Est-ce bien le produit souhaite ?`
  }

  if (intent === 'price_inquiry') {
    if (!product) return null
    const variants = formatVariants(product)
    const variantLine = variants ? `\n- Variantes: ${variants}` : ''
    return `${product.name}\n- Prix: ${formatAmount(product.price)}${variantLine}\n\nJe vous envoie la photo. Est-ce bien le produit souhaite ?`
  }

  if (intent === 'size_inquiry') {
    const variants = formatVariants(product)
    return variants ? `Variantes disponibles pour ${product?.name}:\n- ${variants}` : null
  }

  if (intent === 'delivery_inquiry') {
    return `Informations livraison:\n- ${formatDeliveryFr(context)}`
  }

  if (intent === 'payment_inquiry') {
    const payments = formatPaymentsFr(context)
    if (!payments) return null
    return `Modes de paiement disponibles:\n- ${payments}`
  }

  if (intent === 'negotiation') {
    return 'Je comprends. Le prix reflete la qualite du produit et le service inclus. Si vous voulez, je peux vous aider a choisir l option la plus adaptee a votre budget.'
  }

  if (intent === 'complaint') {
    return 'Je suis desole pour ce souci. Donnez-moi le detail du probleme et je vais vous orienter vers la meilleure solution.'
  }

  if (intent === 'order_collect') {
    return getFrenchOrderQuestion(slots, product)
  }

  if (intent === 'order_confirm') {
    const quantity = Math.max(1, Number(slots.quantity || 1))
    const totals = formatOrderTotal(product, quantity)
    if (!product || !totals) return null

    const variantLine = slots.variantNotes ? `\nVariante: ${slots.variantNotes}` : ''
    const deliveryLine = totals.deliveryLine ? `\n${totals.deliveryLine}` : ''
    return `Votre commande:\n${totals.itemLine}${variantLine}\nNom: ${slots.customerName}\nTelephone: ${slots.phone}${deliveryLine}\n${totals.totalLine}\n\nConfirmez avec oui ou dites-moi ce que vous voulez changer.`
  }

  if (intent === 'order_start') {
    return product?.variants.length ? `Quelle ${product.variants[0].name.toLowerCase()} souhaitez-vous ?` : 'Parfait. Quel est votre nom complet ?'
  }

  if (intent === 'order_name') {
    return 'Merci. Quel est votre numero de telephone ?'
  }

  if (intent === 'order_phone') {
    return product ? 'Merci. Je vous prepare le recapitulatif de la commande.' : 'Merci. Quel produit souhaitez-vous commander ?'
  }

  return null
}

function getArabicTemplate(intent: string, slots: Record<string, string>, product: ProductPromptRecord | null, products: string | null, context: BusinessContext) {
  if (intent === 'greeting') {
    return `Ù…Ø±Ø­Ø¨Ø§ Ø¨Ùƒ ÙÙŠ ${context.business.name}. ÙƒÙŠÙ ÙŠÙ…ÙƒÙ†Ù†ÙŠ Ù…Ø³Ø§Ø¹Ø¯ØªÙƒ Ø§Ù„ÙŠÙˆÙ…ØŸ`
  }

  if (intent === 'product_inquiry') {
    if (!products) return null
    return `Ù‡Ø°Ù‡ Ø§Ù„Ø®ÙŠØ§Ø±Ø§Øª Ø§Ù„Ù…Ø·Ø§Ø¨Ù‚Ø©: ${products}. ÙŠØ±Ø¬Ù‰ ØªØ­Ø¯ÙŠØ¯ Ø§Ù„Ù…Ù†ØªØ¬ Ø§Ù„Ø°ÙŠ ÙŠÙ‡Ù…Ùƒ Ù„Ø£Ø±Ø³Ù„ Ù„Ùƒ Ø§Ù„ØªÙØ§ØµÙŠÙ„.`
  }

  if (intent === 'product_specific') {
    if (!product) return null
    const description = product.description ? `\n- Ø§Ù„ØªÙØ§ØµÙŠÙ„: ${product.description}` : ''
    return `${product.name}\n- Ø§Ù„Ø³Ø¹Ø±: ${formatAmount(product.price)}${description}`
  }

  if (intent === 'price_inquiry') {
    if (!product) return null
    return `${product.name}\n- Ø§Ù„Ø³Ø¹Ø±: ${formatAmount(product.price)}\n\nÙ‡Ù„ ØªØ±ÙŠØ¯ ØªØ³Ø¬ÙŠÙ„ Ø·Ù„Ø¨ØŸ`
  }

  if (intent === 'size_inquiry') {
    const variants = formatVariants(product)
    return variants ? `Variantes disponibles pour ${product?.name}:\n- ${variants}` : null
  }

  if (intent === 'delivery_inquiry') {
    return `Ù…Ø¹Ù„ÙˆÙ…Ø§Øª Ø§Ù„ØªÙˆØµÙŠÙ„:\n- ${formatDeliveryAr(context)}`
  }

  if (intent === 'payment_inquiry') {
    const payments = formatPaymentsAr(context)
    if (!payments) return null
    return `Ø·Ø±Ù‚ Ø§Ù„Ø¯ÙØ¹ Ø§Ù„Ù…ØªÙˆÙØ±Ø©:\n- ${payments}`
  }

  if (intent === 'negotiation') {
    return 'Je comprends. Le prix reflete la qualite du produit et le service inclus. Je peux vous aider a choisir l option la plus adaptee a votre budget.'
  }

  if (intent === 'complaint') {
    return 'Je suis desole pour ce souci. Donnez-moi le detail du probleme et je vais vous orienter vers la meilleure solution.'
  }

  if (intent === 'order_collect') {
    return getArabicOrderQuestion(slots, product)
  }

  if (intent === 'order_confirm') {
    const quantity = Math.max(1, Number(slots.quantity || 1))
    const totals = formatOrderTotal(product, quantity)
    if (!product || !totals) return null

    const variantLine = slots.variantNotes ? `\nVariante: ${slots.variantNotes}` : ''
    const deliveryLine = totals.deliveryLine ? `\n${totals.deliveryLine}` : ''
    return `Votre commande:\n${totals.itemLine}${variantLine}\nNom: ${slots.customerName}\nTelephone: ${slots.phone}${deliveryLine}\n${totals.totalLine}\n\nConfirmez avec oui ou dites-moi ce que vous voulez changer.`
  }

  if (intent === 'order_start') {
    const productLine = product ? `- Ø§Ù„Ù…Ù†ØªØ¬: ${product.name}` : '- Ø§Ù„Ù…Ù†ØªØ¬ Ø§Ù„Ù…Ø·Ù„ÙˆØ¨'
    return `Ù„ØªØ£ÙƒÙŠØ¯ Ø§Ù„Ø·Ù„Ø¨ØŒ ÙŠØ±Ø¬Ù‰ Ø¥Ø±Ø³Ø§Ù„ Ù‡Ø°Ù‡ Ø§Ù„Ù…Ø¹Ù„ÙˆÙ…Ø§Øª:\n${productLine}\n- Ø§Ù„ÙƒÙ…ÙŠØ©\n- Ø§Ù„Ø§Ø³Ù… Ø§Ù„ÙƒØ§Ù…Ù„\n- Ø±Ù‚Ù… Ø§Ù„Ù‡Ø§ØªÙ`
  }

  if (intent === 'order_name') {
    return 'Ø´ÙƒØ±Ø§. Ù„Ø¥ØªÙ…Ø§Ù… Ø§Ù„Ø·Ù„Ø¨ØŒ ÙŠØ±Ø¬Ù‰ Ø¥Ø±Ø³Ø§Ù„:\n- Ø±Ù‚Ù… Ø§Ù„Ù‡Ø§ØªÙ\n- Ø§Ù„Ù…Ù†ØªØ¬ Ø§Ù„Ù…Ø·Ù„ÙˆØ¨\n- Ø§Ù„ÙƒÙ…ÙŠØ©'
  }

  if (intent === 'order_phone') {
    return 'Ø´ÙƒØ±Ø§. Ù„Ø¥ØªÙ…Ø§Ù… Ø§Ù„Ø·Ù„Ø¨ØŒ ÙŠØ±Ø¬Ù‰ Ø¥Ø±Ø³Ø§Ù„:\n- Ø§Ù„Ù…Ù†ØªØ¬ Ø§Ù„Ù…Ø·Ù„ÙˆØ¨\n- Ø§Ù„ÙƒÙ…ÙŠØ©'
  }

  return null
}

export function getTemplate(intent: string, slots: Record<string, string>, context: BusinessContext): string | null {
  const product = getProduct(slots, context.products)
  const products = listProducts(getMatchingProducts(slots, context.products))

  if (context.outputLanguage === 'AR') {
    return getArabicTemplate(intent, slots, product, products, context)
  }

  return getFrenchTemplate(intent, slots, product, products, context)
}
