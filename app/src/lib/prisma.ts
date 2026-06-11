import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

// 1. Create the pg connection pool
const connectionString = process.env.DATABASE_URL as string
const pool = new Pool({ connectionString })

// 2. Initialize the Prisma adapter with the pool
const adapter = new PrismaPg(pool)

// 3. Pass the adapter to the PrismaClient
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}