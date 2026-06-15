import { NextResponse } from 'next/server'
import { requireBusinessApiSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { unipile } from '@/lib/unipile/client'

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { response, session } = await requireBusinessApiSession()

  if (response || !session) {
    return response
  }

  const { id } = await context.params
  const connection = await prisma.businessChannelConnection.findFirst({
    where: {
      businessId: session.user.id,
      unipileAccountId: id,
    },
    select: {
      id: true,
      unipileAccountId: true,
    },
  })

  if (!connection?.unipileAccountId) {
    return NextResponse.json({ success: false, error: 'Connexion introuvable.' }, { status: 404 })
  }

  try {
    await unipile.deleteAccount(connection.unipileAccountId)
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Déconnexion Unipile impossible.' },
      { status: 502 },
    )
  }

  await prisma.businessChannelConnection.update({
    where: { id: connection.id },
    data: {
      status: 'DISCONNECTED',
      unipileAccountId: null,
      unipileAccountType: null,
      displayName: null,
      accessToken: null,
      metadata: null,
    },
  })

  return NextResponse.json({ success: true })
}
