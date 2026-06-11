import type { NextAuthConfig, Session } from 'next-auth'
import type { JWT } from 'next-auth/jwt'

// Edge-safe config — no Prisma, no bcrypt
export const authConfig: NextAuthConfig = {
  providers: [],
  session: { strategy: 'jwt' },
  pages: { signIn: '/auth/signin' },
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: unknown }) {
      if (user) {
        const u = user as { id: string; email: string; name: string; role: 'SUPER_ADMIN' | 'ADMIN' }
        token.id = u.id
        token.email = u.email
        token.name = u.name
        token.role = u.role
      }
      return token
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (token) {
        if (session.user) {
          session.user.id = token.id as string
          session.user.email = token.email as string
          session.user.name = token.name as string
          session.user.role = token.role as 'SUPER_ADMIN' | 'ADMIN'
        } else {
          session.user = {
            id: token.id as string,
            email: token.email as string,
            name: token.name as string,
            role: token.role as 'SUPER_ADMIN' | 'ADMIN',
          } as any
        }
      }
      return session
    },
  },
}
