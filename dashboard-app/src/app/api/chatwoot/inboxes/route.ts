import { NextRequest, NextResponse } from 'next/server'
import { getInboxes } from '@/lib/chatwoot'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const business = await prisma.business.findUnique({
      where: { email: session.user.email },
      select: { 
        chatwootAccountId: true,
        chatwootApiToken: true
      }
    })

    if (!business?.chatwootAccountId || !business?.chatwootApiToken) {
      return NextResponse.json({ error: 'Chatwoot not connected' }, { status: 403 })
    }

    const data = await getInboxes(business.chatwootAccountId, business.chatwootApiToken)
    return NextResponse.json(data)
  } catch (err: any) {
    console.error('[chatwoot/inboxes]', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
