import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AccessManager from '@/components/admin/AccessManager'

export default async function AccessPage() {
  const session = await auth()
  const role = (session?.user as { role?: string } | undefined)?.role

  if (role !== 'SUPER_ADMIN') {
    redirect('/admin')
  }

  return <AccessManager />
}
