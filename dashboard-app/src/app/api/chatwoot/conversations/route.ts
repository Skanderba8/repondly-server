import { NextRequest, NextResponse } from 'next/server'
import { getConversations, deleteConversation } from '@/lib/chatwoot'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate the user
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Get BOTH their Chatwoot Account ID and API Token from your database
    const business = await prisma.business.findUnique({
      where: { email: session.user.email },
      select: { 
        chatwootAccountId: true,
        chatwootApiToken: true // <-- ADDED THIS
      }
    })

    // 3. Verify they have both credentials
    if (!business?.chatwootAccountId || !business?.chatwootApiToken) {
      return NextResponse.json({ error: 'Chatwoot not connected for this business.' }, { status: 403 })
    }

    // 4. Parse query params
    const { searchParams } = new URL(request.url)
    const status = (searchParams.get('status') || 'open') as any
    const page   = parseInt(searchParams.get('page') || '1')

    // 5. Call Chatwoot using BOTH the Account ID and API Token!
    const data = await getConversations(
      business.chatwootAccountId, 
      business.chatwootApiToken, // <-- ADDED THIS
      { status, page }
    )

    return NextResponse.json(data)
  } catch (err: any) {
    console.error('[chatwoot/conversations]', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
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
      return NextResponse.json({ error: 'Chatwoot not connected for this business.' }, { status: 403 })
    }

    const body = await request.json()
    const { conversationId } = body

    if (!conversationId) {
      return NextResponse.json({ error: 'Missing conversationId' }, { status: 400 })
    }

    // Delete from Chatwoot
    await deleteConversation(business.chatwootAccountId, business.chatwootApiToken, conversationId)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[chatwoot/conversations DELETE]', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}