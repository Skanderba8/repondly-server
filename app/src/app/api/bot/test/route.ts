import { NextResponse } from 'next/server'
import { executeAiAction } from '@/lib/ai/actions'
import { type AiChatMessage } from '@/lib/ai/config'
import { generateAiReply } from '@/lib/ai/groq'
import { normalizePromptProducts } from '@/lib/ai/promptBuilder'
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

const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX_REQUESTS = 8
const requestBuckets = new Map<string, number[]>()

function isChatMessage(message: ChatMessage) {
  return ['user', 'assistant', 'system'].includes(message.role) && Boolean(message.content?.trim())
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

function normalizeHistory(history: ChatMessage[] | undefined): AiChatMessage[] {
  return (history ?? [])
    .filter(isChatMessage)
    .filter((message) => message.role !== 'system')
    .map((message) => ({
      role: message.role === 'assistant' ? 'assistant' : 'user',
      content: message.content,
    }))
}

export async function POST(request: Request) {
  const { response, session } = await requireBusinessApiSession()

  if (response || !session) {
    return response
  }

  if (!checkRateLimit(session.user.id)) {
    return NextResponse.json({ success: false, error: 'Trop de tests envoyes. Reessayez dans une minute.' }, { status: 429 })
  }

  const body = (await request.json()) as BotTestBody
  const message = body.message?.trim() ?? ''

  if (!message) {
    return NextResponse.json({ success: false, error: 'Message vide.' }, { status: 400 })
  }

  const business = await prisma.business.findUnique({
    where: { id: session.user.id },
    select: { id: true },
  })

  if (!business) {
    return NextResponse.json({ success: false, error: 'Entreprise introuvable.' }, { status: 404 })
  }

  try {
    const aiReply = await generateAiReply({
      businessId: session.user.id,
      customerMessage: message,
      history: normalizeHistory(body.history),
      enforceLimits: false,
    })

    const products = await prisma.product.findMany({
      where: {
        businessId: session.user.id,
        isActive: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: 10,
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
          take: 3,
          select: {
            dataUrl: true,
            mimeType: true,
            sizeBytes: true,
            position: true,
          },
        },
      },
    })

    const actionResult = await executeAiAction({
      businessId: session.user.id,
      action: aiReply.action,
      products: normalizePromptProducts(products),
      testMode: true,
    })
    const reply = aiReply.action?.type === 'order_complete' && !actionResult.order
      ? 'Votre commande a ete confirmee, marhbe bik ❤️'
      : aiReply.reply

    return NextResponse.json({
      success: true,
      data: {
        response: reply,
        reply,
        action: aiReply.action,
        extraction: aiReply.extraction,
        usage: aiReply.usage,
        order: actionResult.order,
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'GROQ_API_KEY_MISSING') {
      return NextResponse.json({ success: false, error: 'Configuration Groq manquante.' }, { status: 500 })
    }

    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Le test Groq a echoue.' }, { status: 502 })
  }
}
