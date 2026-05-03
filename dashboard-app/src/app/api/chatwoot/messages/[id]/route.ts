import { NextRequest, NextResponse } from 'next/server'
import { getMessages } from '@/lib/chatwoot'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 1. Fetch BOTH the ID and the Token
    const business = await prisma.business.findUnique({
      where: { email: session.user.email },
      select: { 
        chatwootAccountId: true,
        chatwootApiToken: true // <-- ADDED THIS
      }
    })

    if (!business?.chatwootAccountId || !business?.chatwootApiToken) {
      return NextResponse.json({ error: 'Chatwoot not connected' }, { status: 403 })
    }

    const { id } = await params
    
    // 2. Pass BOTH the ID and the Token to getMessages
    const data = await getMessages(
      business.chatwootAccountId, 
      business.chatwootApiToken, // <-- ADDED THIS
      parseInt(id)
    )

    return NextResponse.json(data)
  } catch (err: any) {
    console.error('[chatwoot/messages GET]', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}