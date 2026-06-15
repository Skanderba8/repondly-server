import { NextResponse } from 'next/server'
import { getBusinessSession } from '@/lib/auth'
import { parseMetaOAuthState, syncMetaConnectionFromCode } from '@/lib/meta/oauth'

function buildRedirectUrl(baseUrl: string, status: 'success' | 'error', channel?: string, error?: string) {
  const url = new URL('/settings', baseUrl)
  url.searchParams.set('meta_oauth', status)

  if (channel) {
    url.searchParams.set('channel', channel)
  }

  if (error) {
    url.searchParams.set('error', error)
  }

  return url
}

export async function GET(request: Request) {
  const session = await getBusinessSession()

  if (!session?.user?.id) {
    return NextResponse.redirect(new URL('/auth/signin', request.url))
  }

  const url = new URL(request.url)
  const code = url.searchParams.get('code')?.trim() ?? ''
  const rawState = url.searchParams.get('state')?.trim() ?? ''
  const deniedReason = url.searchParams.get('error_reason')?.trim() ?? ''

  if (deniedReason) {
    return NextResponse.redirect(buildRedirectUrl(request.url, 'error', undefined, 'Connexion Meta annulée.'))
  }

  if (!code || !rawState) {
    return NextResponse.redirect(buildRedirectUrl(request.url, 'error', undefined, 'Réponse Meta invalide.'))
  }

  try {
    const state = parseMetaOAuthState(rawState)

    if (state.businessId !== session.user.id) {
      return NextResponse.redirect(buildRedirectUrl(request.url, 'error', state.channel, 'Session Meta invalide.'))
    }

    await syncMetaConnectionFromCode({
      businessId: session.user.id,
      channel: state.channel,
      code,
    })

    return NextResponse.redirect(buildRedirectUrl(request.url, 'success', state.channel))
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Impossible de finaliser la connexion Meta.'
    return NextResponse.redirect(buildRedirectUrl(request.url, 'error', undefined, message))
  }
}
