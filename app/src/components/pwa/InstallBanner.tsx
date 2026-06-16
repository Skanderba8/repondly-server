'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { usePWAInstall } from '@/lib/pwa/usePWAInstall'

const DISMISSED_KEY = 'rp_install_dismissed'

export function InstallBanner() {
  const { canInstall, install } = usePWAInstall()
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISSED_KEY) === '1')
  }, [])

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, '1')
    setDismissed(true)
  }

  if (!canInstall || dismissed) return null

  return (
    <div className="nx-card mx-4 mb-3 flex items-center gap-3 border-[color:var(--brand-border)] bg-[color:var(--brand-soft)] p-3 md:hidden">
      <Image src="/logo.png" alt="" width={20} height={20} className="shrink-0 rounded-[4px]" />
      <p className="min-w-0 flex-1 text-[12px] font-medium leading-[1.35] text-[color:var(--text-primary)]">
        Installez Répondly sur votre téléphone
      </p>
      <button type="button" onClick={install} className="nx-btn nx-btn-primary nx-btn-sm">
        Installer
      </button>
      <button type="button" onClick={dismiss} className="nx-btn nx-btn-ghost nx-btn-icon" aria-label="Fermer">
        ×
      </button>
    </div>
  )
}
