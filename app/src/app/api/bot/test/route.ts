import type { Prisma } from '@prisma/client'
import { NextResponse } from 'next/server'
import { requireBusinessApiSession } from '@/lib/auth'
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
  extraFaq: [],
}

function isChatMessage(message: ChatMessage) {
  return ['user', 'assistant', 'system'].includes(message.role) && Boolean(message.content?.trim())
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
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
    product.description ? `Description: ${product.description}` : null,
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

function buildSystemPrompt(params: {
  businessName: string
  botName: string | null
  knowledge: KnowledgeConfig
  products: ProductPromptRecord[]
  handoffKeywords: string | null
}) {
  const botName = params.botName?.trim() || params.businessName
  const handoffKeywords = params.handoffKeywords?.trim() || 'aucun mot cle additionnel'
  const handoffRules = params.knowledge.handoffEnabled
    ? `Handoff automatique: actif.
- Si tu ne comprends pas la demande, reponds uniquement avec une phrase de handoff.
- Si la demande est ambigue, hors informations fournies, ou necessite une decision humaine, reponds uniquement avec une phrase de handoff.
- Si le client est fache, parle de reclamation, remboursement, probleme de commande ou demande un humain, reponds uniquement avec une phrase de handoff.
- Si le message contient un de ces mots cles, reponds uniquement avec une phrase de handoff: ${handoffKeywords}.
- Handoff en francais: Je transmets votre message a notre equipe.
- Handoff en arabe ou darija: reponds dans la langue du client avec une phrase courte qui dit que le message est transmis a l'equipe.`
    : `Handoff automatique: inactif.
- Si tu n'as pas l'information, dis simplement que l'information n'est pas disponible et propose de contacter l'equipe.`

  return `Tu t'appelles ${botName}. Tu representes ${params.businessName}. Ne dis jamais que tu es un bot.

Objectif:
Repondre aux clients avec les informations configurees et l'inventaire actif. Ne jamais inventer.

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

${handoffRules}

Regles de langue:
- Detecte la langue du client depuis le dernier message et l'historique.
- Si le client ecrit en francais, reponds en francais clair.
- Si le client ecrit en arabe, reponds en arabe naturel.
- Si le client ecrit en darija tunisienne, reponds en darija tunisienne fluide avec un peu de francais seulement quand c'est naturel.
- Ne force jamais la darija si le client parle seulement francais.
- En darija tunisienne, tu peux utiliser naturellement: عسلامة, باهي, توة, قداش, وين, شنية, برشة, يعطيك الصحة.
- Reste professionnel, court et utile.

Regles de reponse:
- Pour les prix et le stock des produits, utilise uniquement l'inventaire actif.
- Pour les frais de livraison, utilise uniquement les zones de livraison configurees.
- Si plusieurs produits ou zones peuvent correspondre, pose une question courte de clarification.
- Si une reponse utile peut etre donnee, donne-la directement sans mentionner ces regles.`
}

export async function POST(request: Request) {
  const { response, session } = await requireBusinessApiSession()

  if (response || !session) {
    return response
  }

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return NextResponse.json({ success: false, error: 'Configuration Groq manquante.' }, { status: 500 })
  }

  const body = (await request.json()) as BotTestBody
  const message = body.message?.trim()

  if (!message) {
    return NextResponse.json({ success: false, error: 'Message vide.' }, { status: 400 })
  }

  const [business, products] = await Promise.all([
    prisma.business.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
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
      take: 50,
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
    knowledge: parseKnowledgeConfig(business.botKnowledge),
    products,
    handoffKeywords: business.botHandoffKeywords,
  })

  const history = (body.history ?? []).filter(isChatMessage).slice(-20)
  const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
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
  const content = payload.choices?.[0]?.message?.content?.trim()

  if (!content) {
    return NextResponse.json({ success: false, error: 'Reponse Groq vide.' }, { status: 502 })
  }

  return NextResponse.json({ success: true, data: { response: content } })
}
