import { prisma } from '@/lib/prisma'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_PATTERN = /^[0-9+\s().-]{8,20}$/
const LOGIN_WINDOW_MS = 15 * 60 * 1000
const LOGIN_BLOCK_MS = 15 * 60 * 1000
const LOGIN_MAX_ATTEMPTS = 5

type AttemptRecord = {
  count: number
  firstAttemptAt: number
  blockedUntil: number | null
}

const loginAttempts = new Map<string, AttemptRecord>()

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
    .replace(/[\u0300-\u036f]/g, '')
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

export function getClientIp(headers: Headers) {
  const forwardedFor = headers.get('x-forwarded-for')

  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || 'unknown'
  }

  return headers.get('x-real-ip')?.trim() || 'unknown'
}

function getAttemptKey(email: string, ip: string) {
  return `${normalizeEmail(email)}:${ip}`
}

export function canAttemptLogin(email: string, ip: string) {
  const key = getAttemptKey(email, ip)
  const now = Date.now()
  const record = loginAttempts.get(key)

  if (!record) {
    return true
  }

  if (record.blockedUntil && record.blockedUntil > now) {
    return false
  }

  if (now - record.firstAttemptAt > LOGIN_WINDOW_MS) {
    loginAttempts.delete(key)
    return true
  }

  return true
}

export function registerFailedLogin(email: string, ip: string) {
  const key = getAttemptKey(email, ip)
  const now = Date.now()
  const current = loginAttempts.get(key)

  if (!current || now - current.firstAttemptAt > LOGIN_WINDOW_MS) {
    loginAttempts.set(key, {
      count: 1,
      firstAttemptAt: now,
      blockedUntil: null,
    })

    return
  }

  const nextCount = current.count + 1
  loginAttempts.set(key, {
    count: nextCount,
    firstAttemptAt: current.firstAttemptAt,
    blockedUntil: nextCount >= LOGIN_MAX_ATTEMPTS ? now + LOGIN_BLOCK_MS : null,
  })
}

export function clearFailedLogins(email: string, ip: string) {
  loginAttempts.delete(getAttemptKey(email, ip))
}
