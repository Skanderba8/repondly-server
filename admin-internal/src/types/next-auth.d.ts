import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface User {
    id: string
    role: 'SUPER_ADMIN' | 'ADMIN'
  }

  interface Session {
    user: DefaultSession['user'] & {
      id: string
      role: 'SUPER_ADMIN' | 'ADMIN'
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    role?: 'SUPER_ADMIN' | 'ADMIN'
  }
}

export {}
