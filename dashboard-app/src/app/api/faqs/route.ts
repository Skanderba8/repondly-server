import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'

export async function GET(request: Request) {
  try {
    const authResult = await requireAuth()
    if (authResult instanceof NextResponse) return authResult
    const { businessId } = authResult

    const faqs = await prisma.faq.findMany({
      where: { businessId },
      orderBy: { createdAt: 'asc' },
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
    const authResult = await requireAuth()
    if (authResult instanceof NextResponse) return authResult
    const { businessId } = authResult

    const body = await request.json()
    const { question, answer, active } = body

    if (!question || !answer) {
      return NextResponse.json(
        { success: false, error: 'question and answer are required' },
        { status: 400 }
      )
    }

    const faq = await prisma.faq.create({
      data: {
        businessId,
        question: question.trim(),
        answer: answer.trim(),
        active: active !== undefined ? active : true,
      },
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

export async function PUT(request: Request) {
  try {
    const authResult = await requireAuth()
    if (authResult instanceof NextResponse) return authResult
    const { businessId } = authResult

    const body = await request.json()
    const { faqs } = body as { faqs: { id: string; active?: boolean; question?: string; answer?: string }[] }

    if (!Array.isArray(faqs)) {
      return NextResponse.json(
        { success: false, error: 'faqs array is required' },
        { status: 400 }
      )
    }

    const results = await prisma.$transaction(
      faqs.map((f) =>
        prisma.faq.update({
          where: { id: f.id, businessId },
          data: {
            ...(f.active !== undefined && { active: f.active }),
            ...(f.question !== undefined && { question: f.question }),
            ...(f.answer !== undefined && { answer: f.answer }),
          },
        })
      )
    )

    return NextResponse.json({ success: true, data: results })
  } catch (error) {
    console.error('[FAQs PUT] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update FAQs' },
      { status: 500 }
    )
  }
}
