import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { getNextStage } from '@/lib/admin'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req)
  if (auth instanceof NextResponse) return auth

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
