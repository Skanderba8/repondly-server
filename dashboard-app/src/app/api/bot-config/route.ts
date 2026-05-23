import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const botConfig = await prisma.botConfig.findUnique({
      where: { businessId: session.user.id },
    })

    return NextResponse.json({ success: true, data: botConfig })
  } catch (error) {
    console.error('[BotConfig GET] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch bot config' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { businessId, systemPrompt, requiredOrderFields, requiredAppointmentFields, handoverTriggers, collectFields, handoverPhone, defaultLanguage, botActive } = body

    if (!businessId) {
      return NextResponse.json({ success: false, error: 'businessId is required' }, { status: 400 })
    }

    const botConfig = await prisma.botConfig.upsert({
      where: { businessId },
      update: {
        systemPrompt,
        requiredOrderFields: requiredOrderFields || [],
        requiredAppointmentFields: requiredAppointmentFields || [],
        handoverTriggers: handoverTriggers || [],
        collectFields: collectFields || [],
        handoverPhone,
        defaultLanguage: defaultLanguage || 'FR',
        botActive: botActive !== undefined ? botActive : true,
        needsRegen: true,
      },
      create: {
        businessId,
        systemPrompt,
        requiredOrderFields: requiredOrderFields || [],
        requiredAppointmentFields: requiredAppointmentFields || [],
        handoverTriggers: handoverTriggers || [],
        collectFields: collectFields || [],
        handoverPhone,
        defaultLanguage: defaultLanguage || 'FR',
        botActive: botActive !== undefined ? botActive : true,
        needsRegen: true,
      },
    })

    return NextResponse.json({ success: true, data: botConfig })
  } catch (error) {
    console.error('[BotConfig POST] Error:', error)
    return NextResponse.json({ success: false, error: 'Failed to save bot config' }, { status: 500 })
  }
}
