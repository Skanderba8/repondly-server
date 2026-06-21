// Deterministic structured templates for common bot intents.
// Product, delivery, payment, and order facts come only from trusted business context.
import { isTunisianLanguage, type CustomerLanguage } from '@/lib/ai/language'
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

function getMatchingProducts(slots: Record<string, string>, products: ProductPromptRecord[]) {
  const productTokenGroups = products.map((product) => ({ product, tokens: tokenize(product.name) }))
  const rawQueryTokens = tokenize(slots.productName ?? '')
  const queryTokens = rawQueryTokens.filter((token) => productTokenGroups.some((item) => item.tokens.some((productToken) => tokenMatches(token, productToken))))
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

function listProducts(products: ProductPromptRecord[]) {
  if (products.length === 0) return null

  return products.map((product) => {
    const variants = formatVariants(product)
    const variantLine = variants ? ` | Variantes: ${variants}` : ''
    const deliveryLine = Number(product.deliveryFee) > 0 ? ` | Livraison: ${formatAmount(product.deliveryFee)}` : ''
    return `${product.name} | Prix: ${formatAmount(product.price)}${variantLine}${deliveryLine}`
  }).join('\n')
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

function formatVariantOptions(product: ProductPromptRecord | null) {
  if (!product || product.variants.length === 0) return null
  return product.variants
    .map((variant) => `${variant.name}: ${variant.values.join(', ')}`)
    .join(' | ')
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

function formatDelivery(context: BusinessContext, tunisian: boolean) {
  if (!context.knowledge.delivery.enabled) return tunisian ? 'Livraison mech disponible tawa.' : 'La livraison n est pas disponible actuellement.'

  const enabledZones = context.knowledge.delivery.zones.filter((zone) => zone.enabled)
  if (enabledZones.length === 0) {
    return tunisian ? 'Livraison disponible, ama les zones w frais lezim net2akdou menhom.' : 'La livraison est disponible, mais les zones et frais doivent etre confirmes.'
  }

  return enabledZones
    .slice(0, 3)
    .map((zone) => {
      const location = zone.location || (tunisian ? 'zone mech mhadeda' : 'zone non precisee')
      const price = zone.price ? `${zone.price} DT` : (tunisian ? 'frais a confirmer' : 'frais a confirmer')
      return `${location}: ${price}`
    })
    .join(' | ')
}

function formatPayments(context: BusinessContext, tunisian: boolean) {
  const methods = [
    context.knowledge.paymentMethods.cashDelivery ? (tunisian ? 'cash 3and livraison' : 'paiement a la livraison') : null,
    context.knowledge.paymentMethods.onSite ? (tunisian ? 'sur place' : 'paiement sur place') : null,
    context.knowledge.paymentMethods.card ? (tunisian ? 'carte' : 'paiement par carte') : null,
  ].filter(Boolean)

  return methods.length > 0 ? methods.join(', ') : null
}

function formatMissingFields(slots: Record<string, string>, product: ProductPromptRecord | null, tunisian: boolean) {
  const missingSlots = (slots.missingSlots || slots.nextMissingSlot || '').split(',').map((slot) => slot.trim()).filter(Boolean)
  const fields = missingSlots.map((slot) => {
    if (slot === 'product') return tunisian ? 'produit eli t7eb tcommandih' : 'le produit souhaite'
    if (slot === 'variant') {
      const variantName = slots.variantName || product?.variants[0]?.name || 'variante'
      const options = formatVariantOptions(product)
      const label = tunisian ? `${variantName.toLowerCase()} eli t7ebha` : `la ${variantName.toLowerCase()} souhaitee`
      return options ? `${label} (${options})` : label
    }
    if (slot === 'customerName') return tunisian ? 'esm el client' : 'le nom complet'
    if (slot === 'phone') return tunisian ? 'numero telephone' : 'le numero de telephone'
    if (slot === 'deliveryAddress') return tunisian ? 'adresse livraison' : 'l adresse de livraison'
    return null
  }).filter(Boolean)

  if (fields.length === 0) return null
  if (fields.length === 1) return fields[0]
  return `${fields.slice(0, -1).join(', ')} ${tunisian ? 'w' : 'et'} ${fields.at(-1)}`
}

function getOrderQuestion(slots: Record<string, string>, product: ProductPromptRecord | null, tunisian: boolean) {
  const nextMissingSlot = slots.nextMissingSlot
  const firstMessageGreeting = slots.isFirstMessage === 'true'
    ? (tunisian ? 'Ahla, marhbe bik. ' : 'Bonjour, bienvenue. ')
    : ''
  const acknowledged = ''
  const missingFields = formatMissingFields(slots, product, tunisian)

  if (missingFields) {
    return `${firstMessageGreeting}${acknowledged}${tunisian ? `Bech nconfirmi el commande, ab3athli ${missingFields}.` : `Pour confirmer la commande, envoyez-moi ${missingFields}.`}`
  }

  if (nextMissingSlot === 'product') return `${acknowledged}${tunisian ? 'Chnowa t7eb tcommandi?' : 'Quel produit souhaitez-vous commander ?'}`
  if (nextMissingSlot === 'variant') {
    const variantName = slots.variantName || product?.variants[0]?.name || 'variante'
    const options = formatVariantOptions(product)
    const optionLine = options ? ` Options: ${options}.` : ''
    return `${acknowledged}${tunisian ? `Anahi ${variantName.toLowerCase()} t7eb?${optionLine}` : `Quelle ${variantName.toLowerCase()} souhaitez-vous ?${optionLine}`}`
  }
  if (nextMissingSlot === 'customerName') return `${acknowledged}${tunisian ? 'Chnowa esm el client?' : 'Quel est votre nom complet ?'}`
  if (nextMissingSlot === 'phone') return `${acknowledged}${tunisian ? 'Aatini numero telephone mte3ek.' : 'Quel est votre numero de telephone ?'}`
  if (nextMissingSlot === 'deliveryAddress') return `${acknowledged}${tunisian ? 'Aatini adresse livraison.' : 'Quelle est l adresse de livraison ?'}`

  return null
}

function getLocalizedTemplate(intent: string, slots: Record<string, string>, product: ProductPromptRecord | null, products: string | null, context: BusinessContext) {
  const tunisian = isTunisianLanguage(context.outputLanguage)

  if (intent === 'greeting') {
    return tunisian ? `Ahla, marhbe bik chez ${context.business.name}. Kifeh najmou n3awnouk?` : `Bonjour, bienvenue chez ${context.business.name}. Comment puis-je vous aider aujourd hui ?`
  }

  if (intent === 'product_inquiry') {
    if (!products) return null
    return tunisian
      ? `Hedhom les options el mawjoudin:\n${products}\n\nChnouma t7eb menhom?`
      : `Voici les options correspondantes:\n${products}\n\nLequel vous interesse ?`
  }

  if (intent === 'product_specific' || intent === 'price_inquiry') {
    if (products?.includes('\n')) {
      return tunisian
        ? `Hedhom les options eli ymatchiw talabek:\n${products}\n\nChnouma t7eb menhom?`
        : `Voici les options qui correspondent a votre demande:\n${products}\n\nLequel vous interesse ?`
    }

    if (!product) return null
    const description = product.description ? `\n- Details: ${product.description}` : ''
    const variants = formatVariants(product)
    const variantLine = variants ? `\n- Variantes: ${variants}` : ''
    const photoLine = tunisian ? 'Taw nab3athlek photo. Houwa hedha el produit?' : 'Je vous envoie la photo. Est-ce bien le produit souhaite ?'
    return `${product.name}\n- Prix: ${formatAmount(product.price)}${description}${variantLine}\n\n${photoLine}`
  }

  if (intent === 'size_inquiry') {
    const variants = formatVariants(product)
    return variants ? `Variantes disponibles pour ${product?.name}:\n- ${variants}` : null
  }

  if (intent === 'delivery_inquiry') {
    return tunisian ? `Livraison:\n- ${formatDelivery(context, true)}` : `Informations livraison:\n- ${formatDelivery(context, false)}`
  }

  if (intent === 'payment_inquiry') {
    const payments = formatPayments(context, tunisian)
    if (!payments) return null
    return tunisian ? `Tnajjem tkhalles b: ${payments}` : `Modes de paiement disponibles:\n- ${payments}`
  }

  if (intent === 'negotiation') {
    return tunisian
      ? 'Netfahmek. El prix marbout bel qualite w service. Najem n3awnek tal9a option a9reb lel budget mte3ek.'
      : 'Je comprends. Le prix reflete la qualite du produit et le service inclus. Si vous voulez, je peux vous aider a choisir l option la plus adaptee a votre budget.'
  }

  if (intent === 'complaint') {
    return tunisian
      ? 'Smahna 3al souci. Aatini details el probleme w taw norientiwk lel solution.'
      : 'Je suis desole pour ce souci. Donnez-moi le detail du probleme et je vais vous orienter vers la meilleure solution.'
  }

  if (intent === 'order_collect') {
    return getOrderQuestion(slots, product, tunisian)
  }

  if (intent === 'order_confirm') {
    const quantity = Math.max(1, Number(slots.quantity || 1))
    const totals = formatOrderTotal(product, quantity)
    if (!product || !totals) return null

    const variantLine = slots.variantNotes ? `\nVariante: ${slots.variantNotes}` : ''
    const addressLine = slots.deliveryAddress ? `\nAdresse: ${slots.deliveryAddress}` : ''
    const deliveryLine = totals.deliveryLine ? `\n${totals.deliveryLine}` : ''
    const confirmLine = tunisian ? 'Commande haka behya? Ken fama haja nbadlouha 9olli.' : 'Vous confirmez la commande ? Si vous voulez changer quelque chose, dites-moi.'
    return `Votre commande:\n${totals.itemLine}${variantLine}\nNom: ${slots.customerName}\nTelephone: ${slots.phone}${addressLine}${deliveryLine}\n${totals.totalLine}\n\n${confirmLine}`
  }

  if (intent === 'order_start') {
    if (product?.variants.length) {
      return tunisian ? `Ahla, behi. Anahi ${product.variants[0].name.toLowerCase()} t7eb?` : `Bonjour, parfait. Quelle ${product.variants[0].name.toLowerCase()} souhaitez-vous ?`
    }
    return tunisian ? 'Ahla, behi. Chnowa esm el client?' : 'Bonjour, parfait. Quel est votre nom complet ?'
  }

  if (intent === 'order_name') {
    return tunisian ? 'Merci. Aatini numero telephone mte3ek.' : 'Merci. Quel est votre numero de telephone ?'
  }

  if (intent === 'order_phone') {
    return product
      ? (tunisian ? 'Merci. Taw n7adherlek recap commande.' : 'Merci. Je vous prepare le recapitulatif de la commande.')
      : (tunisian ? 'Merci. Chnowa el produit eli t7eb tcommandi?' : 'Merci. Quel produit souhaitez-vous commander ?')
  }

  return null
}

export function getTemplate(intent: string, slots: Record<string, string>, context: BusinessContext): string | null {
  const product = getProduct(slots, context.products)
  const products = listProducts(getMatchingProducts(slots, context.products))

  return getLocalizedTemplate(intent, slots, product, products, context)
}
