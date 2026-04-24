import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/admin'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const events = await prisma.botEvent.findMany({
    take: 100,
    orderBy: { createdAt: 'desc' },
    include: { business: { select: { id: true, name: true } } },
  })

  return NextResponse.json(events)
}
