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
  if (!context.knowledge.delivery.enabled) return 'التوصيل غير متوفر حاليا.'
  const enabledZones = context.knowledge.delivery.zones.filter((zone) => zone.enabled)
  if (enabledZones.length === 0) return 'التوصيل متوفر، لكن المناطق والرسوم تحتاج إلى تأكيد.'

  return enabledZones
    .slice(0, 3)
    .map((zone) => {
      const location = zone.location || 'منطقة غير محددة'
      const price = zone.price ? `${zone.price} DT` : 'الرسوم تحتاج إلى تأكيد'
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
    context.knowledge.paymentMethods.cashDelivery ? 'الدفع عند الاستلام' : null,
    context.knowledge.paymentMethods.onSite ? 'الدفع في المحل' : null,
    context.knowledge.paymentMethods.card ? 'الدفع بالبطاقة' : null,
  ].filter(Boolean)

  return methods.length > 0 ? methods.join('، ') : null
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

  if (intent === 'order_start') {
    const intro = slots.isFirstMessage === 'true'
      ? 'Bonjour, pour confirmer la commande, pouvez-vous nous envoyer ces informations ?'
      : 'Pour confirmer la commande, pouvez-vous nous envoyer ces informations ?'
    const productLine = product ? `- Produit: ${product.name}` : '- Produit souhaite'
    const variantNames = product?.variants.length ? [...new Set(product.variants.map((variant) => variant.name))] : []
    const variantLines = variantNames.length > 0 ? variantNames.map((name) => `- ${name}`).join('\n') : null
    return `${intro}\n${productLine}\n- Quantite\n- Nom complet\n- Numero de telephone`
      + (variantLines ? `\n${variantLines}` : '')
  }

  if (intent === 'order_name') {
    return 'Merci. Pour finaliser la commande, envoyez aussi:\n- Numero de telephone\n- Produit souhaite\n- Quantite'
  }

  if (intent === 'order_phone') {
    return 'Merci. Pour finaliser la commande, envoyez aussi:\n- Produit souhaite\n- Quantite'
  }

  return null
}

function getArabicTemplate(intent: string, slots: Record<string, string>, product: ProductPromptRecord | null, products: string | null, context: BusinessContext) {
  if (intent === 'greeting') {
    return `مرحبا بك في ${context.business.name}. كيف يمكنني مساعدتك اليوم؟`
  }

  if (intent === 'product_inquiry') {
    if (!products) return null
    return `هذه الخيارات المطابقة: ${products}. يرجى تحديد المنتج الذي يهمك لأرسل لك التفاصيل.`
  }

  if (intent === 'product_specific') {
    if (!product) return null
    const description = product.description ? `\n- التفاصيل: ${product.description}` : ''
    return `${product.name}\n- السعر: ${formatAmount(product.price)}${description}`
  }

  if (intent === 'price_inquiry') {
    if (!product) return null
    return `${product.name}\n- السعر: ${formatAmount(product.price)}\n\nهل تريد تسجيل طلب؟`
  }

  if (intent === 'size_inquiry') {
    const variants = formatVariants(product)
    return variants ? `Variantes disponibles pour ${product?.name}:\n- ${variants}` : null
  }

  if (intent === 'delivery_inquiry') {
    return `معلومات التوصيل:\n- ${formatDeliveryAr(context)}`
  }

  if (intent === 'payment_inquiry') {
    const payments = formatPaymentsAr(context)
    if (!payments) return null
    return `طرق الدفع المتوفرة:\n- ${payments}`
  }

  if (intent === 'order_start') {
    const productLine = product ? `- المنتج: ${product.name}` : '- المنتج المطلوب'
    return `لتأكيد الطلب، يرجى إرسال هذه المعلومات:\n${productLine}\n- الكمية\n- الاسم الكامل\n- رقم الهاتف`
  }

  if (intent === 'order_name') {
    return 'شكرا. لإتمام الطلب، يرجى إرسال:\n- رقم الهاتف\n- المنتج المطلوب\n- الكمية'
  }

  if (intent === 'order_phone') {
    return 'شكرا. لإتمام الطلب، يرجى إرسال:\n- المنتج المطلوب\n- الكمية'
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
