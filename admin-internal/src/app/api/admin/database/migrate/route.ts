import { NextRequest, NextResponse } from 'next/server'
import { execSync } from 'child_process'
import { requireAdmin } from '@/lib/admin-auth'

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // 1. Authentication check — SUPER_ADMIN only
  const authResult = await requireAdmin(request, 'SUPER_ADMIN')
  if (authResult instanceof NextResponse) return authResult

  // 2. Execute prisma migrate deploy
  try {
    const output = execSync('npx prisma migrate deploy', {
      encoding: 'utf8',
      cwd: process.cwd(),
    })

    return NextResponse.json({ success: true, output })
  } catch (err) {
    const error = err as Error & { stdout?: string; stderr?: string }
    const output = error.stdout ?? error.stderr ?? ''
    console.error('[/api/admin/database/migrate]', error)
    return NextResponse.json({
      success: false,
      output,
      error: error.message,
    })
  }
}
