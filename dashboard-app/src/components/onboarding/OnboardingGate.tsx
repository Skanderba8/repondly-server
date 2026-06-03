'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

export default function OnboardingGate() {
  const pathname = usePathname()
  const router = useRouter()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    // Skip check if already on onboarding page
    if (pathname.startsWith('/dashboard/onboarding')) {
      setChecked(true)
      return
    }

    let cancelled = false

    async function check() {
      try {
        const res = await fetch('/api/onboarding/status', { cache: 'no-store' })
        const data = await res.json()
        if (!cancelled && data.success && !data.completed) {
          router.replace('/dashboard/onboarding')
        }
      } catch {
        // Fail open — don't block dashboard on network error
      } finally {
        if (!cancelled) setChecked(true)
      }
    }

    check()
    return () => { cancelled = true }
  }, [pathname, router])

  if (!checked) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--surface-1)',
          zIndex: 100,
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            className="rp-shimmer"
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              margin: '0 auto 16px',
            }}
          />
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Chargement...</p>
        </div>
      </div>
    )
  }

  return null
}
