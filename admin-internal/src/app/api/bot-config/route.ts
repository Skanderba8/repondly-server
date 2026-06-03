import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const businessId = searchParams.get('businessId')

    if (!businessId) {
      return NextResponse.json(
        { success: false, error: 'businessId is required' },
        { status: 400 }
      )
    }

    const botConfig = await prisma.botConfig.findUnique({
      where: { businessId },
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
    const body = await request.json()
    const { businessId, systemPrompt, requiredOrderFields, requiredAppointmentFields, handoverTriggers, collectFields } = body

    if (!businessId) {
      return NextResponse.json(
        { success: false, error: 'businessId is required' },
        { status: 400 }
      )
    }

    const botConfig = await prisma.botConfig.upsert({
      where: { businessId },
      update: {
        systemPrompt,
        requiredOrderFields: requiredOrderFields || [],
        requiredAppointmentFields: requiredAppointmentFields || [],
        handoverTriggers: handoverTriggers || [],
        collectFields: collectFields || [],
        needsRegen: true,
      },
      create: {
        businessId,
        systemPrompt,
        requiredOrderFields: requiredOrderFields || [],
        requiredAppointmentFields: requiredAppointmentFields || [],
        handoverTriggers: handoverTriggers || [],
        collectFields: collectFields || [],
        needsRegen: true,
      },
    })

    return NextResponse.json({ success: true, data: botConfig })
  } catch (error) {
    console.error('[BotConfig POST] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to save bot config' },
      { status: 500 }
    )
  }
}
