import { NextResponse } from 'next/server'
import { requireBusinessApiSession } from '@/lib/auth'
import { buildMetaOAuthUrl } from '@/lib/meta/oauth'

type StartMetaOAuthBody = {
  channel?: 'WHATSAPP' | 'MESSENGER' | 'INSTAGRAM'
}

function isSupportedChannel(channel?: string): channel is 'WHATSAPP' | 'MESSENGER' | 'INSTAGRAM' {
  return channel === 'WHATSAPP' || channel === 'MESSENGER' || channel === 'INSTAGRAM'
}

export async function POST(request: Request) {
  const { response, session } = await requireBusinessApiSession()

  if (response || !session) {
    return response
  }

  const body = (await request.json()) as StartMetaOAuthBody

  if (!isSupportedChannel(body.channel)) {
    return NextResponse.json({ success: false, error: 'Canal invalide.' }, { status: 400 })
  }

  try {
    const url = buildMetaOAuthUrl(body.channel, session.user.id)
    return NextResponse.json({ success: true, data: { url } })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Impossible de démarrer la connexion Meta.'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
