import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { getRepondlyPool } from './db-pools'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || new PrismaClient({
  adapter: new PrismaPg(getRepondlyPool()),
})

globalForPrisma.prisma = prisma