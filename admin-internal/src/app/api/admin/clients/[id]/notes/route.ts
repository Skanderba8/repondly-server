import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/admin'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const { content } = await req.json()
  if (!content) return NextResponse.json({ error: 'Bad request' }, { status: 400 })

  const note = await prisma.adminNote.create({
    data: { businessId: id, content },
  })
  return NextResponse.json(note, { status: 201 })
}
