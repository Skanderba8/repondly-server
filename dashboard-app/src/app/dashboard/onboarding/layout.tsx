'use client'

import Image from 'next/image'
import { signOut } from 'next-auth/react'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-[var(--surface-1)]">
      {/* Header: logo + logout */}
      <div className="flex items-center justify-between px-5 py-4 pt-[calc(1rem+env(safe-area-inset-top))]">
        <div className="flex items-center gap-2.5">
          <Image
            src="/logo.png"
            alt="Répondly"
            width={28}
            height={28}
            className="shrink-0 rounded-md"
          />
          <span className="font-['Syne',sans-serif] text-[17px] font-bold leading-none tracking-tight text-[var(--brand-primary)]">
            Répondly
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut({ callbackUrl: '/auth/signin' })}
          className="text-[var(--text-muted)]"
        >
          <LogOut size={14} className="mr-1.5" />
          <span className="hidden sm:inline">Se déconnecter</span>
        </Button>
      </div>

      {/* Wizard content */}
      <div className="flex flex-1 flex-col overflow-hidden">{children}</div>
    </div>
  )
}
