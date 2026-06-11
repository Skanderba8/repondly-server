import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req)
  if (auth instanceof NextResponse) return auth

  const { id } = await params
  const { content } = await req.json()

  if (!content?.trim()) {
    return NextResponse.json({ error: 'Content required' }, { status: 400 })
  }

  const note = await prisma.adminNote.create({
    data: { businessId: id, adminId: auth.session.user.id, content: content.trim() },
    select: { id: true, content: true, createdAt: true },
  })

  return NextResponse.json(note)
}