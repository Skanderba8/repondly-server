import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import type { Product, ProductVariant } from '@/types'

type ProductRecord = Prisma.ProductGetPayload<{
  include: {
    images: true
  }
}> & {
  variants?: unknown
}

function formatDecimal(value: Prisma.Decimal | number | string) {
  return new Prisma.Decimal(value).toFixed(2)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function parseVariants(value: unknown): ProductVariant[] {
  if (!Array.isArray(value)) {
    return []
  }

  const variants = value
    .filter((item) => isRecord(item) && typeof item.name === 'string' && Array.isArray(item.values))
    .map((item) => ({
      name: item.name.trim(),
      values: (item.values as unknown[]).filter((option: unknown): option is string => typeof option === 'string').map((option: string) => option.trim()).filter((option: string) => option.length > 0),
    }))
    .filter((item) => item.name && item.values.length > 0)

  const grouped = new Map<string, ProductVariant>()

  for (const variant of variants) {
    const key = variant.name.toLowerCase()
    const existing = grouped.get(key)

    if (existing) {
      existing.values = [...new Set([...existing.values, ...variant.values])]
      continue
    }

    grouped.set(key, {
      name: variant.name,
      values: [...new Set(variant.values)],
    })
  }

  return Array.from(grouped.values())
}

export function mapProduct(product: ProductRecord): Product {
  return {
    id: product.id,
    type: product.type,
    name: product.name,
    description: product.description ?? undefined,
    price: formatDecimal(product.price),
    deliveryFee: formatDecimal(product.deliveryFee),
    stock: product.stock,
    fournisseur: product.fournisseur ?? undefined,
    variants: parseVariants(product.variants),
    images: product.images.map((image) => ({
      id: image.id,
      dataUrl: image.dataUrl,
      mimeType: image.mimeType,
      sizeBytes: image.sizeBytes,
      position: image.position,
    })),
    isActive: product.isActive,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  }
}

export async function getProducts(businessId: string, search?: string) {
  const query = search?.trim()
  const products = await prisma.product.findMany({
    where: {
      businessId,
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } },
              { fournisseur: { contains: query, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    orderBy: [
      { isActive: 'desc' },
      { updatedAt: 'desc' },
    ],
    include: {
      images: {
        orderBy: { position: 'asc' },
      },
    },
  })

  return products.map(mapProduct)
}
