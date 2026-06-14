import { prisma } from '@/lib/prisma'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_PATTERN = /^[0-9+\s().-]{8,20}$/

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase()
}

export function normalizePhone(value: string) {
  return value.trim().replace(/\s+/g, ' ')
}

export function isValidEmail(value: string) {
  return EMAIL_PATTERN.test(normalizeEmail(value))
}

export function isValidPhone(value: string) {
  return PHONE_PATTERN.test(normalizePhone(value))
}

export function isValidPassword(value: string) {
  return value.trim().length >= 8
}

export function slugifyBusinessName(value: string) {
  const slug = value
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

  return slug || 'compte'
}

export async function buildUniqueBusinessSlug(name: string) {
  const baseSlug = slugifyBusinessName(name)
  let slug = baseSlug
  let suffix = 1

  while (await prisma.business.findUnique({ where: { slug }, select: { id: true } })) {
    suffix += 1
    slug = `${baseSlug}-${suffix}`
  }

  return slug
}
