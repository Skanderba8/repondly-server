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
        if (!credentials?.email || !credentials?.password) return null
        const email = credentials.email as string
        const password = credentials.password as string

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
          const adminUser = adminRows[0]

          if (adminUser) {
            if (!adminUser.active) return null
            const validAdmin = await bcrypt.compare(password, adminUser.passwordHash)
            if (!validAdmin) return null
            return {
              id: adminUser.id,
              email: adminUser.email,
              name: adminUser.name,
              role: adminUser.role,
            }
          }
        } catch (error) {
          // If AdminUser is unavailable, keep legacy Business auth operational.
          console.error('[auth] AdminUser lookup failed, falling back to Business auth', error)
        }

        const business = await prisma.business.findUnique({
          where: { email },
        })
        if (!business) return null
        const valid = await bcrypt.compare(password, business.passwordHash)
        if (!valid) return null
        const legacyAdminRole =
          process.env.ADMIN_EMAIL &&
          business.email.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase()
            ? ('ADMIN' as const)
            : undefined
        return {
          id: business.id,
          email: business.email,
          name: business.name,
          role: legacyAdminRole,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: unknown }) {
      if (user) {
        const u = user as { id: string; role?: 'SUPER_ADMIN' | 'ADMIN' }
        token.id = u.id
        token.role = u.role
      }
      return token
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as 'SUPER_ADMIN' | 'ADMIN' | undefined
      }
      return session
    },
  },
})
