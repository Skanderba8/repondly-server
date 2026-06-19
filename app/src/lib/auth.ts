import type { Plan } from '@/types'
import { NextResponse } from 'next/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { ensureBusinessSubscriptionState } from '@/lib/subscription'
import { createServerSupabaseClient } from '@/lib/supabase/server'

type BusinessSessionUser = {
  id: string
  authUserId: string
  email: string
  name: string
  slug: string
  plan: Plan
}

export type BusinessSession = {
  user: BusinessSessionUser
  sessionExpiresAt: string
}

function buildSessionExpiry(expiresAt?: number) {
  if (!expiresAt) {
    return new Date().toISOString()
  }

  return new Date(expiresAt * 1000).toISOString()
}

export async function getBusinessSession(): Promise<BusinessSession | null> {
  const supabase = await createServerSupabaseClient()
  const [{ data: userData, error: userError }, { data: sessionData }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.auth.getSession(),
  ])

  if (userError || !userData.user?.id) {
    return null
  }

  const business = await prisma.business.findUnique({
    where: { authUserId: userData.user.id },
    select: {
      id: true,
      authUserId: true,
      email: true,
      name: true,
      slug: true,
      plan: true,
    },
  })

  if (!business?.id || !business.email || !business.authUserId) {
    return null
  }

  await ensureBusinessSubscriptionState(business.id)

  return {
    user: {
      id: business.id,
      authUserId: business.authUserId,
      email: business.email,
      name: business.name,
      slug: business.slug,
      plan: business.plan,
    },
    sessionExpiresAt: buildSessionExpiry(sessionData.session?.expires_at),
  }
}

export async function requireBusinessSession(): Promise<BusinessSession> {
  const session = await getBusinessSession()

  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  return session
}

export async function requireBusinessApiSession() {
  const session = await getBusinessSession()

  if (!session?.user?.id) {
    return {
      response: NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 }),
      session: null,
    }
  }

  return {
    response: null,
    session,
  }
}
