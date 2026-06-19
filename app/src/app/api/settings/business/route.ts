import { NextResponse } from 'next/server'
import {
  buildUniqueBusinessSlug,
  isValidEmail,
  isValidPhone,
  normalizeEmail,
  normalizePhone,
} from '@/lib/auth-utils'
import { requireBusinessApiSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type UpdateBusinessBody = {
  name?: string
  phone?: string
  email?: string
  businessType?: string
  tone?: string
}

type DeleteBusinessBody = {
  confirm?: string
}

export async function PATCH(request: Request) {
  const { response, session } = await requireBusinessApiSession()

  if (response || !session) {
    return response
  }

  const body = (await request.json()) as UpdateBusinessBody
  const name = body.name?.trim() ?? ''
  const phone = normalizePhone(body.phone ?? '')
  const email = normalizeEmail(body.email ?? '')
  const businessType = body.businessType?.trim() ?? ''
  const tone = body.tone?.trim() ?? ''

  if (!name) {
    return NextResponse.json({ success: false, error: "Le nom de l'entreprise est obligatoire." }, { status: 400 })
  }

  if (!isValidPhone(phone)) {
    return NextResponse.json({ success: false, error: 'Veuillez saisir un numéro de téléphone valide.' }, { status: 400 })
  }

  if (!isValidEmail(email)) {
    return NextResponse.json({ success: false, error: 'Veuillez saisir une adresse email valide.' }, { status: 400 })
  }

  const existingByPhone = await prisma.business.findFirst({
    where: {
      phone,
      id: { not: session.user.id },
    },
    select: { id: true },
  })

  if (existingByPhone) {
    return NextResponse.json({ success: false, error: 'Ce numéro de téléphone est déjà utilisé.' }, { status: 409 })
  }

  const existingByEmail = await prisma.business.findFirst({
    where: {
      email,
      id: { not: session.user.id },
    },
    select: { id: true },
  })

  if (existingByEmail) {
    return NextResponse.json({ success: false, error: 'Cette adresse email est déjà utilisée.' }, { status: 409 })
  }

  const currentBusiness = await prisma.business.findUnique({
    where: { id: session.user.id },
    select: { slug: true, name: true },
  })

  const slug = currentBusiness && currentBusiness.name === name
    ? currentBusiness.slug
    : await buildUniqueBusinessSlug(name)

  const business = await prisma.business.update({
    where: { id: session.user.id },
    data: {
      name,
      phone,
      email,
      businessType: businessType || null,
      tone: tone || null,
      slug,
    },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      businessType: true,
      tone: true,
      slug: true,
    },
  })

  return NextResponse.json({ success: true, data: business })
}

export async function DELETE(request: Request) {
  const { response, session } = await requireBusinessApiSession()

  if (response || !session) {
    return response
  }

  const body = await request.json() as DeleteBusinessBody

  if (body.confirm !== 'SUPPRIMER') {
    return NextResponse.json({ success: false, error: 'Confirmation invalide.' }, { status: 400 })
  }

  await prisma.business.delete({
    where: { id: session.user.id },
  })

  return NextResponse.json({ success: true })
}
