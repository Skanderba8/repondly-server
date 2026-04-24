import type { NextAuthConfig } from 'next-auth'

// Edge-safe config — no Prisma, no bcrypt
// signIn points to dashboard-app (admin-internal has no login page)
export const authConfig: NextAuthConfig = {
  providers: [],
  session: { strategy: 'jwt' },
  pages: { signIn: 'https://app.repondly.com/auth/signin' },
}
