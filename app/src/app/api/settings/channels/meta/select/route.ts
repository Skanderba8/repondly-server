import { NextResponse } from 'next/server'
import { requireBusinessApiSession } from '@/lib/auth'
import { selectMetaAsset } from '@/lib/meta/oauth'

type SelectMetaAssetBody = {
  channel?: 'WHATSAPP' | 'MESSENGER' | 'INSTAGRAM'
  assetId?: string
}

function isSupportedChannel(channel?: string): channel is 'WHATSAPP' | 'MESSENGER' | 'INSTAGRAM' {
  return channel === 'WHATSAPP' || channel === 'MESSENGER' || channel === 'INSTAGRAM'
}

export async function POST(request: Request) {
  const { response, session } = await requireBusinessApiSession()

  if (response || !session) {
    return response
  }

  const body = (await request.json()) as SelectMetaAssetBody
  const assetId = body.assetId?.trim() ?? ''

  if (!isSupportedChannel(body.channel)) {
    return NextResponse.json({ success: false, error: 'Canal invalide.' }, { status: 400 })
  }

  if (!assetId) {
    return NextResponse.json({ success: false, error: 'Actif Meta manquant.' }, { status: 400 })
  }

  try {
    const connection = await selectMetaAsset({
      businessId: session.user.id,
      channel: body.channel,
      assetId,
    })

    return NextResponse.json({ success: true, data: connection })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Impossible d’activer cet actif Meta.'
    return NextResponse.json({ success: false, error: message }, { status: 400 })
  }
}
