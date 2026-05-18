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

    const faqs = await prisma.faq.findMany({
      where: { businessId: session.user.id },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ success: true, data: faqs })
  } catch (error) {
    console.error('[FAQs GET] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch FAQs' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { question, answer } = body

    if (!question || !answer) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const faq = await prisma.faq.create({
      data: {
        businessId: session.user.id,
        question,
        answer,
      },
    })

    // Trigger prompt regeneration
    await prisma.botConfig.update({
      where: { businessId: session.user.id },
      data: { needsRegen: true },
    }).catch(() => {
      // Bot config might not exist yet, ignore error
    })

    return NextResponse.json({ success: true, data: faq })
  } catch (error) {
    console.error('[FAQs POST] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create FAQ' },
      { status: 500 }
    )
  }
}
