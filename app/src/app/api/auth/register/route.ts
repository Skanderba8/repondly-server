import type { CookieOptions } from '@supabase/ssr'
import { Prisma } from '@prisma/client'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import {
  buildUniqueBusinessSlug,
  isValidEmail,
  isValidPassword,
  isValidPhone,
  normalizeEmail,
  normalizePhone,
} from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { mapSupabaseAuthErrorMessage } from '@/lib/supabase/auth-errors'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { createRouteHandlerSupabaseClient } from '@/lib/supabase/server'

type RegisterBody = {
  name?: string
  phone?: string
  email?: string
  password?: string
}

export async function POST(request: Request) {
  const body = (await request.json()) as RegisterBody
  const name = body.name?.trim() ?? ''
  const phone = normalizePhone(body.phone ?? '')
  const email = normalizeEmail(body.email ?? '')
  const password = body.password ?? ''

  if (!name) {
    return NextResponse.json({ success: false, error: "Le nom de l'entreprise est obligatoire." }, { status: 400 })
  }

  if (!isValidPhone(phone)) {
    return NextResponse.json({ success: false, error: 'Veuillez saisir un numéro de téléphone valide.' }, { status: 400 })
  }

  if (!isValidEmail(email)) {
    return NextResponse.json({ success: false, error: 'Veuillez saisir une adresse email valide.' }, { status: 400 })
  }

  if (!isValidPassword(password)) {
    return NextResponse.json({ success: false, error: 'Le mot de passe doit contenir au moins 8 caractères.' }, { status: 400 })
  }

  const [existingByEmail, existingByPhone] = await Promise.all([
    prisma.business.findUnique({ where: { email }, select: { id: true } }),
    prisma.business.findUnique({ where: { phone }, select: { id: true } }),
  ])

  if (existingByEmail || existingByPhone) {
    return NextResponse.json(
      { success: false, error: 'Impossible de créer le compte avec ces informations.' },
      { status: 409 },
    )
  }

  const cookieStore = await cookies()
  const pendingCookies: Array<{ name: string; value: string; options: CookieOptions }> = []
  const supabase = createRouteHandlerSupabaseClient({
    getAll() {
      return cookieStore.getAll().map(({ name, value }) => ({ name, value }))
    },
    setAll(cookiesToSet) {
      pendingCookies.push(...cookiesToSet)
    },
  })

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        businessName: name,
      },
    },
  })

  if (signUpError || !signUpData.user?.id) {
    return NextResponse.json(
      { success: false, error: mapSupabaseAuthErrorMessage(signUpError?.message, 'Impossible de créer le compte.') },
      { status: 400 },
    )
  }

  const authUserId = signUpData.user.id

  try {
    const slug = await buildUniqueBusinessSlug(name)
    const business = await prisma.business.create({
      data: {
        authUserId,
        name,
        phone,
        email,
        slug,
      },
      select: {
        id: true,
        slug: true,
      },
    })

    const response = NextResponse.json({
      success: true,
      data: {
        id: business.id,
        slug: business.slug,
      },
    })

    pendingCookies.forEach(({ name: cookieName, value, options }) => {
      response.cookies.set(cookieName, value, options)
    })

    return response
  } catch (error) {
    const adminClient = createAdminSupabaseClient()
    const { error: rollbackError } = await adminClient.auth.admin.deleteUser(authUserId)

    if (rollbackError) {
      return NextResponse.json(
        {
          success: false,
          error: "Le compte d'authentification a été créé mais le profil entreprise n'a pas pu être finalisé. Supprimez l'utilisateur Supabase orphelin avant de réessayer.",
        },
        { status: 500 },
      )
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'Impossible de créer le compte avec ces informations.' },
        { status: 409 },
      )
    }

    return NextResponse.json({ success: false, error: 'Impossible de créer le compte.' }, { status: 500 })
  }
}
