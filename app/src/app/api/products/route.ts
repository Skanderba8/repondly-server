import { CatalogItemType, Prisma } from '@prisma/client'
import { NextResponse } from 'next/server'
import { requireBusinessApiSession } from '@/lib/auth'
import { getProducts, mapProduct } from '@/lib/products'
import { prisma } from '@/lib/prisma'

type ProductBody = {
  type?: CatalogItemType
  name?: string
  description?: string
  price?: number | string
  deliveryFee?: number | string
  stock?: number | string | null
  fournisseur?: string
  images?: ProductImageBody[]
  isActive?: boolean
}

type ProductImageBody = {
  dataUrl?: string
  mimeType?: string
  sizeBytes?: number
  position?: number
}

const SUPPORTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_IMAGES = 3
const MAX_IMAGE_BYTES = 700_000

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

function parseType(value: ProductBody['type']) {
  return value === CatalogItemType.SERVICE ? CatalogItemType.SERVICE : CatalogItemType.PRODUCT
}

function parseImages(images: ProductBody['images']) {
  if (!Array.isArray(images)) {
    return []
  }

  return images.slice(0, MAX_IMAGES).flatMap((image, index) => {
    const dataUrl = image.dataUrl?.trim()
    const mimeType = image.mimeType?.trim()
    const sizeBytes = Number(image.sizeBytes)

    if (!dataUrl || !mimeType || !SUPPORTED_IMAGE_TYPES.has(mimeType) || !Number.isInteger(sizeBytes) || sizeBytes <= 0 || sizeBytes > MAX_IMAGE_BYTES) {
      return []
    }

    if (!dataUrl.startsWith(`data:${mimeType};base64,`)) {
      return []
    }

    return [{
      dataUrl,
      mimeType,
      sizeBytes,
      position: index,
    }]
  })
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
  const type = parseType(body.type)

  if (!name) {
    return NextResponse.json({ success: false, error: 'Le nom est obligatoire.' }, { status: 400 })
  }

  if (price.lt(0)) {
    return NextResponse.json({ success: false, error: 'Le prix est invalide.' }, { status: 400 })
  }

  const product = await prisma.product.create({
    data: {
      businessId: session.user.id,
      type,
      name,
      description: body.description?.trim() || null,
      price,
      deliveryFee: type === CatalogItemType.SERVICE ? new Prisma.Decimal(0) : parseMoney(body.deliveryFee),
      stock: type === CatalogItemType.SERVICE ? null : parseStock(body.stock),
      fournisseur: body.fournisseur?.trim() || null,
      images: {
        create: parseImages(body.images),
      },
      isActive: body.isActive ?? true,
    },
    include: {
      images: {
        orderBy: { position: 'asc' },
      },
    },
  })

  return NextResponse.json({ success: true, data: mapProduct(product) }, { status: 201 })
}
