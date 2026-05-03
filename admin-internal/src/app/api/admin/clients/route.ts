import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { createChatwootAccount, inviteChatwootUser } from '@/lib/chatwoot'

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

  // 1. Create the Business in your PostgreSQL database first
  let business = await prisma.business.create({
    data: {
      name,
      email,
      passwordHash,
      plan: (plan ?? 'FREE') as 'FREE' | 'STARTER' | 'PRO' | 'BUSINESS',
      trialEndsAt: trialEndsAt ? new Date(trialEndsAt) : null,
    },
  })

  // 2. Provision the headless Chatwoot background environment
  try {
    // Action 1: Create the Chatwoot workspace
    const cwAccount = await createChatwootAccount(name)

    // Action 2: Attach the client's email to it internally
    await inviteChatwootUser(cwAccount.id, name, email)

    // Action 3: Permanently link the Chatwoot ID to your Prisma Business model
    business = await prisma.business.update({
      where: { id: business.id },
      data: { chatwootAccountId: cwAccount.id }
    })

    return NextResponse.json(business, { status: 201 })
  } catch (error) {
    console.error('Chatwoot Provisioning Error:', error)
    
    // If Chatwoot fails (e.g. network issue), we still return the created Prisma business
    // but we attach a warning so the frontend/admin knows manual intervention is needed.
    return NextResponse.json(
      { ...business, warning: 'Business created, but Chatwoot auto-provisioning failed.' },
      { status: 201 }
    )
  }
}