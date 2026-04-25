import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { Pool } from 'pg'

// ─── Types ────────────────────────────────────────────────────────────────────

type TableStat = {
  tableName: string
  rowCount: number
  sizeBytes: number
}

type MigrationRecord = {
  name: string
  appliedAt: string | null
  status: 'applied' | 'pending'
}

type DatabaseStats = {
  prismaDb: {
    connected: boolean
    latency: number | null
    totalSizeMb: number
    tables: TableStat[]
    migrations: MigrationRecord[]
  }
  chatwootDb: {
    connected: boolean
    latency: number | null
    totalSizeMb: number
    conversations: number
    contacts: number
    messages: number
  }
}

// ─── Prisma DB helpers ────────────────────────────────────────────────────────

/**
 * Fetch table stats, total DB size, and migration history from the Prisma DB.
 * Returns disconnected state on any error.
 */
async function fetchPrismaDbStats(): Promise<DatabaseStats['prismaDb']> {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    return {
      connected: false,
      latency: null,
      totalSizeMb: 0,
      tables: [],
      migrations: [],
    }
  }

  const pool = new Pool({
    connectionString,
    connectionTimeoutMillis: 5000,
    query_timeout: 10000,
    max: 1,
  })

  const start = Date.now()
  try {
    const client = await pool.connect()
    const latency = Date.now() - start

    try {
      const [tablesResult, sizeResult, migrationsResult] = await Promise.all([
        client.query<{
          tablename: string
          row_count: string
          size_bytes: string
        }>(
          `SELECT
            tablename,
            n_live_tup AS row_count,
            pg_total_relation_size(quote_ident(tablename)) AS size_bytes
          FROM pg_stat_user_tables
          ORDER BY tablename`
        ),
        client.query<{ size: string }>(
          `SELECT pg_database_size(current_database()) AS size`
        ),
        client.query<{ migration_name: string; finished_at: string | null }>(
          `SELECT migration_name, finished_at
           FROM _prisma_migrations
           ORDER BY started_at DESC`
        ),
      ])

      const tables: TableStat[] = tablesResult.rows.map((row) => ({
        tableName: row.tablename,
        rowCount: parseInt(row.row_count, 10),
        sizeBytes: parseInt(row.size_bytes, 10),
      }))

      const totalSizeBytes = parseInt(sizeResult.rows[0]?.size ?? '0', 10)
      const totalSizeMb = Math.round((totalSizeBytes / (1024 * 1024)) * 100) / 100

      const migrations: MigrationRecord[] = migrationsResult.rows.map((row) => ({
        name: row.migration_name,
        appliedAt: row.finished_at ?? null,
        status: row.finished_at != null ? 'applied' : 'pending',
      }))

      return {
        connected: true,
        latency,
        totalSizeMb,
        tables,
        migrations,
      }
    } finally {
      client.release()
    }
  } catch (err) {
    console.error('[/api/admin/database] Prisma DB error:', err)
    return {
      connected: false,
      latency: null,
      totalSizeMb: 0,
      tables: [],
      migrations: [],
    }
  } finally {
    await pool.end().catch(() => {})
  }
}

// ─── Chatwoot DB helpers ──────────────────────────────────────────────────────

/**
 * Connect directly to the Chatwoot PostgreSQL database and fetch stats.
 * Returns disconnected state on any error.
 */
async function fetchChatwootDbStats(): Promise<DatabaseStats['chatwootDb']> {
  const connectionString = process.env.DATABASE_URL_CHATWOOT
  if (!connectionString) {
    return {
      connected: false,
      latency: null,
      totalSizeMb: 0,
      conversations: 0,
      contacts: 0,
      messages: 0,
    }
  }

  const pool = new Pool({
    connectionString,
    connectionTimeoutMillis: 5000,
    query_timeout: 10000,
    max: 1,
  })

  const start = Date.now()
  try {
    const client = await pool.connect()
    const latency = Date.now() - start

    try {
      const [convResult, contactResult, msgResult, sizeResult] = await Promise.all([
        client.query<{ count: string }>('SELECT COUNT(*) FROM conversations'),
        client.query<{ count: string }>('SELECT COUNT(*) FROM contacts'),
        client.query<{ count: string }>('SELECT COUNT(*) FROM messages'),
        client.query<{ size: string }>(
          'SELECT pg_database_size(current_database()) AS size'
        ),
      ])

      const totalSizeBytes = parseInt(sizeResult.rows[0]?.size ?? '0', 10)
      const totalSizeMb = Math.round((totalSizeBytes / (1024 * 1024)) * 100) / 100

      return {
        connected: true,
        latency,
        totalSizeMb,
        conversations: parseInt(convResult.rows[0].count, 10),
        contacts: parseInt(contactResult.rows[0].count, 10),
        messages: parseInt(msgResult.rows[0].count, 10),
      }
    } finally {
      client.release()
    }
  } catch (err) {
    console.error('[/api/admin/database] Chatwoot DB error:', err)
    return {
      connected: false,
      latency: null,
      totalSizeMb: 0,
      conversations: 0,
      contacts: 0,
      messages: 0,
    }
  } finally {
    await pool.end().catch(() => {})
  }
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  // 1. Authentication check
  const authResult = await requireAdmin(request)
  if (authResult instanceof NextResponse) return authResult

  // 2. Business logic
  try {
    const [prismaDb, chatwootDb] = await Promise.all([
      fetchPrismaDbStats(),
      fetchChatwootDbStats(),
    ])

    const stats: DatabaseStats = { prismaDb, chatwootDb }
    return NextResponse.json(stats)
  } catch (error) {
    console.error('[/api/admin/database]', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
