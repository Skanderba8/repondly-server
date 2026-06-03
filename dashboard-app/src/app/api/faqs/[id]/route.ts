import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth()
    if (authResult instanceof NextResponse) return authResult
    const { businessId } = authResult

    const { id } = await params
    const body = await request.json()
    const { question, answer, active } = body

    const existing = await prisma.faq.findUnique({
      where: { id },
    })

    if (!existing || existing.businessId !== businessId) {
      return NextResponse.json(
        { success: false, error: 'FAQ not found or unauthorized' },
        { status: 404 }
      )
    }

    const faq = await prisma.faq.update({
      where: { id },
      data: {
        ...(question !== undefined && { question }),
        ...(answer !== undefined && { answer }),
        ...(active !== undefined && { active }),
      },
    })

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
    const authResult = await requireAuth()
    if (authResult instanceof NextResponse) return authResult
    const { businessId } = authResult

    const { id } = await params

    const existing = await prisma.faq.findUnique({
      where: { id },
    })

    if (!existing || existing.businessId !== businessId) {
      return NextResponse.json(
        { success: false, error: 'FAQ not found or unauthorized' },
        { status: 404 }
      )
    }

    await prisma.faq.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[FAQ DELETE] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete FAQ' },
      { status: 500 }
    )
  }
}
