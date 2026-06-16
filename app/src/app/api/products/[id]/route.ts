import { Prisma } from '@prisma/client'
import { NextResponse } from 'next/server'
import { requireBusinessApiSession } from '@/lib/auth'
import { mapProduct } from '@/lib/products'
import { prisma } from '@/lib/prisma'

type ProductBody = {
  name?: string
  description?: string
  price?: number | string
  deliveryFee?: number | string
  stock?: number | string | null
  fournisseur?: string
  isActive?: boolean
}

function parseMoney(value: number | string | undefined) {
  if (value === undefined) {
    return undefined
  }

  return new Prisma.Decimal(value).toDecimalPlaces(2)
}

function parseStock(value: ProductBody['stock']) {
  if (value === undefined) {
    return undefined
  }

  if (value === null || value === '') {
    return null
  }

  const stock = Number(value)
  return Number.isInteger(stock) && stock >= 0 ? stock : null
}

async function findProduct(businessId: string, id: string) {
  return prisma.product.findFirst({
    where: { id, businessId },
    select: { id: true },
  })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response, session } = await requireBusinessApiSession()

  if (response || !session) {
    return response
  }

  const { id } = await params
  const body = (await request.json()) as ProductBody
  const product = await findProduct(session.user.id, id)
  const name = body.name?.trim()

  if (!product) {
    return NextResponse.json({ success: false, error: 'Produit introuvable.' }, { status: 404 })
  }

  if (body.name !== undefined && !name) {
    return NextResponse.json({ success: false, error: 'Le nom du produit est obligatoire.' }, { status: 400 })
  }

  const price = parseMoney(body.price)
  const deliveryFee = parseMoney(body.deliveryFee)

  if (price?.lt(0) || deliveryFee?.lt(0)) {
    return NextResponse.json({ success: false, error: 'Montant invalide.' }, { status: 400 })
  }

  const updatedProduct = await prisma.product.update({
    where: { id: product.id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(body.description !== undefined ? { description: body.description.trim() || null } : {}),
      ...(price !== undefined ? { price } : {}),
      ...(deliveryFee !== undefined ? { deliveryFee } : {}),
      ...(body.stock !== undefined ? { stock: parseStock(body.stock) } : {}),
      ...(body.fournisseur !== undefined ? { fournisseur: body.fournisseur.trim() || null } : {}),
      ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
    },
  })

  return NextResponse.json({ success: true, data: mapProduct(updatedProduct) })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response, session } = await requireBusinessApiSession()

  if (response || !session) {
    return response
  }

  const { id } = await params
  const product = await findProduct(session.user.id, id)

  if (!product) {
    return NextResponse.json({ success: false, error: 'Produit introuvable.' }, { status: 404 })
  }

  const updatedProduct = await prisma.product.update({
    where: { id: product.id },
    data: { isActive: false },
  })

  return NextResponse.json({ success: true, data: mapProduct(updatedProduct) })
}
