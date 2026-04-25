import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req)
  if (auth instanceof NextResponse) return auth

  const { id } = await params
  const business = await prisma.business.findUnique({
    where: { id },
    include: {
      onboarding: true,
      autoRules: { orderBy: { createdAt: 'desc' } },
      activityLogs: { orderBy: { createdAt: 'desc' }, take: 50 },
      adminNotes: { orderBy: { createdAt: 'desc' } },
    },
  })

  if (!business) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(business)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req)
  if (auth instanceof NextResponse) return auth

  const { id } = await params
  const body = await req.json()

  const allowedFields = [
    'name', 'email', 'plan', 'status', 'trialEndsAt', 'chatwootAccountId',
    'chatwootApiToken', 'paidThisMonth', 'paymentMethod', 'channels', 'businessInfo',
  ]
  const data: Record<string, unknown> = {}
  for (const key of allowedFields) {
    if (key in body) data[key] = body[key]
  }

  if (body.newPassword) {
    data.passwordHash = await bcrypt.hash(body.newPassword, 10)
  }

  const business = await prisma.business.update({ where: { id }, data })
  return NextResponse.json(business)
}
