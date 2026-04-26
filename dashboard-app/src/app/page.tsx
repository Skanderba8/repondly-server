import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
export default async function RootPage() {
  const session = await auth()
  console.log('[root] session:', JSON.stringify(session))
  if (session?.user) {
    const role = (session.user as { role?: 'SUPER_ADMIN' | 'ADMIN' }).role
    console.log('[root] role:', role)
    redirect(role === 'SUPER_ADMIN' || role === 'ADMIN' ? 'https://admin.repondly.com' : '/dashboard')
  }
  redirect('/auth/signin')
}
