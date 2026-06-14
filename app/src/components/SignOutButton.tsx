'use client'

import { useRouter } from 'next/navigation'

type SignOutButtonProps = {
  className?: string
}

async function getCsrfToken() {
  const response = await fetch('/api/auth/csrf', { cache: 'no-store' })

  if (!response.ok) {
    throw new Error('CSRF token unavailable')
  }

  const payload = (await response.json()) as { csrfToken?: string }

  if (!payload.csrfToken) {
    throw new Error('CSRF token unavailable')
  }

  return payload.csrfToken
}

export function SignOutButton({ className }: SignOutButtonProps) {
  const router = useRouter()

  async function handleSignOut() {
    const csrfToken = await getCsrfToken()
    const body = new URLSearchParams({
      csrfToken,
      callbackUrl: '/auth/signin',
      json: 'true',
    })

    await fetch('/api/auth/signout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Auth-Return-Redirect': '1',
      },
      body,
      redirect: 'follow',
    })

    router.replace('/auth/signin')
    router.refresh()
  }

  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        void handleSignOut()
      }}
    >
      Se déconnecter
    </button>
  )
}
