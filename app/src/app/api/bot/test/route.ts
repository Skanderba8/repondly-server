import { Prisma } from '@prisma/client'
import { NextResponse } from 'next/server'
import { requireBusinessApiSession } from '@/lib/auth'
import { mapOrder } from '@/lib/orders'
import { prisma } from '@/lib/prisma'

type ChatRole = 'user' | 'assistant' | 'system'

type ChatMessage = {
  role: ChatRole
  content: string
}

type BotTestBody = {
  message?: string
  history?: ChatMessage[]
}

type BusinessDay = {
  label: string
  open: boolean
  from: string
  to: string
}

type DeliveryZone = {
  location: string
  enabled: boolean
  price: string
  condition: string
}

type ExtraFaqItem = {
  question: string
  answer: string
}

type OrderFieldKey = 'productOrService' | 'name' | 'phone' | 'email' | 'deliveryAddress' | 'preferredDate' | 'notes'

type KnowledgeConfig = {
  version: 2
  businessHours: BusinessDay[]
  delivery: {
    enabled: boolean
    zones: DeliveryZone[]
  }
  paymentMethods: {
    cashDelivery: boolean
    onSite: boolean
    card: boolean
  }
  boutiqueAddress: string
  deliveryDelay: string
  policies: {
    cancellation: boolean
    cancellationCondition: string
    modification: boolean
    modificationCondition: string
    return: boolean
    returnCondition: string
  }
  handoffEnabled: boolean
  botScheduleWeekend: boolean
  orderCapture: {
    enabled: boolean
    requiredFields: OrderFieldKey[]
    optionalFields: OrderFieldKey[]
    customFields: string[]
  }
  extraFaq: ExtraFaqItem[]
}

type GroqChoice = {
  message?: {
    content?: string
  }
}

type GroqResponse = {
  choices?: GroqChoice[]
}

type ProductPromptRecord = {
  type: string
  name: string
  description: string | null
  price: Prisma.Decimal
  deliveryFee: Prisma.Decimal
  stock: number | null
  fournisseur: string | null
  images: Array<{
    id: string
    mimeType: string
    position: number
  }>
}

type BotOrderItem = {
  productName?: string
  quantity?: number
  unitPrice?: number
}

type BotOrderAction = {
  type?: string
  customerName?: string
  phone?: string
  email?: string
  deliveryAddress?: string
  preferredDate?: string
  notes?: string
  items?: BotOrderItem[]
}

type BotModelPayload = {
  reply?: string
  action?: BotOrderAction | null
}

const DEFAULT_KNOWLEDGE: KnowledgeConfig = {
  version: 2,
  businessHours: [],
  delivery: {
    enabled: false,
    zones: [],
  },
  paymentMethods: {
    cashDelivery: false,
    onSite: false,
    card: false,
  },
  boutiqueAddress: '',
  deliveryDelay: '',
  policies: {
    cancellation: false,
    cancellationCondition: '',
    modification: false,
    modificationCondition: '',
    return: false,
    returnCondition: '',
  },
  handoffEnabled: true,
  botScheduleWeekend: true,
  orderCapture: {
    enabled: true,
    requiredFields: ['productOrService', 'name', 'phone'],
    optionalFields: ['email', 'deliveryAddress', 'preferredDate', 'notes'],
    customFields: [],
  },
  extraFaq: [],
}

const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX_REQUESTS = 8
const MAX_USER_MESSAGE_CHARS = 900
const MAX_HISTORY_MESSAGE_CHARS = 600
const MAX_SYSTEM_PROMPT_CHARS = 12_000
const TEST_CONTACT_EXTERNAL_ID_PREFIX = 'bot-test'

const requestBuckets = new Map<string, number[]>()

const orderFieldLabels: Record<OrderFieldKey, string> = {
  productOrService: 'produit ou service souhaite',
  name: 'nom complet',
  phone: 'telephone',
  email: 'email',
  deliveryAddress: 'adresse de livraison',
  preferredDate: 'date ou horaire prefere',
  notes: 'remarques ou conditions speciales',
}

