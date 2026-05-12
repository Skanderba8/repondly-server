import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getBasicAuthHeader(): string {
  const user = process.env.N8N_BASIC_USER ?? ''
  const password = process.env.N8N_BASIC_PASSWORD ?? ''
  return `Basic ${Buffer.from(`${user}:${password}`).toString('base64')}`
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const { id } = await context.params
    const body = await request.json() as { active?: boolean }

    if (typeof body.active !== 'boolean') {
      return NextResponse.json(
        { error: 'Le champ "active" (boolean) est requis' },
        { status: 400 }
      )
    }

    let response: Response
    try {
      response = await fetch(`http://127.0.0.1:5678/api/v1/workflows/${id}`, {
        method: 'PATCH',
        cache: 'no-store',
        signal: AbortSignal.timeout(5000),
        headers: {
          Authorization: getBasicAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ active: body.active }),
      })
    } catch {
      return NextResponse.json(
        { error: 'Service n8n inaccessible' },
        { status: 503 }
      )
    }

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      console.error(`[/api/admin/n8n/${id}] n8n responded ${response.status}:`, text)
      return NextResponse.json(
        { error: `Erreur n8n : ${response.status}` },
        { status: response.status }
      )
    }

    const updated = await response.json()
    return NextResponse.json(updated)
  } catch (error) {
    console.error(`[/api/admin/n8n/[id]]`, error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
