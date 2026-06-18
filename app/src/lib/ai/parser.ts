// Groq response parser that converts model output into safe customer text, normalized actions, and extraction data.
// Connected to groq.ts and actions.ts. Edit this file when changing the JSON contract, reply truncation, or action names.
import { AI_CONFIG } from '@/lib/ai/config'
import { detectCustomerLanguage, getFallbackReply } from '@/lib/ai/language'

export type AiActionType = 'human_handover' | 'order_complete' | 'appointment_complete'

export type AiActionItem = {
  productName?: string
  quantity?: number
  unitPrice?: number
}

export type AiAction = {
  type?: string
  customerName?: string
  name?: string
  phone?: string
  email?: string
  deliveryAddress?: string
  preferredDate?: string
  notes?: string
  summary?: string
  reason?: string
  items?: AiActionItem[]
}

export type ParsedAiPayload = {
  reply: string
  action: AiAction | null
  extraction: Record<string, unknown>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function findFirstJsonObject(value: string) {
  const start = value.indexOf('{')
  if (start === -1) return null

  let depth = 0
  let inString = false
  let escaped = false

  for (let index = start; index < value.length; index += 1) {
    const char = value[index]

    if (escaped) {
      escaped = false
      continue
    }

    if (char === '\\') {
      escaped = true
      continue
    }

    if (char === '"') {
      inString = !inString
      continue
    }

    if (inString) {
      continue
    }

    if (char === '{') depth += 1
    if (char === '}') depth -= 1

    if (depth === 0) {
      return value.slice(start, index + 1)
    }
  }

  return null
}

function parseObject(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown
    return isRecord(parsed) ? parsed : null
  } catch {
    const extracted = findFirstJsonObject(value)
    if (!extracted) return null

    try {
      const parsed = JSON.parse(extracted) as unknown
      return isRecord(parsed) ? parsed : null
    } catch {
      return null
    }
  }
}

export function normalizeAction(action: unknown): AiAction | null {
  if (!isRecord(action)) return null

  const rawType = typeof action.type === 'string' ? action.type.trim() : ''
  const normalizedType = rawType === 'CREATE_ORDER' ? 'order_complete' : rawType

  return {
    type: normalizedType,
    customerName: typeof action.customerName === 'string' ? action.customerName : undefined,
    name: typeof action.name === 'string' ? action.name : undefined,
    phone: typeof action.phone === 'string' ? action.phone : undefined,
    email: typeof action.email === 'string' ? action.email : undefined,
    deliveryAddress: typeof action.deliveryAddress === 'string' ? action.deliveryAddress : undefined,
    preferredDate: typeof action.preferredDate === 'string' ? action.preferredDate : undefined,
    notes: typeof action.notes === 'string' ? action.notes : undefined,
    summary: typeof action.summary === 'string' ? action.summary : undefined,
    reason: typeof action.reason === 'string' ? action.reason : undefined,
    items: Array.isArray(action.items)
      ? action.items
          .filter(isRecord)
          .map((item) => ({
            productName: typeof item.productName === 'string' ? item.productName : undefined,
            quantity: typeof item.quantity === 'number' ? item.quantity : undefined,
            unitPrice: typeof item.unitPrice === 'number' ? item.unitPrice : undefined,
          }))
      : undefined,
  }
}

export function truncateReply(value: string, limit = AI_CONFIG.MAX_REPLY_CHARS) {
  const trimmed = value.trim()
  if (trimmed.length <= limit) return trimmed

  const candidate = trimmed.slice(0, limit)
  const sentenceEnd = Math.max(candidate.lastIndexOf('.'), candidate.lastIndexOf('!'), candidate.lastIndexOf('?'), candidate.lastIndexOf('؟'))

  if (sentenceEnd > 120) {
    return candidate.slice(0, sentenceEnd + 1).trim()
  }

  const space = candidate.lastIndexOf(' ')
  return `${candidate.slice(0, space > 120 ? space : limit).trim()}...`
}

export function parseAiResponse(rawResponse: string, customerMessage: string): ParsedAiPayload {
  const parsed = parseObject(rawResponse)
  const language = detectCustomerLanguage(customerMessage)
  const rawReply = parsed && typeof parsed.reply === 'string' ? parsed.reply.trim() : rawResponse.trim()
  const reply = truncateReply(rawReply || getFallbackReply(language))
  const extraction = parsed && isRecord(parsed.extraction) ? parsed.extraction : {}
  const action = parsed ? normalizeAction(parsed.action) : null

  return {
    reply,
    action,
    extraction,
  }
}
