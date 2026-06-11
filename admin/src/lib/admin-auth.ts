import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import type { Session } from 'next-auth'

export type AdminSession = Session & {
  user: {
    id: string
    email: string
    name: string
    role: 'SUPER_ADMIN' | 'ADMIN'
  }
}

/**
 * Middleware d'autorisation pour les routes API admin.
 *
 * - Retourne 401 si aucune session n'existe ou si l'utilisateur n'a pas de rôle admin.
 * - Retourne 403 si `requiredRole` est 'SUPER_ADMIN' et que l'utilisateur est seulement ADMIN.
 * - Retourne `{ session }` si l'utilisateur est autorisé.
 */
export async function requireAdmin(
  request: NextRequest,
  requiredRole?: 'SUPER_ADMIN'
): Promise<{ session: AdminSession } | NextResponse> {
  const session = await auth()

  // Pas de session ou pas d'utilisateur → 401
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const role = (session.user as AdminSession['user']).role

  // Rôle non reconnu comme admin → 401
  if (!role || !(['SUPER_ADMIN', 'ADMIN'] as const).includes(role)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  // Route réservée au SUPER_ADMIN et l'utilisateur est seulement ADMIN → 403
  if (requiredRole === 'SUPER_ADMIN' && role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  return { session: session as AdminSession }
}
