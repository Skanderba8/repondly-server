'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { FormEvent, InputHTMLAttributes, ReactNode } from 'react'
import { useState } from 'react'
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

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="rp-auth-field">
      <span>{label}</span>
      {children}
    </label>
  )
}

function AuthInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={["rp-auth-input", props.className].filter(Boolean).join(' ')} />
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
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setPending(true)
    try {
      if (isSignup) {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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
    <form onSubmit={handleSubmit} className="rp-auth-form">
      {isSignup ? (
        <>
          <Field label="Nom de l'entreprise">
            <AuthInput value={form.businessName} onChange={(event) => updateField('businessName', event.target.value)} placeholder="Clinique Atlas" autoComplete="organization" required />
          </Field>
          <Field label="Téléphone">
            <AuthInput type="tel" value={form.phone} onChange={(event) => updateField('phone', event.target.value)} placeholder="+216 20 000 000" autoComplete="tel" required />
          </Field>
        </>
      ) : null}

      <Field label="Email professionnel">
        <AuthInput type="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} placeholder="vous@entreprise.com" autoComplete="email" required />
      </Field>

      <Field label="Mot de passe">
        <AuthInput type="password" value={form.password} onChange={(event) => updateField('password', event.target.value)} placeholder={isSignup ? '8 caractères minimum' : 'Votre mot de passe'} autoComplete={isSignup ? 'new-password' : 'current-password'} required minLength={8} />
      </Field>

      {error ? <p className="rp-auth-error">{error}</p> : null}

      <button type="submit" disabled={pending} className="rp-auth-submit">
        {pending ? 'Chargement...' : isSignup ? 'Créer mon compte' : 'Se connecter'}
      </button>

      <p className="rp-auth-switch">
        {isSignup ? 'Déjà un compte ? ' : 'Pas encore de compte ? '}
        <Link href={isSignup ? `/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}` : `/auth/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`}>
          {isSignup ? 'Se connecter' : 'Créer un compte'}
        </Link>
      </p>
    </form>
  )
}
