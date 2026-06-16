import { Prisma } from '@prisma/client'
import { NextResponse } from 'next/server'
import { requireBusinessApiSession } from '@/lib/auth'
import { getProducts, mapProduct } from '@/lib/products'
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

function parseMoney(value: number | string | undefined, fallback = '0') {
  return new Prisma.Decimal(value ?? fallback).toDecimalPlaces(2)
}

function parseStock(value: ProductBody['stock']) {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const stock = Number(value)
  return Number.isInteger(stock) && stock >= 0 ? stock : null
}

export async function GET(request: Request) {
  const { response, session } = await requireBusinessApiSession()

  if (response || !session) {
    return response
  }

  const { searchParams } = new URL(request.url)
  const products = await getProducts(session.user.id, searchParams.get('search') ?? undefined)

  return NextResponse.json({ success: true, data: products })
}

export async function POST(request: Request) {
  const { response, session } = await requireBusinessApiSession()

  if (response || !session) {
    return response
  }

  const body = (await request.json()) as ProductBody
  const name = body.name?.trim()
  const price = parseMoney(body.price)

  if (!name) {
    return NextResponse.json({ success: false, error: 'Le nom du produit est obligatoire.' }, { status: 400 })
  }

  if (price.lt(0)) {
    return NextResponse.json({ success: false, error: 'Le prix est invalide.' }, { status: 400 })
  }

  const product = await prisma.product.create({
    data: {
      businessId: session.user.id,
      name,
      description: body.description?.trim() || null,
      price,
      deliveryFee: parseMoney(body.deliveryFee),
      stock: parseStock(body.stock),
      fournisseur: body.fournisseur?.trim() || null,
      isActive: body.isActive ?? true,
    },
  })

  return NextResponse.json({ success: true, data: mapProduct(product) }, { status: 201 })
}
