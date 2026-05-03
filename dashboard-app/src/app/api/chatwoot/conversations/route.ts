import { NextRequest, NextResponse } from 'next/server'
import { getConversations } from '@/lib/chatwoot'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate the user
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Get their specific Chatwoot Account ID from your database
    const business = await prisma.business.findUnique({
      where: { email: session.user.email },
      select: { chatwootAccountId: true }
    })

    if (!business?.chatwootAccountId) {
      return NextResponse.json({ error: 'No Chatwoot account linked' }, { status: 400 })
    }

    // 3. Parse query params
    const { searchParams } = new URL(request.url)
    const status = (searchParams.get('status') || 'open') as any
    const page   = parseInt(searchParams.get('page') || '1')

    // 4. Call Chatwoot using the dynamic Account ID!
    const data = await getConversations(business.chatwootAccountId, { status, page })

    return NextResponse.json(data)
  } catch (err: any) {
    console.error('[chatwoot/conversations]', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}