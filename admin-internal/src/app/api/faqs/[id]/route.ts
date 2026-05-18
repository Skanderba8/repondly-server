import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const faq = await prisma.faq.findUnique({
      where: { id },
      include: {
        business: {
          select: {
            name: true,
          },
        },
      },
    })

    if (!faq) {
      return NextResponse.json(
        { success: false, error: 'FAQ not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: faq })
  } catch (error) {
    console.error('[FAQ GET] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch FAQ' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { question, answer } = body

    const faq = await prisma.faq.update({
      where: { id },
      data: {
        ...(question !== undefined && { question }),
        ...(answer !== undefined && { answer }),
      },
    })

    // Trigger prompt regeneration
    await prisma.botConfig.update({
      where: { businessId: faq.businessId },
      data: { needsRegen: true },
    }).catch(() => {})

    return NextResponse.json({ success: true, data: faq })
  } catch (error) {
    console.error('[FAQ PATCH] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update FAQ' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const faq = await prisma.faq.delete({
      where: { id },
    })

    // Trigger prompt regeneration
    await prisma.botConfig.update({
      where: { businessId: faq.businessId },
      data: { needsRegen: true },
    }).catch(() => {})

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[FAQ DELETE] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete FAQ' },
      { status: 500 }
    )
  }
}
