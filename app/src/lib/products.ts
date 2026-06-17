import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import type { Product } from '@/types'

type ProductRecord = Prisma.ProductGetPayload<{
  include: {
    images: true
  }
}>

function formatDecimal(value: Prisma.Decimal | number | string) {
  return new Prisma.Decimal(value).toFixed(2)
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
