import type { Plan } from '@prisma/client'
import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: DefaultSession['user'] & {
      id: string
      slug: string
      plan: Plan
    }
    sessionExpiresAt: string
  }

  interface User {
    slug: string
    plan: Plan
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    businessId: string
    slug: string
    plan: Plan
    sessionExpiresAt: string
  }
}

export {}
