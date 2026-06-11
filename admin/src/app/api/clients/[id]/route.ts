import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req)
  if (auth instanceof NextResponse) return auth

  const { id } = await params

  const business = await prisma.business.findUnique({
    where: { id },
    include: {
      adminNotes: {
        orderBy: { createdAt: 'desc' },
        select: { id: true, content: true, createdAt: true },
      },
    },
  })

  if (!business) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(business)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req)
  if (auth instanceof NextResponse) return auth

  const { id } = await params
  const body = await req.json()

  const {
    name, email, phone, plan, planStatus, trialEndsAt,
    newPassword,
  } = body

  const data: Record<string, unknown> = {}
  if (name !== undefined) data.name = name
  if (email !== undefined) data.email = email
  if (phone !== undefined) data.phone = phone ?? null
  if (plan !== undefined) data.plan = plan
  if (planStatus !== undefined) data.planStatus = planStatus
  if (trialEndsAt !== undefined) data.trialEndsAt = trialEndsAt ? new Date(trialEndsAt) : null

  // Password reset
  if (newPassword) {
    data.passwordHash = await bcrypt.hash(newPassword, 12)
  }

  const updated = await prisma.business.update({
    where: { id },
    data,
    include: {
      adminNotes: {
        orderBy: { createdAt: 'desc' },
        select: { id: true, content: true, createdAt: true },
      },
    },
  })

  return NextResponse.json(updated)
}
