import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const businessId = searchParams.get('businessId')

    const where = businessId ? { businessId } : {}

    const faqs = await prisma.faq.findMany({
      where,
      include: {
        business: {
          select: {
            name: true,
          },
        },
      },
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
    const body = await request.json()
    const { businessId, question, answer } = body

    if (!businessId || !question || !answer) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const faq = await prisma.faq.create({
      data: {
        businessId,
        question,
        answer,
      },
    })

    // Trigger prompt regeneration
    await prisma.botConfig.update({
      where: { businessId },
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
