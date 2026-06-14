import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AuthForm } from '@/components/auth/AuthForm'
import { AuthShell } from '@/components/auth/AuthShell'
import { auth } from '@/lib/auth'

type SignUpPageProps = {
  searchParams?: Promise<{
    callbackUrl?: string
  }>
}

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const session = await auth()

  if (session?.user?.id) {
    redirect('/inbox')
  }

  const params = searchParams ? await searchParams : undefined
  const callbackUrl = params?.callbackUrl || '/inbox'

  return (
    <AuthShell
      title="Créer un compte"
      subtitle="Configurez le compte propriétaire de votre entreprise et accédez immédiatement à l'inbox Répondly."
      footer={
        <p>
          Vous avez déjà un compte ?{' '}
          <Link href={`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="font-medium text-[var(--brand)] no-underline">
            Se connecter
          </Link>
        </p>
      }
    >
      <AuthForm mode="signup" callbackUrl={callbackUrl} />
    </AuthShell>
  )
}
