import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import OnboardingClient from './OnboardingClient'

export const dynamic = 'force-dynamic'

export default async function OnboardingPage() {
  const session = await auth()
  if (!session?.user) redirect('/auth/signin')
  return <OnboardingClient />
}
