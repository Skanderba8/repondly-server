import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET(request: NextRequest) {
  // SUPER_ADMIN only
  const authResult = await requireAdmin(request, 'SUPER_ADMIN')
  if (authResult instanceof NextResponse) return authResult

  try {
    const users = await prisma.adminUser.findMany({
      orderBy: { createdAt: 'asc' },
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

    return NextResponse.json(users)
  } catch (error) {
    console.error('[GET /api/admin/access]', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  // SUPER_ADMIN only
  const authResult = await requireAdmin(request, 'SUPER_ADMIN')
  if (authResult instanceof NextResponse) return authResult

  try {
    const body = await request.json()
    const { email, name, role, password } = body as {
      email: string
      name: string
      role: 'SUPER_ADMIN' | 'ADMIN'
      password: string
    }

    if (!email || !name || !role || !password) {
      return NextResponse.json(
        { error: 'Champs requis manquants : email, name, role, password' },
        { status: 400 }
      )
    }

    if (!['SUPER_ADMIN', 'ADMIN'].includes(role)) {
      return NextResponse.json(
        { error: 'Rôle invalide. Valeurs acceptées : SUPER_ADMIN, ADMIN' },
        { status: 400 }
      )
    }

    // Check email uniqueness
    const existing = await prisma.adminUser.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { error: 'Un administrateur avec cet email existe déjà' },
        { status: 409 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const user = await prisma.adminUser.create({
      data: {
        email,
        name,
        role,
        passwordHash,
      },
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

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error('[POST /api/admin/access]', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
