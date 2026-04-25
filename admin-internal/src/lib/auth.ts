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
      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) return null

        const adminUser = await prisma.adminUser.findUnique({
          where: { email: credentials.email as string },
        })

        if (!adminUser || !adminUser.active) return null

        const valid = await bcrypt.compare(
          credentials.password as string,
          adminUser.passwordHash
        )
        if (!valid) return null

        // Record login activity
        const ipAddress =
          (request as Request | undefined)?.headers?.get('x-forwarded-for') ??
          null

        await prisma.activityLog.create({
          data: {
            action: 'admin_login',
            adminUserId: adminUser.id,
            ipAddress,
          },
        })

        return {
          id: adminUser.id,
          email: adminUser.email,
          name: adminUser.name,
          role: adminUser.role,
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
