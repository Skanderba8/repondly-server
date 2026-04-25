import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (auth instanceof NextResponse) return auth

  const businesses = await prisma.business.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(businesses)
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (auth instanceof NextResponse) return auth

  const body = await request.json() as { name?: string; email?: string; password?: string; plan?: string; trialEndsAt?: string }
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
      plan: (plan ?? 'FREE') as 'FREE' | 'STARTER' | 'PRO' | 'BUSINESS',
      trialEndsAt: trialEndsAt ? new Date(trialEndsAt) : null,
    },
  })

  return NextResponse.json(business, { status: 201 })
}
