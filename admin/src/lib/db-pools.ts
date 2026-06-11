import { Pool } from 'pg'

/**
 * Shared pg Pool for Prisma DB — minimal size since this is an admin dashboard
 * with at most 1-2 concurrent users.
 */

const globalForPools = globalThis as unknown as {
  repondlyPool: Pool | null
}

export function getRepondlyPool(): Pool {
  if (!globalForPools.repondlyPool) {
    globalForPools.repondlyPool = new Pool({
      connectionString: process.env.DATABASE_URL as string,
      max: 2,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 5000,
    })
  }
  return globalForPools.repondlyPool
}
