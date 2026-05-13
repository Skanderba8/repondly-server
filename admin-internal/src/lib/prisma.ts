import { PrismaClient } from '@prisma/client'

// Use native Prisma client (no pg adapter needed for standard Node.js server).
// The adapter-pg is only needed for edge runtimes — it adds ~50MB overhead.
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || new PrismaClient({
  // Limit connection pool (Prisma's built-in pool manager)
  datasourceUrl: process.env.DATABASE_URL,
})

globalForPrisma.prisma = prisma