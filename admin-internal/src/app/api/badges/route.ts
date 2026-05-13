import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'
import { getRepondlyPool } from '@/lib/db-pools'

// ─── Types ────────────────────────────────────────────────────────────────────

type BadgesResponse = {
  trialsExpiring: number
  pendingMigrations: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Count Business records with status 'TRIAL' whose trialEndsAt falls
 * within the next 7 days (inclusive of now, exclusive of 7 days from now).
 * Returns 0 on any error.
 */
async function countTrialsExpiring(): Promise<number> {
  try {
    const now = new Date()
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    const count = await prisma.business.count({
      where: {
        status: 'TRIAL',
        trialEndsAt: {
          gte: now,
          lte: in7Days,
        },
      },
    })

    return count
  } catch (err) {
    console.error('[/api/badges] trialsExpiring error:', err)
    return 0
  }
}

/**
 * Count pending Prisma migrations using the shared pool.
 * A migration is pending when finished_at IS NULL.
 * Returns 0 on any error.
 */
async function countPendingMigrations(): Promise<number> {
  const pool = getRepondlyPool()

  try {
    const client = await pool.connect()
    try {
      const result = await client.query<{ count: string }>(
        `SELECT COUNT(*) FROM _prisma_migrations WHERE finished_at IS NULL`
      )
      return parseInt(result.rows[0]?.count ?? '0', 10)
    } finally {
      client.release()
    }
  } catch (err) {
    console.error('[/api/badges] pendingMigrations error:', err)
    return 0
  }
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  // 1. Authentication check
  const authResult = await requireAdmin(request)
  if (authResult instanceof NextResponse) return authResult

  // 2. Fetch badge counts in parallel — never throw, always return safe defaults
  try {
    const [trialsExpiring, pendingMigrations] = await Promise.all([
      countTrialsExpiring(),
      countPendingMigrations(),
    ])

    const response: BadgesResponse = { trialsExpiring, pendingMigrations }
    return NextResponse.json(response)
  } catch (error) {
    console.error('[/api/badges]', error)
    return NextResponse.json({ trialsExpiring: 0, pendingMigrations: 0 })
  }
}
