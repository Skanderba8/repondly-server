import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const onboarding = await prisma.onboardingProgress.findUnique({
      where: { businessId: session.user.id },
    })

    const completed = onboarding?.stage === 'COMPLETE'

    return NextResponse.json({ success: true, completed })
  } catch (error) {
    console.error('[Onboarding Status] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to check onboarding status' },
      { status: 500 }
    )
  }
}
