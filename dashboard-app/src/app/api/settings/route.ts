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

    const business = await prisma.business.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        businessType: true,
        botMode: true,
        languages: true,
        tone: true,
        ownerPhone: true,
        chatwootInboxId: true,
        chatwootAgentId: true,
        active: true,
        description: true,
        botName: true,
        greetingMessage: true,
        hasConfiguredBot: true,
      },
    })

    return NextResponse.json({ success: true, data: business })
  } catch (error) {
    console.error('[Settings GET] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, phone, businessType, botMode, languages, tone, ownerPhone, chatwootInboxId, chatwootAgentId, active } = body

    const business = await prisma.business.update({
      where: { id: session.user.id },
      data: {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
        ...(businessType !== undefined && { businessType }),
        ...(botMode !== undefined && { botMode }),
        ...(languages !== undefined && { languages }),
        ...(tone !== undefined && { tone }),
        ...(ownerPhone !== undefined && { ownerPhone }),
        ...(chatwootInboxId !== undefined && { chatwootInboxId }),
        ...(chatwootAgentId !== undefined && { chatwootAgentId: parseInt(chatwootAgentId) }),
        ...(active !== undefined && { active }),
      },
    })

    // Trigger prompt regeneration if bot-related fields changed
    const shouldRegen = body.name !== undefined || body.phone !== undefined || body.businessType !== undefined || body.botMode !== undefined || body.languages !== undefined || body.tone !== undefined || body.description !== undefined || body.botName !== undefined || body.greetingMessage !== undefined
    if (shouldRegen) {
      await prisma.botConfig.update({
        where: { businessId: session.user.id },
        data: { needsRegen: true },
      }).catch(() => {
        // Bot config might not exist yet, ignore error
      })
    }

    return NextResponse.json({ success: true, data: business })
  } catch (error) {
    console.error('[Settings PATCH] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
