import { NextResponse } from 'next/server'
import { requireBusinessApiSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { BotConfig } from '@/types'

type BotConfigBody = Partial<Omit<BotConfig, 'businessName'>>

function mapBotConfig(business: {
  name: string
  botEnabled: boolean
  botName: string | null
  botLanguage: string | null
  botMode: string | null
  botWorkingHoursStart: string | null
  botWorkingHoursEnd: string | null
  botKnowledge: string | null
  botHandoffKeywords: string | null
}): BotConfig {
  return {
    businessName: business.name,
    botEnabled: business.botEnabled,
    botName: business.botName ?? '',
    botLanguage: business.botLanguage ?? 'français',
    botMode: business.botMode ?? 'professionnel',
    botWorkingHoursStart: business.botWorkingHoursStart ?? '',
    botWorkingHoursEnd: business.botWorkingHoursEnd ?? '',
    botKnowledge: business.botKnowledge ?? '',
    botHandoffKeywords: business.botHandoffKeywords ?? '',
  }
}

const botSelect = {
  name: true,
  botEnabled: true,
  botName: true,
  botLanguage: true,
  botMode: true,
  botWorkingHoursStart: true,
  botWorkingHoursEnd: true,
  botKnowledge: true,
  botHandoffKeywords: true,
} as const

export async function GET() {
  const { response, session } = await requireBusinessApiSession()

  if (response || !session) {
    return response
  }

  const business = await prisma.business.findUnique({
    where: { id: session.user.id },
    select: botSelect,
  })

  if (!business) {
    return NextResponse.json({ success: false, error: 'Entreprise introuvable.' }, { status: 404 })
  }

  return NextResponse.json({ success: true, data: mapBotConfig(business) })
}

export async function PATCH(request: Request) {
  const { response, session } = await requireBusinessApiSession()

  if (response || !session) {
    return response
  }

  const body = (await request.json()) as BotConfigBody

  if (body.botKnowledge && body.botKnowledge.length > 8000) {
    return NextResponse.json({ success: false, error: 'La base de connaissances est trop longue.' }, { status: 400 })
  }

  const business = await prisma.business.update({
    where: { id: session.user.id },
    data: {
      ...(body.botEnabled !== undefined ? { botEnabled: body.botEnabled } : {}),
      ...(body.botName !== undefined ? { botName: body.botName.trim() || null } : {}),
      ...(body.botLanguage !== undefined ? { botLanguage: body.botLanguage.trim() || null } : {}),
      ...(body.botMode !== undefined ? { botMode: body.botMode.trim() || null } : {}),
      ...(body.botWorkingHoursStart !== undefined ? { botWorkingHoursStart: body.botWorkingHoursStart.trim() || null } : {}),
      ...(body.botWorkingHoursEnd !== undefined ? { botWorkingHoursEnd: body.botWorkingHoursEnd.trim() || null } : {}),
      ...(body.botKnowledge !== undefined ? { botKnowledge: body.botKnowledge.trim() || null } : {}),
      ...(body.botHandoffKeywords !== undefined ? { botHandoffKeywords: body.botHandoffKeywords.trim() || null } : {}),
    },
    select: botSelect,
  })

  return NextResponse.json({ success: true, data: mapBotConfig(business) })
}
