import bcrypt from 'bcryptjs'
import type { Plan } from '@prisma/client'
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { redirect } from 'next/navigation'
import {
  canAttemptLogin,
  clearFailedLogins,
  getClientIp,
  normalizeEmail,
  registerFailedLogin,
} from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'

const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60
const SESSION_UPDATE_AGE_SECONDS = 60 * 60
const IS_PRODUCTION = process.env.NODE_ENV === 'production'

type AuthenticatedBusiness = {
  id: string
  email: string
  name: string
  slug: string
  plan: Plan
}

function buildAuthenticatedBusiness(business: AuthenticatedBusiness) {
  return {
    id: business.id,
    email: business.email,
    name: business.name,
    slug: business.slug,
    plan: business.plan,
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: {
    strategy: 'jwt',
    maxAge: SESSION_MAX_AGE_SECONDS,
    updateAge: SESSION_UPDATE_AGE_SECONDS,
  },
  pages: {
    signIn: '/auth/signin',
  },
  useSecureCookies: IS_PRODUCTION,
  cookies: {
    sessionToken: {
      name: IS_PRODUCTION ? '__Secure-authjs.session-token' : 'authjs.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: IS_PRODUCTION,
      },
    },
  },
  providers: [
    Credentials({
      name: 'Identifiants',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mot de passe', type: 'password' },
      },
      authorize: async (credentials, request) => {
        const email = normalizeEmail(String(credentials?.email ?? ''))
        const password = String(credentials?.password ?? '')
        const ip = getClientIp(request.headers)

        if (!email || !password || !canAttemptLogin(email, ip)) {
          return null
        }

        const business = await prisma.business.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            slug: true,
            plan: true,
            passwordHash: true,
          },
        })

        if (!business?.email) {
          registerFailedLogin(email, ip)
          return null
        }

        const passwordIsValid = await bcrypt.compare(password, business.passwordHash)

        if (!passwordIsValid) {
          registerFailedLogin(email, ip)
          return null
        }

        clearFailedLogins(email, ip)
        return buildAuthenticatedBusiness({
          id: business.id,
          email: business.email,
          name: business.name,
          slug: business.slug,
          plan: business.plan,
        })
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user?.id) {
        token.businessId = user.id
        token.email = user.email ?? ''
        token.name = user.name ?? ''
        token.slug = user.slug
        token.plan = user.plan
        token.sessionExpiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000).toISOString()
      }

      return token
    },
    session: async ({ session, token }) => {
      if (!token.businessId || !token.email || !token.slug || !token.plan) {
        return session
      }

      session.user = {
        ...session.user,
        id: token.businessId,
        email: token.email,
        name: token.name ?? '',
        slug: token.slug,
        plan: token.plan,
      }
      session.sessionExpiresAt = token.sessionExpiresAt ?? session.expires

      return session
    },
  },
})

export async function requireBusinessSession() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  return session
}
