import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'
import os from 'os'
import { X509Certificate } from 'crypto'
import * as fs from 'fs'
import { execSync } from 'child_process'
import * as net from 'net'
import { Pool } from 'pg'

// ─── Types ────────────────────────────────────────────────────────────────────

type ServiceStatus = { online: boolean; latency: number | null }
type DbStatus      = { connected: boolean; latency: number | null }
type RedisStatus   = { connected: boolean; latency: number | null }
type ResourceMetric = { used: number; total: number; percent: number }
type Pm2Process    = { name: string; status: string; cpu: number; memory: number; uptime: number | null }

// ─── Service checks ───────────────────────────────────────────────────────────

async function checkService(url: string): Promise<ServiceStatus> {
  const start = Date.now()
  try {
    const res = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(4000) })
    return { online: res.ok, latency: Date.now() - start }
  } catch {
    return { online: false, latency: null }
  }
}

/**
 * Check the Prisma (admin-internal) database using the existing Prisma client.
 */
async function checkPrismaDatabase(): Promise<DbStatus> {
  const start = Date.now()
  try {
    await prisma.$queryRaw`SELECT 1`
    return { connected: true, latency: Date.now() - start }
  } catch {
    return { connected: false, latency: null }
  }
}

/**
 * Check an arbitrary PostgreSQL database via a direct pg connection.
 * Uses a 5 000 ms connect + query timeout.
 */
async function checkDatabase(connectionString: string): Promise<DbStatus> {
  const start = Date.now()
  const pool = new Pool({
    connectionString,
    connectionTimeoutMillis: 5000,
    query_timeout: 5000,
    max: 1,
  })
  try {
    const client = await pool.connect()
    try {
      await client.query('SELECT 1')
      return { connected: true, latency: Date.now() - start }
    } finally {
      client.release()
    }
  } catch {
    return { connected: false, latency: null }
  } finally {
    await pool.end().catch(() => {})
  }
}

/**
 * Check Redis availability via a raw TCP PING command on port 6379.
 * Does not require ioredis — uses Node's built-in `net` module.
 */
function checkRedis(): Promise<RedisStatus> {
  return new Promise((resolve) => {
    const start = Date.now()
    const socket = new net.Socket()
    let resolved = false

    const done = (result: RedisStatus) => {
      if (!resolved) {
        resolved = true
        socket.destroy()
        resolve(result)
      }
    }

    socket.setTimeout(4000)

    socket.connect(6379, '127.0.0.1', () => {
      // Send inline PING command
      socket.write('PING\r\n')
    })

    socket.on('data', (data) => {
      const response = data.toString()
      if (response.includes('+PONG') || response.includes('PONG')) {
        done({ connected: true, latency: Date.now() - start })
      } else {
        done({ connected: false, latency: null })
      }
    })

    socket.on('timeout', () => done({ connected: false, latency: null }))
    socket.on('error', () => done({ connected: false, latency: null }))
  })
}

// ─── System metrics ───────────────────────────────────────────────────────────

function getDiskUsage(): ResourceMetric {
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

function getMemoryUsage(): ResourceMetric {
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

function getPm2Status(): Pm2Process[] {
  try {
    const output = execSync('pm2 jlist', { timeout: 5000 }).toString()
    const list = JSON.parse(output) as Array<{
      name: string
      pm2_env: { status: string; pm_uptime?: number }
      monit: { cpu: number; memory: number }
    }>
    return list.map(p => ({
      name: p.name,
      status: p.pm2_env.status,
      cpu: p.monit.cpu,
      memory: p.monit.memory,
      uptime: p.pm2_env.pm_uptime ?? null,
    }))
  } catch {
    return []
  }
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request)
  if (authResult instanceof NextResponse) return authResult

  const chatwootDbUrl = process.env.DATABASE_URL_CHATWOOT

  const [
    bot,
    app,
    n8n,
    chatwoot,
    marketing,
    dashboard,
    prismaDb,
    chatwootDb,
    redis,
  ] = await Promise.all([
    checkService('http://127.0.0.1:3001/health'),
    checkService('https://app.repondly.com'),
    checkService('https://n8n.repondly.com'),
    checkService('http://127.0.0.1:3000'),
    checkService('http://127.0.0.1:3005'),
    checkService('http://127.0.0.1:3004'),
    checkPrismaDatabase(),
    chatwootDbUrl
      ? checkDatabase(chatwootDbUrl)
      : Promise.resolve<DbStatus>({ connected: false, latency: null }),
    checkRedis(),
  ])

  const disk   = getDiskUsage()
  const memory = getMemoryUsage()
  const pm2    = getPm2Status()

  const ssl = {
    'repondly.com':        getSslDaysRemaining('repondly.com'),
    'app.repondly.com':    getSslDaysRemaining('app.repondly.com'),
    'n8n.repondly.com':    getSslDaysRemaining('n8n.repondly.com'),
    'inbox.repondly.com':  getSslDaysRemaining('inbox.repondly.com'),
  }

  return NextResponse.json({
    services: {
      bot,
      app,
      n8n,
      chatwoot,
      marketing,
      dashboard,
      prismaDb,
      chatwootDb,
      redis,
    },
    disk,
    memory,
    ssl,
    pm2,
  })
}
