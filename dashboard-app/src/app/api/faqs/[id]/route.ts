import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { question, answer } = body

    const existing = await prisma.faq.findUnique({
      where: { id },
    })

    if (!existing || existing.businessId !== session.user.id) {
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
      },
    })

    await prisma.botConfig.update({
      where: { businessId: session.user.id },
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
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const existing = await prisma.faq.findUnique({
      where: { id },
    })

    if (!existing || existing.businessId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'FAQ not found or unauthorized' },
        { status: 404 }
      )
    }

    await prisma.faq.delete({
      where: { id },
    })

    await prisma.botConfig.update({
      where: { businessId: session.user.id },
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