const businessTypeLabels: Record<string, string> = {
  clinic: 'clinique',
  salon: 'salon de beaute',
  ecom: 'e-commerce',
  garage: 'garage',
  restaurant: 'restaurant',
  cafe: 'cafe',
  real_estate: 'immobilier',
  training: 'formation',
  travel: 'agence de voyage',
  fitness: 'sport et fitness',
  home_services: 'services a domicile',
  events: 'evenementiel',
  professional_services: 'services professionnels',
}

function isChatMessage(message: ChatMessage) {
  return ['user', 'assistant', 'system'].includes(message.role) && Boolean(message.content?.trim())
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function truncateText(value: string, limit: number) {
  return value.length > limit ? `${value.slice(0, limit).trim()}...` : value
}

function formatBusinessType(value: string | null) {
  const trimmed = value?.trim()

  if (!trimmed) {
    return 'activite non renseignee'
  }

  return businessTypeLabels[trimmed] ?? trimmed
}

function checkRateLimit(key: string) {
  const now = Date.now()
  const current = requestBuckets.get(key)?.filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS) ?? []

  if (current.length >= RATE_LIMIT_MAX_REQUESTS) {
    requestBuckets.set(key, current)
    return false
  }

  requestBuckets.set(key, [...current, now])
  return true
}

function isExtraFaqItem(value: unknown): value is ExtraFaqItem {
  return isRecord(value) && typeof value.question === 'string' && typeof value.answer === 'string'
}

function parseLegacyFaq(value: unknown): ExtraFaqItem[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .filter(isExtraFaqItem)
    .map((item) => ({
      question: item.question.trim(),
      answer: item.answer.trim(),
    }))
    .filter((item) => item.question || item.answer)
}

function parseOrderFields(value: unknown, fallback: OrderFieldKey[]) {
  if (!Array.isArray(value)) {
    return fallback
  }

  return value.filter((item): item is OrderFieldKey => typeof item === 'string' && item in orderFieldLabels)
}

function parseKnowledgeConfig(value?: string | null): KnowledgeConfig {
  const trimmed = value?.trim()

  if (!trimmed) {
    return DEFAULT_KNOWLEDGE
  }

  try {
    const parsed = JSON.parse(trimmed) as unknown

    if (isRecord(parsed) && parsed.version === 2) {
      return {
        ...DEFAULT_KNOWLEDGE,
        ...parsed,
        delivery: isRecord(parsed.delivery)
          ? {
              enabled: typeof parsed.delivery.enabled === 'boolean' ? parsed.delivery.enabled : false,
              zones: Array.isArray(parsed.delivery.zones) ? parsed.delivery.zones as DeliveryZone[] : [],
            }
          : DEFAULT_KNOWLEDGE.delivery,
        paymentMethods: isRecord(parsed.paymentMethods) ? { ...DEFAULT_KNOWLEDGE.paymentMethods, ...parsed.paymentMethods } : DEFAULT_KNOWLEDGE.paymentMethods,
        policies: isRecord(parsed.policies) ? { ...DEFAULT_KNOWLEDGE.policies, ...parsed.policies } : DEFAULT_KNOWLEDGE.policies,
        businessHours: Array.isArray(parsed.businessHours) ? parsed.businessHours as BusinessDay[] : [],
        orderCapture: isRecord(parsed.orderCapture)
          ? {
              enabled: typeof parsed.orderCapture.enabled === 'boolean' ? parsed.orderCapture.enabled : DEFAULT_KNOWLEDGE.orderCapture.enabled,
              requiredFields: parseOrderFields(parsed.orderCapture.requiredFields, DEFAULT_KNOWLEDGE.orderCapture.requiredFields),
              optionalFields: parseOrderFields(parsed.orderCapture.optionalFields, DEFAULT_KNOWLEDGE.orderCapture.optionalFields),
              customFields: Array.isArray(parsed.orderCapture.customFields)
                ? parsed.orderCapture.customFields.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean)
                : [],
            }
          : DEFAULT_KNOWLEDGE.orderCapture,
        extraFaq: parseLegacyFaq(parsed.extraFaq),
      }
    }

    const legacyFaq = parseLegacyFaq(parsed)
    if (legacyFaq.length > 0) {
      return { ...DEFAULT_KNOWLEDGE, extraFaq: legacyFaq }
    }
  } catch {}

  return { ...DEFAULT_KNOWLEDGE, extraFaq: [{ question: 'Informations generales', answer: trimmed }] }
}

