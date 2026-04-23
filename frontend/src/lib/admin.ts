import type { Session } from 'next-auth'

export function isAdmin(session: Session | null): boolean {
  return session?.user?.email === process.env.ADMIN_EMAIL
}
