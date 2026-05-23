import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const businessId = searchParams.get('businessId')

    if (!businessId) {
      return NextResponse.json({ success: false, error: 'businessId is required' }, { status: 400 })
    }

    // Fetch Business and BotConfig together
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: { botConfig: true },
    })

    if (!business) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: { business, botConfig: business.botConfig } })
  } catch (error) {
    console.error('[BotConfigFull GET] Error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch bot config' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { business, botConfig } = body

    if (!business?.id) {
      return NextResponse.json({ success: false, error: 'business.id is required' }, { status: 400 })
    }

    // Update Business fields
    const updatedBusiness = await prisma.business.update({
      where: { id: business.id },
      data: {
        name: business.name,
        description: business.description,
        phone: business.phone,
        botName: business.botName,
        greetingMessage: business.greetingMessage,
        ownerPhone: business.ownerPhone,
      },
    })

    // Update or create BotConfig
    const updatedBotConfig = await prisma.botConfig.upsert({
      where: { businessId: business.id },
      update: {
        systemPrompt: botConfig?.systemPrompt,
        requiredOrderFields: botConfig?.requiredOrderFields || [],
        requiredAppointmentFields: botConfig?.requiredAppointmentFields || [],
        handoverTriggers: botConfig?.handoverTriggers || [],
        collectFields: botConfig?.collectFields || [],
        handoverPhone: botConfig?.handoverPhone,
        defaultLanguage: botConfig?.defaultLanguage || 'FR',
        botActive: botConfig?.botActive !== undefined ? botConfig.botActive : true,
        strictInstructionBlock: botConfig?.strictInstructionBlock,
        needsRegen: true,
      },
      create: {
        businessId: business.id,
        systemPrompt: botConfig?.systemPrompt,
        requiredOrderFields: botConfig?.requiredOrderFields || [],
        requiredAppointmentFields: botConfig?.requiredAppointmentFields || [],
        handoverTriggers: botConfig?.handoverTriggers || [],
        collectFields: botConfig?.collectFields || [],
        handoverPhone: botConfig?.handoverPhone,
        defaultLanguage: botConfig?.defaultLanguage || 'FR',
        botActive: botConfig?.botActive !== undefined ? botConfig.botActive : true,
        strictInstructionBlock: botConfig?.strictInstructionBlock,
        needsRegen: true,
      },
    })

    return NextResponse.json({ success: true, data: { business: updatedBusiness, botConfig: updatedBotConfig } })
  } catch (error) {
    console.error('[BotConfigFull POST] Error:', error)
    return NextResponse.json({ success: false, error: 'Failed to save bot config' }, { status: 500 })
  }
}
