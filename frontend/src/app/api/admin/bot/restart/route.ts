import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/admin'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST() {
  const session = await auth()
  if (!isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const { stdout, stderr } = await execAsync('pm2 restart repondly-bot')
    return NextResponse.json({ success: true, stdout, stderr })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
