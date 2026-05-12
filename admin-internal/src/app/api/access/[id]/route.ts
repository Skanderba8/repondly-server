import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // SUPER_ADMIN only
  const authResult = await requireAdmin(request, 'SUPER_ADMIN')
  if (authResult instanceof NextResponse) return authResult

  try {
    const { id } = await params
    const body = await request.json()
    const { active, role, password } = body as {
      active?: boolean
      role?: 'SUPER_ADMIN' | 'ADMIN'
      password?: string
    }

    // Verify the target user exists
    const existing = await prisma.adminUser.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Administrateur introuvable' },
        { status: 404 }
      )
    }

    if (role !== undefined && !['SUPER_ADMIN', 'ADMIN'].includes(role)) {
      return NextResponse.json(
        { error: 'Rôle invalide. Valeurs acceptées : SUPER_ADMIN, ADMIN' },
        { status: 400 }
      )
    }

    const data: Record<string, unknown> = {}

    if (active !== undefined) {
      data.active = active
      // If deactivating, update lastLoginAt to force JWT token re-validation
      // (JWT sessions can't be truly invalidated server-side without a session store)
      if (active === false) {
        data.lastLoginAt = new Date()
      }
    }

    if (role !== undefined) {
      data.role = role
    }

    if (password !== undefined && password !== '') {
      data.passwordHash = await bcrypt.hash(password, 12)
    }

    const user = await prisma.adminUser.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        lastLoginAt: true,
        createdAt: true,
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('[PATCH /api/admin/access/[id]]', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // SUPER_ADMIN only
  const authResult = await requireAdmin(request, 'SUPER_ADMIN')
  if (authResult instanceof NextResponse) return authResult

  try {
    const { id } = await params

    // Verify the target user exists
    const existing = await prisma.adminUser.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Administrateur introuvable' },
        { status: 404 }
      )
    }

    // Ensure at least one active SUPER_ADMIN remains after deletion
    const activeSuperAdmins = await prisma.adminUser.count({
      where: {
        role: 'SUPER_ADMIN',
        active: true,
      },
    })

    const isDeletingActiveSuperAdmin =
      existing.role === 'SUPER_ADMIN' && existing.active

    if (isDeletingActiveSuperAdmin && activeSuperAdmins <= 1) {
      return NextResponse.json(
        {
          error:
            'Impossible de supprimer le dernier SUPER_ADMIN actif. Créez ou activez un autre SUPER_ADMIN avant de procéder.',
        },
        { status: 400 }
      )
    }

    await prisma.adminUser.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/admin/access/[id]]', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