function formatBusinessHours(days: BusinessDay[]) {
  if (days.length === 0) {
    return 'Horaires boutique non renseignes.'
  }

  return days
    .map((day) => `${day.label}: ${day.open ? `${day.from || 'heure non renseignee'} a ${day.to || 'heure non renseignee'}` : 'ferme'}`)
    .join('\n')
}

function formatDelivery(config: KnowledgeConfig) {
  if (!config.delivery.enabled) {
    return 'Livraison: non disponible.'
  }

  if (config.delivery.zones.length === 0) {
    return 'Livraison: disponible, zones et frais non renseignes.'
  }

  return config.delivery.zones
    .map((zone) => {
      if (!zone.enabled) {
        return `${zone.location || 'Zone non renseignee'}: pas de livraison.`
      }

      const price = zone.price ? `${zone.price} DT` : 'prix non renseigne'
      const condition = zone.condition ? `, condition: ${zone.condition}` : ''

      return `${zone.location || 'Zone non renseignee'}: livraison ${price}${condition}.`
    })
    .join('\n')
}

function formatPayments(config: KnowledgeConfig) {
  const methods = [
    config.paymentMethods.cashDelivery ? 'cash a la livraison' : null,
    config.paymentMethods.onSite ? 'sur place' : null,
    config.paymentMethods.card ? 'carte' : null,
  ].filter(Boolean)

  return methods.length > 0 ? methods.join(', ') : 'Modes de paiement non renseignes.'
}

function formatPolicies(config: KnowledgeConfig) {
  const policies = config.policies

  return [
    `Annulation: ${policies.cancellation ? 'oui' : 'non'}${policies.cancellationCondition ? `, condition: ${policies.cancellationCondition}` : ''}.`,
    `Modification: ${policies.modification ? 'oui' : 'non'}${policies.modificationCondition ? `, condition: ${policies.modificationCondition}` : ''}.`,
    `Retour: ${policies.return ? 'oui' : 'non'}${policies.returnCondition ? `, condition: ${policies.returnCondition}` : ''}.`,
  ].join('\n')
}

function formatExtraFaq(items: ExtraFaqItem[]) {
  if (items.length === 0) {
    return 'Aucune question supplementaire.'
  }

  return items
    .map((item, index) => `${index + 1}. Q: ${item.question || 'Sans question'}\nR: ${item.answer || 'Sans reponse'}`)
    .join('\n\n')
}

function formatProduct(product: ProductPromptRecord) {
  const parts = [
    `Type: ${product.type === 'SERVICE' ? 'service' : 'produit'}`,
    `Nom: ${product.name}`,
    product.description ? `Description: ${truncateText(product.description, 180)}` : null,
    `Prix: ${product.price.toFixed(2)} DT`,
    product.type === 'SERVICE' ? null : `Livraison produit: ${product.deliveryFee.toFixed(2)} DT`,
    product.type === 'SERVICE' ? null : product.stock === null ? 'Stock: non renseigne' : `Stock: ${product.stock}`,
    product.fournisseur ? `Fournisseur: ${product.fournisseur}` : null,
    product.images.length > 0 ? `Photos disponibles: ${product.images.length}` : null,
  ].filter(Boolean)

  return parts.join(' | ')
}

