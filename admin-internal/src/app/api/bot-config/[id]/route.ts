import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { systemPrompt, requiredOrderFields, requiredAppointmentFields, handoverTriggers, collectFields } = body

    const botConfig = await prisma.botConfig.update({
      where: { id },
      data: {
        ...(systemPrompt !== undefined && { systemPrompt }),
        ...(requiredOrderFields !== undefined && { requiredOrderFields }),
        ...(requiredAppointmentFields !== undefined && { requiredAppointmentFields }),
        ...(handoverTriggers !== undefined && { handoverTriggers }),
        ...(collectFields !== undefined && { collectFields }),
        needsRegen: true,
      },
    })

    return NextResponse.json({ success: true, data: botConfig })
  } catch (error) {
    console.error('[BotConfig PATCH] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update bot config' },
      { status: 500 }
    )
  }
}
