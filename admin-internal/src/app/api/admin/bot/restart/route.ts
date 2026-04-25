import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { stdout, stderr } = await execAsync('pm2 restart repondly-bot')
    return NextResponse.json({ success: true, stdout, stderr })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