function formatProducts(products: ProductPromptRecord[]) {
  if (products.length === 0) {
    return 'Aucun produit actif trouve.'
  }

  return products.map((product, index) => `${index + 1}. ${formatProduct(product)}`).join('\n')
}

function formatOrderCapture(config: KnowledgeConfig) {
  if (!config.orderCapture.enabled) {
    return 'Capture commande: inactive. Ne cree jamais de commande.'
  }

  const required = config.orderCapture.requiredFields.map((field) => orderFieldLabels[field] ?? field)
  const optional = config.orderCapture.optionalFields.map((field) => orderFieldLabels[field] ?? field)
  const custom = config.orderCapture.customFields.map((field) => field.trim()).filter(Boolean)

  return [
    'Capture commande: active.',
    `Champs obligatoires: ${required.length > 0 ? required.join(', ') : 'aucun champ obligatoire configure'}.`,
    `Champs optionnels: ${optional.length > 0 ? optional.join(', ') : 'aucun champ optionnel configure'}.`,
    `Champs supplementaires a demander: ${custom.length > 0 ? custom.join(', ') : 'aucun'}.`,
  ].join('\n')
}

function parseBotModelPayload(value: string): BotModelPayload {
  try {
    const parsed = JSON.parse(value) as unknown

    if (isRecord(parsed)) {
      return {
        reply: typeof parsed.reply === 'string' ? parsed.reply.trim() : undefined,
        action: isRecord(parsed.action) ? parsed.action as BotOrderAction : null,
      }
    }
  } catch {}

  return { reply: value.trim(), action: null }
}

