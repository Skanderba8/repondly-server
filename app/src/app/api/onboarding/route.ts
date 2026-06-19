import { CatalogItemType, ChannelType, Plan, Prisma } from '@prisma/client'
import { NextResponse } from 'next/server'
import { buildUniqueBusinessSlug, isValidEmail, normalizeEmail } from '@/lib/auth-utils'
import { requireBusinessApiSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { ProductVariant } from '@/types'

type ImageBody = {
  category?: string
  dataUrl?: string
  mimeType?: string
  sizeBytes?: number
  position?: number
}

type ProductBody = {
  type?: CatalogItemType
  name?: string
  description?: string
  price?: number | string
  deliveryFee?: number | string
  stock?: number | string | null
  fournisseur?: string
  variants?: unknown
  images?: ImageBody[]
  isActive?: boolean
}

type ChannelBody = {
  channel?: ChannelType
  label?: string
  selected?: boolean
}

type BotBody = {
  botEnabled?: boolean
  botName?: string
  botMode?: string
  botWorkingHoursStart?: string
  botWorkingHoursEnd?: string
  botKnowledge?: string
  botHandoffKeywords?: string
}

type OnboardingBody = {
  plan?: Plan
  business?: {
    name?: string
    email?: string
    phone?: string
    businessType?: string
    tone?: string
  }
  images?: ImageBody[]
  products?: ProductBody[]
  bot?: BotBody
  channels?: ChannelBody[]
}

const SUPPORTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const SUPPORTED_BUSINESS_IMAGE_CATEGORIES = new Set(['logo', 'storefront', 'menu', 'catalog', 'reference'])
const SUPPORTED_CHANNELS = new Set<ChannelType>([ChannelType.WHATSAPP, ChannelType.MESSENGER, ChannelType.INSTAGRAM])
const MAX_PRODUCT_IMAGES = 3
const MAX_BUSINESS_IMAGES = 12
const MAX_IMAGE_BYTES = 700_000

function parseMoney(value: number | string | undefined, fallback = '0') {
  const normalized = value === undefined || value === '' ? fallback : value
  return new Prisma.Decimal(normalized).toDecimalPlaces(2)
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

function parsePlan(value: OnboardingBody['plan']) {
  return value && Object.values(Plan).includes(value) ? value : Plan.ESSENTIEL
}

function normalizeOptional(value?: string) {
  const normalized = value?.trim() ?? ''
  return normalized || null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function parseVariants(value: unknown): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  if (!Array.isArray(value)) {
    return Prisma.JsonNull
  }

  const variants: ProductVariant[] = value
    .slice(0, 6)
    .filter((item) => isRecord(item) && typeof item.name === 'string' && Array.isArray(item.values))
    .map((item) => ({
        name: item.name.trim().slice(0, 40),
        values: (item.values as unknown[])
        .filter((option: unknown): option is string => typeof option === 'string')
        .map((option: string) => option.trim().slice(0, 40))
        .filter((option: string) => option.length > 0)
        .slice(0, 20),
      priceMode: item.priceMode === 'different' ? 'different' : 'same',
      stockMode: item.stockMode === 'different' ? 'different' : 'same',
      priceDetails: typeof item.priceDetails === 'string' ? item.priceDetails.trim().slice(0, 160) : '',
      stockDetails: typeof item.stockDetails === 'string' ? item.stockDetails.trim().slice(0, 160) : '',
    }))
    .filter((item) => item.name && item.values.length > 0)

  return variants.length > 0 ? variants as unknown as Prisma.InputJsonValue : Prisma.JsonNull
}

function parseImages(images: ImageBody[] | undefined, maxImages: number, withCategory: boolean) {
  if (!Array.isArray(images)) {
    return []
  }

  return images.slice(0, maxImages).flatMap((image, index) => {
    const dataUrl = image.dataUrl?.trim()
    const mimeType = image.mimeType?.trim()
    const sizeBytes = Number(image.sizeBytes)
    const category = image.category?.trim() ?? 'reference'

    if (!dataUrl || !mimeType || !SUPPORTED_IMAGE_TYPES.has(mimeType) || !Number.isInteger(sizeBytes) || sizeBytes <= 0 || sizeBytes > MAX_IMAGE_BYTES) {
      return []
    }

    if (!dataUrl.startsWith(`data:${mimeType};base64,`)) {
      return []
    }

    if (withCategory && !SUPPORTED_BUSINESS_IMAGE_CATEGORIES.has(category)) {
      return []
    }

    return [{
      ...(withCategory ? { category } : {}),
      dataUrl,
      mimeType,
      sizeBytes,
      position: index,
    }]
  })
}

function parseProducts(products: ProductBody[] | undefined) {
  if (!Array.isArray(products)) {
    return []
  }

  return products.flatMap((product) => {
    const name = product.name?.trim()
    const type = parseType(product.type)
    const price = parseMoney(product.price)

    if (!name || price.lt(0)) {
      return []
    }

    return [{
      type,
      name,
      description: normalizeOptional(product.description),
      price,
      deliveryFee: type === CatalogItemType.SERVICE ? new Prisma.Decimal(0) : parseMoney(product.deliveryFee),
      stock: type === CatalogItemType.SERVICE ? null : parseStock(product.stock),
      fournisseur: normalizeOptional(product.fournisseur),
      variants: parseVariants(product.variants),
      images: parseImages(product.images, MAX_PRODUCT_IMAGES, false),
      isActive: product.isActive ?? true,
    }]
  })
}

export async function POST(request: Request) {
  const { response, session } = await requireBusinessApiSession()

  if (response || !session) {
    return response
  }

  const body = (await request.json()) as OnboardingBody
  const name = body.business?.name?.trim() ?? ''
  const email = normalizeEmail(body.business?.email ?? '')
  const phone = body.business?.phone?.trim() ?? ''
  const businessType = body.business?.businessType?.trim() ?? ''
  const tone = body.business?.tone?.trim() ?? ''
  const botKnowledge = body.bot?.botKnowledge?.trim() ?? ''

  if (!name) {
    return NextResponse.json({ success: false, error: "Le nom de l'entreprise est obligatoire." }, { status: 400 })
  }

  if (!isValidEmail(email)) {
    return NextResponse.json({ success: false, error: 'Veuillez saisir une adresse email valide.' }, { status: 400 })
  }

  if (!phone) {
    return NextResponse.json({ success: false, error: 'Le numero de telephone est obligatoire.' }, { status: 400 })
  }

  if (botKnowledge.length > 8000) {
    return NextResponse.json({ success: false, error: 'La base de connaissances est trop longue.' }, { status: 400 })
  }

  const existingByEmail = await prisma.business.findFirst({
    where: {
      email,
      id: { not: session.user.id },
    },
    select: { id: true },
  })

  if (existingByEmail) {
    return NextResponse.json({ success: false, error: 'Cette adresse email est deja utilisee.' }, { status: 409 })
  }

  const existingByPhone = await prisma.business.findFirst({
    where: {
      phone,
      id: { not: session.user.id },
    },
    select: { id: true },
  })

  if (existingByPhone) {
    return NextResponse.json({ success: false, error: 'Ce numero de telephone est deja utilise.' }, { status: 409 })
  }

  const currentBusiness = await prisma.business.findUnique({
    where: { id: session.user.id },
    select: { name: true, slug: true },
  })

  if (!currentBusiness) {
    return NextResponse.json({ success: false, error: 'Entreprise introuvable.' }, { status: 404 })
  }

  const slug = currentBusiness.name === name ? currentBusiness.slug : await buildUniqueBusinessSlug(name)
  const businessImages = parseImages(body.images, MAX_BUSINESS_IMAGES, true)
  const products = parseProducts(body.products)
  const selectedChannels = Array.isArray(body.channels)
    ? body.channels.filter((channel) => channel.selected && channel.channel && SUPPORTED_CHANNELS.has(channel.channel))
    : []

  await prisma.$transaction(async (tx) => {
    await tx.business.update({
      where: { id: session.user.id },
      data: {
        name,
        email,
        phone,
        slug,
        plan: parsePlan(body.plan),
        businessType: businessType || null,
        tone: tone || null,
        botEnabled: body.bot?.botEnabled ?? true,
        botName: normalizeOptional(body.bot?.botName),
        botMode: normalizeOptional(body.bot?.botMode) ?? 'professionnel',
        botWorkingHoursStart: normalizeOptional(body.bot?.botWorkingHoursStart),
        botWorkingHoursEnd: normalizeOptional(body.bot?.botWorkingHoursEnd),
        botKnowledge: botKnowledge || null,
        botHandoffKeywords: normalizeOptional(body.bot?.botHandoffKeywords),
        onboardingCompletedAt: new Date(),
      },
    })

    await tx.businessImage.deleteMany({
      where: { businessId: session.user.id },
    })

    if (businessImages.length > 0) {
      await tx.businessImage.createMany({
        data: businessImages.map((image) => ({
          businessId: session.user.id,
          category: image.category ?? 'reference',
          dataUrl: image.dataUrl,
          mimeType: image.mimeType,
          sizeBytes: image.sizeBytes,
          position: image.position,
        })),
      })
    }

    for (const product of products) {
      await tx.product.create({
        data: {
          businessId: session.user.id,
          type: product.type,
          name: product.name,
          description: product.description,
          price: product.price,
          deliveryFee: product.deliveryFee,
          stock: product.stock,
          fournisseur: product.fournisseur,
          variants: product.variants,
          isActive: product.isActive,
          images: {
            create: product.images,
          },
        },
      })
    }

    for (const channel of selectedChannels) {
      const existingConnection = await tx.businessChannelConnection.findFirst({
        where: {
          businessId: session.user.id,
          channel: channel.channel,
        },
        select: { id: true, status: true },
      })

      if (existingConnection) {
        await tx.businessChannelConnection.update({
          where: { id: existingConnection.id },
          data: {
            label: normalizeOptional(channel.label),
            status: existingConnection.status === 'ACTIVE' ? 'ACTIVE' : 'PENDING',
          },
        })
      } else {
        await tx.businessChannelConnection.create({
          data: {
            businessId: session.user.id,
            channel: channel.channel as ChannelType,
            label: normalizeOptional(channel.label),
            status: 'PENDING',
          },
        })
      }
    }
  })

  return NextResponse.json({ success: true })
}
