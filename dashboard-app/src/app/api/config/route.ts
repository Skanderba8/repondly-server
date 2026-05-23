import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const business = await prisma.business.findUnique({
      where: { id: session.user.id },
      include: {
        botConfig: true,
        products: { orderBy: { createdAt: 'desc' } },
        services: { orderBy: { createdAt: 'desc' } },
        schedules: { orderBy: { dayOfWeek: 'asc' } },
        scheduleExceptions: { orderBy: { startDate: 'desc' } },
        connectedPages: { where: { active: true } },
      },
    })

    if (!business) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: business })
  } catch (error) {
    console.error('[Config GET]', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch config' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { business: biz, botConfig: bc } = body

    const updatedBusiness = await prisma.business.update({
      where: { id: session.user.id },
      data: {
        ...(biz?.name !== undefined && { name: biz.name }),
        ...(biz?.description !== undefined && { description: biz.description }),
        ...(biz?.phone !== undefined && { phone: biz.phone }),
        ...(biz?.address !== undefined && { address: biz.address }),
        ...(biz?.botMode !== undefined && { botMode: biz.botMode }),
        ...(biz?.botName !== undefined && { botName: biz.botName }),
        ...(biz?.greetingMessage !== undefined && { greetingMessage: biz.greetingMessage }),
        ...(biz?.alwaysOpen !== undefined && { alwaysOpen: biz.alwaysOpen }),
        ...(biz?.hasConfiguredBot !== undefined && { hasConfiguredBot: biz.hasConfiguredBot }),
        ...(biz?.ownerPhone !== undefined && { ownerPhone: biz.ownerPhone }),
      },
    })

    let updatedBotConfig = null
    if (bc !== undefined) {
      updatedBotConfig = await prisma.botConfig.upsert({
        where: { businessId: session.user.id },
        update: {
          ...(bc.botActive !== undefined && { botActive: bc.botActive }),
          ...(bc.handoverPhone !== undefined && { handoverPhone: bc.handoverPhone }),
          ...(bc.handoverTriggers !== undefined && { handoverTriggers: bc.handoverTriggers }),
          ...(bc.collectFields !== undefined && { collectFields: bc.collectFields }),
          ...(bc.strictInstructionBlock !== undefined && { strictInstructionBlock: bc.strictInstructionBlock }),
          needsRegen: true,
        },
        create: {
          businessId: session.user.id,
          botActive: bc.botActive ?? true,
          handoverPhone: bc.handoverPhone ?? null,
          handoverTriggers: bc.handoverTriggers ?? [],
          collectFields: bc.collectFields ?? [],
          strictInstructionBlock: bc.strictInstructionBlock ?? null,
          needsRegen: true,
        },
      })
    }

    return NextResponse.json({ success: true, data: { business: updatedBusiness, botConfig: updatedBotConfig } })
  } catch (error) {
    console.error('[Config POST]', error)
    return NextResponse.json({ success: false, error: 'Failed to save config' }, { status: 500 })
  }
}