function normalizeOrderItems(action: BotOrderAction, products: ProductPromptRecord[]) {
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

async function createTestOrder(params: {
  businessId: string
  action: BotOrderAction
  products: ProductPromptRecord[]
}) {
  const items = normalizeOrderItems(params.action, params.products)

  if (items.length === 0) {
    return null
  }

  const phone = params.action.phone?.trim() || null
  const email = params.action.email?.trim() || null
  const customerName = params.action.customerName?.trim() || phone || email || 'Client test'
  const externalKey = phone ?? email ?? customerName
  const externalId = `${TEST_CONTACT_EXTERNAL_ID_PREFIX}:${externalKey.toLowerCase()}`

  const order = await prisma.$transaction(async (tx) => {
    const connection = await tx.businessChannelConnection.findFirst({
      where: { businessId: params.businessId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, channel: true },
    })

    if (!connection) {
      return null
    }

    const contact = await tx.contact.upsert({
      where: {
        businessId_channel_externalId: {
          businessId: params.businessId,
          channel: connection.channel,
          externalId,
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
        externalId,
        name: customerName,
        phone,
        notes: email ? `Email: ${email}` : null,
        lastSeen: new Date(),
      },
      select: { id: true },
    })

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

    const totalAmount = preparedItems.reduce(
      (sum, item) => sum.add(item.totalPrice),
      new Prisma.Decimal(0),
    )

    const notes = [
      params.action.notes?.trim() ? `Notes: ${params.action.notes.trim()}` : null,
      params.action.preferredDate?.trim() ? `Date souhaitee: ${params.action.preferredDate.trim()}` : null,
      email ? `Email: ${email}` : null,
    ].filter(Boolean).join('\n')

    return tx.order.create({
      data: {
        businessId: params.businessId,
        contactId: contact.id,
        orderNumber: (lastOrder?.orderNumber ?? 0) + 1,
        status: 'NOUVEAU',
        paymentStatus: 'PAS_ENCORE',
        deliveryAddress: params.action.deliveryAddress?.trim() || null,
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

  return order ? mapOrder(order) : null
}

function buildSystemPrompt(params: {
  businessName: string
  botName: string | null
  businessType: string | null
  tone: string | null
  knowledge: KnowledgeConfig
  products: ProductPromptRecord[]
  handoffKeywords: string | null
}) {
  const botName = params.botName?.trim() || params.businessName
  const businessType = formatBusinessType(params.businessType)
  const tone = params.tone?.trim() || 'professionnel, clair et commercial'
  const handoffKeywords = params.handoffKeywords?.trim() || 'aucun mot cle additionnel'
  const handoffRules = params.knowledge.handoffEnabled
    ? `Handoff automatique: actif.
- Si tu ne comprends pas la demande, reponds uniquement avec une phrase de handoff.
- Si la demande est ambigue, hors informations fournies, ou necessite une decision humaine, reponds uniquement avec une phrase de handoff.
- Si le client est fache, parle de reclamation, remboursement, probleme de commande ou demande un humain, reponds uniquement avec une phrase de handoff.
- Si le message contient un de ces mots cles, reponds uniquement avec une phrase de handoff: ${handoffKeywords}.
- Handoff en francais: Je transmets votre message a notre equipe.
- Handoff en tunisien: reponds dans la langue du client avec une phrase courte qui dit que le message est transmis a l'equipe.`
    : `Handoff automatique: inactif.
- Si tu n'as pas l'information, dis simplement que l'information n'est pas disponible et propose de contacter l'equipe.`

  return truncateText(`Tu t'appelles ${botName}. Tu representes ${params.businessName}. Ne dis jamais que tu es un bot.

Objectif:
Repondre aux clients avec les informations configurees et l'inventaire actif. Ne jamais inventer. Rester dans le contexte de ${params.businessName}.

Activite:
${businessType}

Ton commercial:
${tone}

Strategie de vente:
- Comprends l'intention: information, prix, disponibilite, commande, reservation, reclamation ou hors sujet.
- Si le client montre une intention d'achat ou de reservation, guide-le avec une question courte vers l'etape suivante.
- Ne pousse pas agressivement. Aide le client a choisir avec les produits, services, prix et contraintes disponibles.
- Si l'activite est un service, parle de rendez-vous, disponibilite et informations necessaires.
- Si l'activite vend des produits, parle de choix produit, quantite, livraison et confirmation.
- Si la demande sort du contexte, refuse doucement et ramene vers les produits, services ou l'equipe.

Horaires boutique:
${formatBusinessHours(params.knowledge.businessHours)}

Livraison:
${formatDelivery(params.knowledge)}

Paiement:
${formatPayments(params.knowledge)}

Adresse boutique:
${params.knowledge.boutiqueAddress || 'Adresse non renseignee.'}

Delai de livraison:
${params.knowledge.deliveryDelay || 'Delai non renseigne.'}

Regles commande:
${formatPolicies(params.knowledge)}

Questions supplementaires:
${formatExtraFaq(params.knowledge.extraFaq)}

Inventaire actif:
${formatProducts(params.products)}

Commande ou reservation:
${formatOrderCapture(params.knowledge)}

${handoffRules}

Regles de langue et darija tunisienne:
- Detecte la langue du client depuis le dernier message et l'historique.
- Si le client ecrit en francais, reponds en francais clair.
- Si le client ecrit en tunisien latinise, reponds en tunisien latinise naturel.
- Si le client ecrit en arabe tunisien, reponds en arabe tunisien naturel.
- N'utilise jamais de texte casse, mojibake ou caracteres mal encodes.
- Tunisien naturel latinise autorise: 3aslema, behi, taw, chnowa, fech, win, kadeh, barcha, nheb, t7eb, najmou, mawjoud, livraison, commande, rendez-vous.
- Garde la meme langue que le client pendant toute la reponse.
- Evite les mots aleatoires et les melanges inutiles. Le francais peut apparaitre en darija seulement quand c'est naturel pour le commerce tunisien.
- Reste court, poli, professionnel et utile.

Regles de reponse:
- Pour les prix et le stock des produits, utilise uniquement l'inventaire actif.
- Pour les frais de livraison, utilise uniquement les zones de livraison configurees.
- Si plusieurs produits ou zones peuvent correspondre, pose une question courte de clarification.
- Si une reponse utile peut etre donnee, donne-la directement sans mentionner ces regles.
- Maximum 90 mots sauf si le client demande des details.

Sortie obligatoire:
Retourne uniquement un JSON valide, sans markdown:
{
  "reply": "message client final",
  "action": null
}
Si et seulement si le client veut commander ou reserver ET tous les champs obligatoires sont connus, utilise:
{
  "reply": "message client final",
  "action": {
    "type": "CREATE_ORDER",
    "customerName": "nom",
    "phone": "telephone",
    "email": "email si donne",
    "deliveryAddress": "adresse si donnee",
    "preferredDate": "date ou horaire si donne",
    "notes": "conditions et champs supplementaires",
    "items": [{ "productName": "nom exact du produit ou service", "quantity": 1, "unitPrice": 0 }]
  }
}
Avant de creer une action, demande les champs obligatoires manquants un par un ou en une courte question.`, MAX_SYSTEM_PROMPT_CHARS)
}

export async function POST(request: Request) {
  const { response, session } = await requireBusinessApiSession()

  if (response || !session) {
    return response
  }

  if (!checkRateLimit(session.user.id)) {
    return NextResponse.json({ success: false, error: 'Trop de tests envoyes. Reessayez dans une minute.' }, { status: 429 })
  }

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return NextResponse.json({ success: false, error: 'Configuration Groq manquante.' }, { status: 500 })
  }

  const body = (await request.json()) as BotTestBody
  const message = truncateText(body.message?.trim() ?? '', MAX_USER_MESSAGE_CHARS)

  if (!message) {
    return NextResponse.json({ success: false, error: 'Message vide.' }, { status: 400 })
  }

  const [business, products] = await Promise.all([
    prisma.business.findUnique({
      where: { id: session.user.id },
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
        businessId: session.user.id,
        isActive: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: 30,
      select: {
        name: true,
        type: true,
        description: true,
        price: true,
        deliveryFee: true,
        stock: true,
        fournisseur: true,
        images: {
          orderBy: { position: 'asc' },
          select: {
            id: true,
            mimeType: true,
            position: true,
          },
        },
      },
    }),
  ])

  if (!business) {
    return NextResponse.json({ success: false, error: 'Entreprise introuvable.' }, { status: 404 })
  }

  const systemPrompt = buildSystemPrompt({
    businessName: business.name,
    botName: business.botName,
    businessType: business.businessType,
    tone: business.tone,
    knowledge: parseKnowledgeConfig(business.botKnowledge),
    products,
    handoffKeywords: business.botHandoffKeywords,
  })

  const history = (body.history ?? [])
    .filter(isChatMessage)
    .slice(-10)
    .map((item) => ({
      role: item.role,
      content: truncateText(item.content.trim(), MAX_HISTORY_MESSAGE_CHARS),
    }))

  const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.2,
      max_tokens: 650,
      messages: [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: message },
      ],
    }),
  })

  if (!groqResponse.ok) {
    return NextResponse.json({ success: false, error: 'Le test Groq a echoue.' }, { status: 502 })
  }

  const payload = (await groqResponse.json()) as GroqResponse
  const rawContent = payload.choices?.[0]?.message?.content?.trim()
  const modelPayload = rawContent ? parseBotModelPayload(rawContent) : null
  const content = modelPayload?.reply?.trim()

  if (!content) {
    return NextResponse.json({ success: false, error: 'Reponse Groq vide.' }, { status: 502 })
  }

  const order = modelPayload.action?.type === 'CREATE_ORDER'
    ? await createTestOrder({
        businessId: session.user.id,
        action: modelPayload.action,
        products,
      })
    : null

  return NextResponse.json({ success: true, data: { response: content, order } })
}
