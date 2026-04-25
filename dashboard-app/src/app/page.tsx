import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

export default async function RootPage() {
  const session = await auth()
  if (session?.user) {
    const role = (session.user as { role?: 'SUPER_ADMIN' | 'ADMIN' }).role
    redirect(role === 'SUPER_ADMIN' || role === 'ADMIN' ? '/admin' : '/dashboard')
  }
  redirect('/auth/signin')
}
