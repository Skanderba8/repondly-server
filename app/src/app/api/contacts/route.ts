import { NextResponse } from 'next/server'
import { requireBusinessApiSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { buildInitials } from '@/lib/utils/initials'

export async function GET(request: Request) {
  const { response, session } = await requireBusinessApiSession()

  if (response || !session) {
    return response
  }

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search')?.trim()

  const contacts = await prisma.contact.findMany({
    where: {
      businessId: session.user.id,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { username: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    orderBy: [
      { name: 'asc' },
      { createdAt: 'desc' },
    ],
    take: 8,
    select: {
      id: true,
      name: true,
      username: true,
      phone: true,
    },
  })

  return NextResponse.json({
    success: true,
    data: contacts.map((contact) => ({
      id: contact.id,
      name: contact.name ?? contact.username ?? undefined,
      phone: contact.phone ?? undefined,
      initials: buildInitials(contact.name ?? contact.username ?? undefined, contact.phone ?? undefined),
    })),
  })
}
