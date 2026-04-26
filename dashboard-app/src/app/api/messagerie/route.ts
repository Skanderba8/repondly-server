import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { provisionChatwootAccount } from '@/lib/chatwoot'

const CHATWOOT_PUBLIC_URL = process.env.CHATWOOT_PUBLIC_URL ?? 'https://inbox.repondly.com'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { accountId } = await provisionChatwootAccount(session.user.id)
    return NextResponse.redirect(`${CHATWOOT_PUBLIC_URL}/app/accounts/${accountId}/dashboard`)
  } catch (err) {
    console.error('[messagerie] error:', err)
    return NextResponse.json({ error: 'Failed to open messagerie' }, { status: 500 })
  }
}
