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
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, phone, botMode, languages, tone, ownerPhone, chatwootInboxId, chatwootAgentId, active, description, botName, greetingMessage } = body

    const business = await prisma.business.update({
      where: { id: session.user.id },
      data: {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
        ...(botMode !== undefined && { botMode }),
        ...(languages !== undefined && { languages }),
        ...(tone !== undefined && { tone }),
        ...(ownerPhone !== undefined && { ownerPhone }),
        ...(chatwootInboxId !== undefined && { chatwootInboxId }),
        ...(chatwootAgentId !== undefined && { chatwootAgentId }),
        ...(active !== undefined && { active }),
        ...(description !== undefined && { description }),
        ...(botName !== undefined && { botName }),
        ...(greetingMessage !== undefined && { greetingMessage }),
      },
    })

    return NextResponse.json({ success: true, data: business })
  } catch (error) {
    console.error('[Settings PATCH] Error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update settings' }, { status: 500 })
  }
}
