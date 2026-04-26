import NextAuth, { type Session } from 'next-auth'
import type { JWT } from 'next-auth/jwt'
import Credentials from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { authConfig } from '@/lib/auth.config'

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.error('[auth] Missing credentials')
          return null
        }
        const email = credentials.email as string
        const password = credentials.password as string
        console.log('[auth] Attempting login for:', email)

        try {
          const adminRows = await prisma.$queryRaw<Array<{
            id: string
            email: string
            name: string
            passwordHash: string
            role: 'SUPER_ADMIN' | 'ADMIN'
            active: boolean
          }>>`
            SELECT id, email, name, "passwordHash", role, active
            FROM "AdminUser"
            WHERE email = ${email}
            LIMIT 1
          `
          console.log('[auth] Query returned rows:', adminRows.length)
          const adminUser = adminRows[0]
          if (!adminUser) { console.error('[auth] No user found'); return null }
          if (!adminUser.active) { console.error('[auth] User inactive'); return null }
          const valid = await bcrypt.compare(password, adminUser.passwordHash)
          console.log('[auth] Password valid:', valid)
          if (!valid) return null

          return {
            id: adminUser.id,
            email: adminUser.email,
            name: adminUser.name,
            role: adminUser.role,
          }
        } catch (e) {
          console.error('[auth] DB error:', e)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: unknown }) {
      if (user) {
        const u = user as { id: string; role: 'SUPER_ADMIN' | 'ADMIN' }
        token.id = u.id
        token.role = u.role
      }
      return token
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as 'SUPER_ADMIN' | 'ADMIN'
      }
      return session
    },
  },
})
