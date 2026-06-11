import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await prisma.onboardingProgress.upsert({
      where: { businessId: session.user.id },
      update: { stage: 'DEMO_BOOKED' },
      create: { businessId: session.user.id, stage: 'DEMO_BOOKED' },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Onboarding Reset] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to reset onboarding' },
      { status: 500 }
    )
  }
}
