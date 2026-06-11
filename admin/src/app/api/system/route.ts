import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'
import os from 'os'
import { X509Certificate } from 'crypto'
import * as fs from 'fs'
import { execSync } from 'child_process'
import * as net from 'net'

// ─── Types ────────────────────────────────────────────────────────────────────

type ServiceStatus = { online: boolean; latency: number | null }
type DbStatus      = { connected: boolean; latency: number | null }
type RedisStatus   = { connected: boolean; latency: number | null }
type ResourceMetric = { used: number; total: number; percent: number }
type Pm2Process    = { name: string; status: string; cpu: number; memory: number; uptime: number | null }

// ─── Cache for expensive operations ───────────────────────────────────────────

type CachedMetrics = {
  disk: ResourceMetric
  pm2: Pm2Process[]
  ssl: Record<string, number | null>
  timestamp: number
}

let metricsCache: CachedMetrics | null = null
const CACHE_TTL_MS = 60_000

function getCachedMetrics(): CachedMetrics {
  const now = Date.now()
  if (metricsCache && (now - metricsCache.timestamp) < CACHE_TTL_MS) {
    return metricsCache
  }

  metricsCache = {
    disk: getDiskUsage(),
    pm2: getPm2Status(),
    ssl: {
      'repondly.com':        getSslDaysRemaining('repondly.com'),
      'admin.repondly.com':  getSslDaysRemaining('admin.repondly.com'),
      'app.repondly.com':    getSslDaysRemaining('app.repondly.com'),
    },
    timestamp: now,
  }
  return metricsCache
}

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

async function checkPrismaDatabase(): Promise<DbStatus> {
  const start = Date.now()
  try {
    await prisma.$queryRaw`SELECT 1`
    return { connected: true, latency: Date.now() - start }
  } catch {
    return { connected: false, latency: null }
  }
}

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

  const [
    bot,
    app,
    marketing,
    dashboard,
    prismaDb,
    redis,
  ] = await Promise.all([
    checkService('http://127.0.0.1:3001/health'),
    checkService('http://127.0.0.1:3006'),
    checkService('http://127.0.0.1:3005'),
    checkService('http://127.0.0.1:3004'),
    checkPrismaDatabase(),
    checkRedis(),
  ])

  const cached = getCachedMetrics()
  const memory = getMemoryUsage()

  return NextResponse.json({
    services: {
      bot,
      app,
      marketing,
      dashboard,
      prismaDb,
      redis,
    },
    disk: cached.disk,
    memory,
    ssl: cached.ssl,
    pm2: cached.pm2,
  })
}
