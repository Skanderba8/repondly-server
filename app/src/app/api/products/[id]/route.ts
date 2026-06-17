import { CatalogItemType, Prisma } from '@prisma/client'
import { NextResponse } from 'next/server'
import { requireBusinessApiSession } from '@/lib/auth'
import { mapProduct } from '@/lib/products'
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

function parseType(value: ProductBody['type']) {
  if (value === undefined) {
    return undefined
  }

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
  const type = parseType(body.type)

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
      ...(type !== undefined ? { type } : {}),
      ...(name !== undefined ? { name } : {}),
      ...(body.description !== undefined ? { description: body.description.trim() || null } : {}),
      ...(price !== undefined ? { price } : {}),
      ...(type === CatalogItemType.SERVICE ? { deliveryFee: new Prisma.Decimal(0), stock: null } : {}),
      ...(type !== CatalogItemType.SERVICE && deliveryFee !== undefined ? { deliveryFee } : {}),
      ...(type !== CatalogItemType.SERVICE && body.stock !== undefined ? { stock: parseStock(body.stock) } : {}),
      ...(body.fournisseur !== undefined ? { fournisseur: body.fournisseur.trim() || null } : {}),
      ...(body.images !== undefined
        ? {
            images: {
              deleteMany: {},
              create: parseImages(body.images),
            },
          }
        : {}),
      ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
    },
    include: {
      images: {
        orderBy: { position: 'asc' },
      },
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
    include: {
      images: {
        orderBy: { position: 'asc' },
      },
    },
  })

  return NextResponse.json({ success: true, data: mapProduct(updatedProduct) })
}
