import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { getRepondlyPool } from '@/lib/db-pools'

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
}

// ─── Prisma DB helpers ────────────────────────────────────────────────────────

async function fetchPrismaDbStats(): Promise<DatabaseStats['prismaDb']> {
  const pool = getRepondlyPool()

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
  relname AS tablename,
  n_live_tup AS row_count,
  pg_total_relation_size(relid) AS size_bytes
FROM pg_stat_user_tables
ORDER BY relname`
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
    console.error('[/api/database] Prisma DB error:', err)
    return {
      connected: false,
      latency: null,
      totalSizeMb: 0,
      tables: [],
      migrations: [],
    }
  }
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const prismaDb = await fetchPrismaDbStats()
    return NextResponse.json({ prismaDb })
  } catch (error) {
    console.error('[/api/database]', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
