'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { mapSupabaseAuthErrorMessage } from '@/lib/supabase/auth-errors'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'

type AuthMode = 'signin' | 'signup'

type AuthFormProps = {
  mode: AuthMode
  callbackUrl?: string
}

type FormState = {
  businessName: string
  phone: string
  email: string
  password: string
}

const INITIAL_STATE: FormState = {
  businessName: '',
  phone: '',
  email: '',
  password: '',
}

export function AuthForm({ mode, callbackUrl = '/inbox' }: AuthFormProps) {
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()
  const [form, setForm] = useState<FormState>(INITIAL_STATE)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  const isSignup = mode === 'signup'

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function handleSignIn(email: string, password: string) {
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setError(mapSupabaseAuthErrorMessage(signInError.message, 'Email ou mot de passe invalide.'))
      return false
    }

    router.replace(callbackUrl)
    router.refresh()
    return true
  }

  async function ensureSessionAfterSignup(email: string, password: string) {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (session) {
      router.replace(callbackUrl)
      router.refresh()
      return
    }

    await handleSignIn(email, password)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setPending(true)

    try {
      if (isSignup) {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: form.businessName,
            phone: form.phone,
            email: form.email,
            password: form.password,
          }),
        })

        const payload = (await response.json()) as { success: boolean; error?: string }

        if (!response.ok || !payload.success) {
          setError(payload.error ?? 'Impossible de créer le compte.')
          return
        }

        await ensureSessionAfterSignup(form.email, form.password)
        return
      }

      await handleSignIn(form.email, form.password)
    } catch {
      setError('Une erreur est survenue. Réessayez dans un instant.')
    } finally {
      setPending(false)
    }
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      {isSignup ? (
        <>
          <label className="grid gap-1.5">
            <span className="text-sm font-medium text-[var(--text-primary)]">Nom de l&apos;entreprise</span>
            <Input
              value={form.businessName}
              onChange={(event) => updateField('businessName', event.target.value)}
              placeholder="Clinique Atlas"
              autoComplete="organization"
              required
              className="h-10 rounded-[4px]"
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-sm font-medium text-[var(--text-primary)]">Téléphone</span>
            <Input
              value={form.phone}
              onChange={(event) => updateField('phone', event.target.value)}
              placeholder="+216 20 000 000"
              autoComplete="tel"
              required
              className="h-10 rounded-[4px]"
            />
          </label>
        </>
      ) : null}

      <label className="grid gap-1.5">
        <span className="text-sm font-medium text-[var(--text-primary)]">Email</span>
        <Input
          type="email"
          value={form.email}
          onChange={(event) => updateField('email', event.target.value)}
          placeholder="vous@entreprise.com"
          autoComplete="email"
          required
          className="h-10 rounded-[4px]"
        />
      </label>

      <label className="grid gap-1.5">
        <span className="text-sm font-medium text-[var(--text-primary)]">Mot de passe</span>
        <Input
          type="password"
          value={form.password}
          onChange={(event) => updateField('password', event.target.value)}
          placeholder={isSignup ? '8 caractères minimum' : 'Votre mot de passe'}
          autoComplete={isSignup ? 'new-password' : 'current-password'}
          required
          minLength={8}
          className="h-10 rounded-[4px]"
        />
      </label>

      {error ? (
        <p className="rounded-[4px] border border-[color-mix(in_srgb,var(--danger)_28%,transparent)] bg-[color-mix(in_srgb,var(--danger)_8%,transparent)] px-3 py-2 text-sm text-[var(--danger)]">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="mt-2 h-10 rounded-[4px]">
        {pending ? 'Chargement...' : isSignup ? 'Créer mon compte' : 'Se connecter'}
      </Button>

      <p className="text-sm text-[var(--text-secondary)]">
        {isSignup ? 'Vous avez déjà un compte ? ' : "Vous n'avez pas encore de compte ? "}
        <Link
          href={isSignup ? `/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}` : `/auth/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`}
          className="font-medium text-[var(--brand)] no-underline"
        >
          {isSignup ? 'Se connecter' : 'Créer un compte'}
        </Link>
      </p>
    </form>
  )
}
