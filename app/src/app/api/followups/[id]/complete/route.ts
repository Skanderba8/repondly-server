import { NextResponse } from 'next/server'
import { requireBusinessApiSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response, session } = await requireBusinessApiSession()

  if (response || !session) {
    return response
  }

  const { id } = await params
  const conversation = await prisma.conversation.findFirst({
    where: {
      id,
      businessId: session.user.id,
    },
    select: { id: true },
  })

  if (!conversation) {
    return NextResponse.json({ success: false, error: 'Relance introuvable.' }, { status: 404 })
  }

  await prisma.conversation.update({
    where: { id: conversation.id },
    data: {
      needsFollowUp: false,
      followUpAt: null,
    },
  })

  return NextResponse.json({ success: true })
}
