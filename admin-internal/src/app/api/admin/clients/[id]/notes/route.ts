import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req)
  if (auth instanceof NextResponse) return auth

  const { id } = await params
  const { content } = await req.json()
  if (!content) return NextResponse.json({ error: 'Bad request' }, { status: 400 })

  const note = await prisma.adminNote.create({
    data: { businessId: id, content },
  })
  return NextResponse.json(note, { status: 201 })
}
