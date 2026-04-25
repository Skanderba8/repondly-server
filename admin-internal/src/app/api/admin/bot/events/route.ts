import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (auth instanceof NextResponse) return auth

  const events = await prisma.botEvent.findMany({
    take: 100,
    orderBy: { createdAt: 'desc' },
    include: { business: { select: { id: true, name: true } } },
  })

  return NextResponse.json(events)
}
