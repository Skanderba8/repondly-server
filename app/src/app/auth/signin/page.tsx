import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AuthForm } from '@/components/auth/AuthForm'
import { AuthShell } from '@/components/auth/AuthShell'
import { getBusinessSession } from '@/lib/auth'

type SignInPageProps = {
  searchParams?: Promise<{
    callbackUrl?: string
  }>
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const session = await getBusinessSession()

  if (session?.user?.id) {
    redirect('/inbox')
  }

  const params = searchParams ? await searchParams : undefined
  const callbackUrl = params?.callbackUrl || '/inbox'

  return (
    <AuthShell
      title="Connexion"
      subtitle="Connectez-vous à votre espace Répondly pour accéder à vos conversations et à votre session sécurisée."
      footer={
        <p>
          Besoin d&apos;un compte ?{' '}
          <Link href={`/auth/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="font-medium text-[var(--brand)] no-underline">
            Créer un compte
          </Link>
        </p>
      }
    >
      <AuthForm mode="signin" callbackUrl={callbackUrl} />
    </AuthShell>
  )
}
