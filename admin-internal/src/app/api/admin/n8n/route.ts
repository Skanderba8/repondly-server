import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'

// ─── Types ────────────────────────────────────────────────────────────────────

type N8nWorkflow = {
  id: string
  name: string
  active: boolean
  updatedAt: string
}

type N8nResponse = {
  serviceOnline: boolean
  latency: number | null
  workflows: N8nWorkflow[]
  stats: { total: number; active: number; inactive: number }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getBasicAuthHeader(): string {
  const user = process.env.N8N_BASIC_USER ?? ''
  const password = process.env.N8N_BASIC_PASSWORD ?? ''
  return `Basic ${Buffer.from(`${user}:${password}`).toString('base64')}`
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const start = Date.now()

    let response: Response
    try {
      response = await fetch('http://127.0.0.1:5678/api/v1/workflows', {
        cache: 'no-store',
        signal: AbortSignal.timeout(5000),
        headers: {
          Authorization: getBasicAuthHeader(),
          'Content-Type': 'application/json',
        },
      })
    } catch {
      // n8n is offline or unreachable
      const offline: N8nResponse = {
        serviceOnline: false,
        latency: null,
        workflows: [],
        stats: { total: 0, active: 0, inactive: 0 },
      }
      return NextResponse.json(offline)
    }

    const latency = Date.now() - start

    if (!response.ok) {
      const offline: N8nResponse = {
        serviceOnline: false,
        latency,
        workflows: [],
        stats: { total: 0, active: 0, inactive: 0 },
      }
      return NextResponse.json(offline)
    }

    const data = await response.json() as { data: N8nWorkflow[] }
    const workflows: N8nWorkflow[] = (data.data ?? []).map((wf) => ({
      id: String(wf.id),
      name: wf.name,
      active: wf.active,
      updatedAt: wf.updatedAt,
    }))

    const active = workflows.filter((wf) => wf.active).length
    const inactive = workflows.length - active

    const result: N8nResponse = {
      serviceOnline: true,
      latency,
      workflows,
      stats: { total: workflows.length, active, inactive },
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('[/api/admin/n8n]', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
