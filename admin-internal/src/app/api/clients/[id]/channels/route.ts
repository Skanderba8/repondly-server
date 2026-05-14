import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req)
  if (auth instanceof NextResponse) return auth

  const { id } = await params
  const body = await req.json()
  const { whatsappConnected, facebookConnected, instagramConnected } = body

  try {
    const updated = await prisma.business.update({
      where: { id },
      data: {
        ...(whatsappConnected !== undefined && { whatsappConnected }),
        ...(facebookConnected !== undefined && { facebookConnected }),
        ...(instagramConnected !== undefined && { instagramConnected }),
      },
    })
    return NextResponse.json(updated)
  } catch (err) {
    console.error('[channels-update]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
