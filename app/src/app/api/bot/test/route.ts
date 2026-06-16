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

type GroqChoice = {
  message?: {
    content?: string
  }
}

type GroqResponse = {
  choices?: GroqChoice[]
}

function isChatMessage(message: ChatMessage) {
  return ['user', 'assistant', 'system'].includes(message.role) && Boolean(message.content?.trim())
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

  const business = await prisma.business.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      botName: true,
      botLanguage: true,
      botMode: true,
      botKnowledge: true,
      botHandoffKeywords: true,
    },
  })

  if (!business) {
    return NextResponse.json({ success: false, error: 'Entreprise introuvable.' }, { status: 404 })
  }

  const systemPrompt = `Tu t'appelles ${business.botName || business.name}. Tu représentes ${business.name}.
Réponds en ${business.botLanguage || 'français'}. Ton: ${business.botMode || 'professionnel'}.
Connaissance: ${business.botKnowledge || 'Aucune connaissance spécifique fournie.'}.
Si on mentionne: ${business.botHandoffKeywords || 'aucun mot clé'} - réponds uniquement: 'Je transmets votre message à notre équipe.'
Ne mentionne jamais que tu es un bot.`

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
    return NextResponse.json({ success: false, error: 'Le test Groq a échoué.' }, { status: 502 })
  }

  const payload = (await groqResponse.json()) as GroqResponse
  const content = payload.choices?.[0]?.message?.content?.trim()

  if (!content) {
    return NextResponse.json({ success: false, error: 'Réponse Groq vide.' }, { status: 502 })
  }

  return NextResponse.json({ success: true, data: { response: content } })
}
