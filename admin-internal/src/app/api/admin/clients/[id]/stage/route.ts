import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { isAdmin, getNextStage } from '@/lib/admin'
import { prisma } from '@/lib/prisma'

export async function PATCH(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params

  const current = await prisma.onboardingStage.findUnique({ where: { businessId: id } })
  const currentStage = current?.stage ?? 'DEMO_BOOKED'
  const nextStage = getNextStage(currentStage)

  if (nextStage === currentStage) {
    return NextResponse.json({ message: 'Already at final stage', stage: currentStage })
  }

  const [updated] = await prisma.$transaction([
    prisma.onboardingStage.upsert({
      where: { businessId: id },
      update: { stage: nextStage },
      create: { businessId: id, stage: nextStage },
    }),
    prisma.activityLog.create({
      data: {
        businessId: id,
        action: `Stage avancé vers ${nextStage}`,
      },
    }),
  ])

  return NextResponse.json(updated)
}
