import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/admin'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET() {
  const session = await auth()
  if (!isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const businesses = await prisma.business.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(businesses)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { name, email, password, plan, trialEndsAt } = body

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }

  const existing = await prisma.business.findUnique({ where: { email } })
  if (existing) return NextResponse.json({ error: 'Email already exists' }, { status: 409 })

  const passwordHash = await bcrypt.hash(password, 10)
  const business = await prisma.business.create({
    data: {
      name,
      email,
      passwordHash,
      plan: plan ?? 'FREE',
      trialEndsAt: trialEndsAt ? new Date(trialEndsAt) : null,
    },
  })

  return NextResponse.json(business, { status: 201 })
}
