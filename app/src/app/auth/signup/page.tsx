import { redirect } from 'next/navigation'
import { AuthForm } from '@/components/auth/AuthForm'
import { AuthShell } from '@/components/auth/AuthShell'
import { getBusinessSession } from '@/lib/auth'

type SignUpPageProps = {
  searchParams?: Promise<{ callbackUrl?: string }>
}

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const session = await getBusinessSession()
  if (session?.user?.id) redirect('/inbox')

  const params = searchParams ? await searchParams : undefined
  const callbackUrl = params?.callbackUrl || '/inbox'

  return (
    <AuthShell
      title="Créer votre espace"
      subtitle="Lancez une boîte de réception claire pour gérer les messages de votre entreprise."
    >
      <AuthForm mode="signup" callbackUrl={callbackUrl} />
    </AuthShell>
  )
}
