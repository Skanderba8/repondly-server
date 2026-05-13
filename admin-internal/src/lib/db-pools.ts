import { Pool } from 'pg'

/**
 * Shared pg Pools — minimal sizes since this is an admin dashboard
 * with at most 1-2 concurrent users.
 */

const chatwootUrl = process.env.DATABASE_URL_CHATWOOT

const globalForPools = globalThis as unknown as {
  chatwootPool: Pool | null
  repondlyPool: Pool | null
}

export function getChatwootPool(): Pool | null {
  if (!chatwootUrl) return null

  if (!globalForPools.chatwootPool) {
    globalForPools.chatwootPool = new Pool({
      connectionString: chatwootUrl,
      max: 2,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 5000,
    })
  }
  return globalForPools.chatwootPool
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
