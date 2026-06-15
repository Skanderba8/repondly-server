import Image from 'next/image'
import type { ReactNode } from 'react'

type AuthShellProps = {
  title: string
  subtitle: string
  children: ReactNode
}

export function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <main className="grid min-h-dvh place-items-center bg-[color:var(--bg-page)] px-4 py-10 text-[color:var(--text-primary)]">
      <section className="nx-card w-full max-w-[420px] p-8">
        <div className="mb-6 flex flex-col items-start gap-4">
          <div className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="" width={28} height={28} priority className="block object-contain" />
            <span className="text-[14px] font-bold text-[color:var(--text-primary)]">Répondly</span>
          </div>
          <div>
            <p className="nx-section-label">Espace entreprise</p>
            <h1 className="mt-2 text-[20px] font-semibold leading-[1.15] text-[color:var(--text-primary)]">{title}</h1>
            <p className="mt-2 text-[13px] leading-[1.55] text-[color:var(--text-secondary)]">{subtitle}</p>
          </div>
        </div>
        {children}
      </section>
    </main>
  )
}
