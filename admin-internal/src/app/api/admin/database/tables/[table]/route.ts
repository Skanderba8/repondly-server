import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { Pool } from 'pg'

const ALLOWED_TABLES = [
  'ActivityLog', 'AdminNote', 'AdminUser', 'AutoRule', 'Booking',
  'BotEvent', 'Business', 'Client', 'ConnectedPage', 'OnboardingStage',
  'Reminder', '_prisma_migrations',
]

function getPool() {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 5000,
    max: 1,
  })
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ table: string }> }
) {
  const auth = await requireAdmin(req)
  if (auth instanceof NextResponse) return auth

  const { table } = await params
  if (!ALLOWED_TABLES.includes(table)) {
    return NextResponse.json({ error: 'Table not allowed' }, { status: 400 })
  }

  const url = new URL(req.url)
  const page = parseInt(url.searchParams.get('page') ?? '1')
  const limit = 50
  const offset = (page - 1) * limit
  const search = url.searchParams.get('search') ?? ''

  const pool = getPool()
  try {
    const client = await pool.connect()
    try {
      // Get columns
      const colRes = await client.query<{ column_name: string; data_type: string }>(
        `SELECT column_name, data_type FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = $1
         ORDER BY ordinal_position`,
        [table]
      )
      const columns = colRes.rows

      // Get total count
      const countRes = await client.query<{ count: string }>(
        `SELECT COUNT(*) FROM "${table}"`
      )
      const total = parseInt(countRes.rows[0].count)

      // Get rows
      const rowRes = await client.query(
        `SELECT * FROM "${table}" ORDER BY 1 DESC LIMIT $1 OFFSET $2`,
        [limit, offset]
      )

      return NextResponse.json({
        columns,
        rows: rowRes.rows,
        total,
        page,
        pages: Math.ceil(total / limit),
      })
    } finally {
      client.release()
    }
  } catch (err) {
    console.error('[table-data]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  } finally {
    await pool.end().catch(() => {})
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ table: string }> }
) {
  const auth = await requireAdmin(req, 'SUPER_ADMIN')
  if (auth instanceof NextResponse) return auth

  const { table } = await params
  if (!ALLOWED_TABLES.includes(table)) {
    return NextResponse.json({ error: 'Table not allowed' }, { status: 400 })
  }

  const { id, column } = await req.json() as { id: string; column: string }
  if (!id || !column) {
    return NextResponse.json({ error: 'Missing id or column' }, { status: 400 })
  }

  const pool = getPool()
  try {
    const client = await pool.connect()
    try {
      await client.query(`DELETE FROM "${table}" WHERE "${column}" = $1`, [id])
      return NextResponse.json({ success: true })
    } finally {
      client.release()
    }
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  } finally {
    await pool.end().catch(() => {})
  }
}