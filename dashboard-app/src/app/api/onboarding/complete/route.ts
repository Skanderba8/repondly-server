import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const business = await prisma.business.update({
      where: { id: session.user.id },
      data: { hasConfiguredBot: true },
    })

    return NextResponse.json({ success: true, data: business })
  } catch (error) {
    console.error('[Onboarding Complete] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to complete onboarding' },
      { status: 500 }
    )
  }
}
