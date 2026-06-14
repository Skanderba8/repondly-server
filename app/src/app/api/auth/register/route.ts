import bcrypt from 'bcryptjs'
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

const PASSWORD_SALT_ROUNDS = 12

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

  const slug = await buildUniqueBusinessSlug(name)
  const passwordHash = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS)

  const business = await prisma.business.create({
    data: {
      name,
      phone,
      email,
      slug,
      passwordHash,
    },
    select: {
      id: true,
      slug: true,
    },
  })

  return NextResponse.json({
    success: true,
    data: {
      id: business.id,
      slug: business.slug,
    },
  })
}
