import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL is required')
}

const adapter = new PrismaPg(new Pool({ connectionString }))

declare global {
  var __repondlyPrisma: PrismaClient | undefined
}

export const prisma =
  globalThis.__repondlyPrisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalThis.__repondlyPrisma = prisma
}
