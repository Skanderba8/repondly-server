import type { NextAuthConfig, Session } from 'next-auth'
import type { JWT } from 'next-auth/jwt'

// Edge-safe config — no Prisma, no bcrypt
// signIn points to dashboard-app (admin-internal has no login page)
export const authConfig: NextAuthConfig = {
  providers: [],
  session: { strategy: 'jwt' },
  pages: { signIn: 'https://app.repondly.com/auth/signin' },
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
}
