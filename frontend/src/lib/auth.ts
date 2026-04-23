import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const business = await prisma.business.findUnique({
          where: { email: credentials.email as string },
        })
        if (!business) return null
        const valid = await bcrypt.compare(credentials.password as string, business.passwordHash)
        if (!valid) return null
        return { id: business.id, email: business.email, name: business.name }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  pages: { signIn: '/auth/signin' },
})
