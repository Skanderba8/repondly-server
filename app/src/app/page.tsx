import { redirect } from 'next/navigation'
import { getBusinessSession } from '@/lib/auth'

export default async function RootPage() {
  const session = await getBusinessSession()

  redirect(session?.user?.id ? '/inbox' : '/auth/signin')
}
