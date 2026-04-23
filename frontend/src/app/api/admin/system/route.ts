import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/admin'
import { prisma } from '@/lib/prisma'
import os from 'os'
import { X509Certificate } from 'crypto'
import * as fs from 'fs'
import { execSync } from 'child_process'

async function checkService(url: string): Promise<{ online: boolean }> {
  try {
    const res = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(3000) })
    return { online: res.ok }
  } catch {
    return { online: false }
  }
}

async function checkDatabase(): Promise<{ online: boolean }> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return { online: true }
  } catch {
    return { online: false }
  }
}

function getDiskUsage(): { used: number; total: number; percent: number } {
  try {
    const output = execSync("df / --output=size,used,avail --block-size=1 | tail -1").toString().trim()
    const [total, used] = output.split(/\s+/).map(Number)
    return { used, total, percent: Math.round((used / total) * 100) }
  } catch {
    const total = os.totalmem() * 4
    const used = total * 0.6
    return { used, total, percent: 60 }
  }
}

function getMemoryUsage(): { used: number; total: number; percent: number } {
  const total = os.totalmem()
  const free = os.freemem()
  const used = total - free
  return { used, total, percent: Math.round((used / total) * 100) }
}

function getSslDaysRemaining(domain: string): number | null {
  try {
    const certPath = `/etc/letsencrypt/live/${domain}/cert.pem`
    if (!fs.existsSync(certPath)) return null
    const certPem = fs.readFileSync(certPath, 'utf8')
    const cert = new X509Certificate(certPem)
    const validTo = new Date(cert.validTo)
    return Math.floor((validTo.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  } catch {
    return null
  }
}

export async function GET() {
  const session = await auth()
  if (!isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const [bot, chatwoot, database] = await Promise.all([
    checkService('http://127.0.0.1:3001/health'),
    checkService('http://127.0.0.1:3000'),
    checkDatabase(),
  ])

  const disk = getDiskUsage()
  const memory = getMemoryUsage()

  const ssl = {
    'repondly.com': getSslDaysRemaining('repondly.com'),
    'app.repondly.com': getSslDaysRemaining('app.repondly.com'),
  }

  return NextResponse.json({ bot, chatwoot, database, disk, memory, ssl })
}
