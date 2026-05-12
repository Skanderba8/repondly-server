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
      autoRules: {
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, trigger: true, responseTemplate: true, active: true },
      },
      activityLogs: {
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: { id: true, action: true, metadata: true, createdAt: true },
      },
      adminNotes: {
        orderBy: { createdAt: 'desc' },
        select: { id: true, content: true, createdAt: true },
      },
    },
  })

  if (!business) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Never return the hashed password
  const { password: _pw, ...safe } = business as typeof business & { password?: string }
  return NextResponse.json(safe)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req)
  if (auth instanceof NextResponse) return auth

  const { id } = await params
  const body = await req.json()

  // Fields allowed to be updated
  const {
    name, email, phone, plan, status, trialEndsAt,
    chatwootAccountId, chatwootApiToken,
    newPassword,
  } = body

  const data: Record<string, unknown> = {}
  if (name !== undefined) data.name = name
  if (email !== undefined) data.email = email
  if (phone !== undefined) data.phone = phone ?? null
  if (plan !== undefined) data.plan = plan
  if (status !== undefined) data.status = status
  if (trialEndsAt !== undefined) data.trialEndsAt = trialEndsAt ? new Date(trialEndsAt) : null
  if (chatwootAccountId !== undefined) data.chatwootAccountId = chatwootAccountId ? Number(chatwootAccountId) : null
  if (chatwootApiToken !== undefined) data.chatwootApiToken = chatwootApiToken || null

  // Password reset
  if (newPassword) {
    data.password = await bcrypt.hash(newPassword, 12)
    // Log it
    await prisma.activityLog.create({
      data: {
        businessId: id,
        action: 'Mot de passe réinitialisé par un administrateur',
        metadata: {},
      },
    })
  }

  // Log status changes
  if (status !== undefined) {
    await prisma.activityLog.create({
      data: {
        businessId: id,
        action: `Statut changé en ${status} par un administrateur`,
        metadata: {},
      },
    }).catch(() => null) // non-blocking
  }

  const updated = await prisma.business.update({
    where: { id },
    data,
    include: {
      autoRules: {
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, trigger: true, responseTemplate: true, active: true },
      },
      activityLogs: {
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: { id: true, action: true, metadata: true, createdAt: true },
      },
      adminNotes: {
        orderBy: { createdAt: 'desc' },
        select: { id: true, content: true, createdAt: true },
      },
    },
  })

  const { password: _pw2, ...safe } = updated as typeof updated & { password?: string }
  return NextResponse.json(safe)
}