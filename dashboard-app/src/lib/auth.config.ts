import type { NextAuthConfig } from 'next-auth'

// Edge-safe config — no Prisma, no bcrypt
export const authConfig: NextAuthConfig = {
  providers: [], // filled in auth.ts with Credentials
  session: { strategy: 'jwt' },
  pages: { signIn: '/auth/signin' },
}
