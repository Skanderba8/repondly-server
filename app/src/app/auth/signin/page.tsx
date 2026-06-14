import { redirect } from 'next/navigation'
import { AuthForm } from '@/components/auth/AuthForm'
import { AuthShell } from '@/components/auth/AuthShell'
import { getBusinessSession } from '@/lib/auth'

type SignInPageProps = {
  searchParams?: Promise<{ callbackUrl?: string }>
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const session = await getBusinessSession()
  if (session?.user?.id) redirect('/inbox')

  const params = searchParams ? await searchParams : undefined
  const callbackUrl = params?.callbackUrl || '/inbox'

  return (
    <AuthShell
      title="Connexion"
      subtitle="Retrouvez vos conversations clients, votre équipe et vos réponses en attente."
    >
      <AuthForm mode="signin" callbackUrl={callbackUrl} />
    </AuthShell>
  )
}
