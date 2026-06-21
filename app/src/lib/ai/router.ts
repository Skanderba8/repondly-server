// Fast intent router for deciding whether the bot can answer with deterministic templates.
// Connected to groq.ts before the full reply model fallback.
import { AI_CONFIG, truncateText } from '@/lib/ai/config'

export const ROUTER_INTENTS = [
  'greeting',
  'product_inquiry',
  'product_specific',
  'price_inquiry',
  'size_inquiry',
  'delivery_inquiry',
  'payment_inquiry',
  'order_start',
  'order_name',
  'order_phone',
  'negotiation',
  'complaint',
  'human_request',
  'unknown',
] as const

export type RouterIntent = typeof ROUTER_INTENTS[number]

export type RouterSlots = {
  productName?: string
  size?: string
  quantity?: string
}

export type RouterResult = {
  intent: RouterIntent
  slots: RouterSlots
}

type RouterResponse = {
  choices?: Array<{
    message?: {
      content?: string
    }
  }>
}

const ROUTER_SYSTEM_PROMPT = `Classify the latest customer message into exactly one intent. Understand French, Arabic, English, Tunisian Arabic, and Arabizi, but do not decide the reply language.

Priority: if the message contains a greeting plus a business request, classify the business request, not greeting.

Intents:
- greeting: only hello, bonjour, salam, hi without another request.
- product_inquiry: asks what products/services are available.
- product_specific: asks details about a named product/service.
- price_inquiry: asks price, cost, 9adeh, ch7al, soum, souma, combien.
- size_inquiry: asks size, dimension, taille, pointure, variant.
- delivery_inquiry: asks delivery, shipping, livraison, tawsil, tou9sel, tnajmou touslou.
- payment_inquiry: asks payment methods, cash, card, paiement.
- order_start: wants to buy, order, reserve, commander, nheb ncommandi, n7eb ne5ou.
- order_name: sends or asks about customer name during ordering.
- order_phone: sends or asks about phone number during ordering.
- negotiation: asks for discount, lower price, bargain.
- complaint: complaint, refund, issue, angry customer.
- human_request: asks for human, agent, responsable, someone to call.
- unknown: anything else.

Extract slots only when explicitly present:
- productName: product or service name.
- productName can be an exact item, a category, or descriptive terms such as "robe bleu".
- size: requested size or variant.
- quantity: requested quantity.

Return JSON only, no markdown, no explanation:
{"intent":"unknown","slots":{}}`

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function normalizeIntent(value: unknown): RouterIntent {
  if (typeof value !== 'string') return 'unknown'
  return ROUTER_INTENTS.includes(value as RouterIntent) ? value as RouterIntent : 'unknown'
}

function normalizeSlots(value: unknown): RouterSlots {
  if (!isRecord(value)) return {}

  return {
    productName: typeof value.productName === 'string' ? truncateText(value.productName, 80) : undefined,
    size: typeof value.size === 'string' ? truncateText(value.size, 40) : undefined,
    quantity: typeof value.quantity === 'string' ? truncateText(value.quantity, 30) : undefined,
  }
}

function parseRouterResponse(value: string): RouterResult {
  try {
    const parsed = JSON.parse(value) as unknown
    if (!isRecord(parsed)) return { intent: 'unknown', slots: {} }

    return {
      intent: normalizeIntent(parsed.intent),
      slots: normalizeSlots(parsed.slots),
    }
  } catch {
    return { intent: 'unknown', slots: {} }
  }
}

export async function routeIntent(customerMessage: string): Promise<RouterResult> {
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
        model: AI_CONFIG.ROUTER_MODEL,
        temperature: 0,
        top_p: 1,
        max_tokens: 80,
        messages: [
          { role: 'system', content: ROUTER_SYSTEM_PROMPT },
          { role: 'user', content: truncateText(customerMessage, AI_CONFIG.MAX_INPUT_CHARS) },
        ],
      }),
    })

    if (!response.ok) {
      throw new Error('GROQ_ROUTER_REQUEST_FAILED')
    }

    const payload = await response.json() as RouterResponse
    return parseRouterResponse(payload.choices?.[0]?.message?.content?.trim() ?? '')
  } finally {
    clearTimeout(timeout)
  }
}
