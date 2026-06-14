import Link from 'next/link'
import type { ReactNode } from 'react'

type AuthShellProps = {
  title: string
  subtitle: string
  footer: ReactNode
  children: ReactNode
}

export function AuthShell({ title, subtitle, footer, children }: AuthShellProps) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--surface-1)] px-4 py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_color-mix(in_srgb,var(--brand)_14%,transparent),transparent_38%),radial-gradient(circle_at_bottom_right,_color-mix(in_srgb,var(--brand)_8%,transparent),transparent_32%)]" />
      <div className="relative grid w-full max-w-5xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden rounded-[4px] border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface-0)_82%,transparent)] p-10 shadow-[var(--shadow-elevated)] backdrop-blur lg:flex lg:flex-col lg:justify-between">
          <div>
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)] no-underline">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-[4px] bg-[var(--brand)] text-[var(--text-on-brand)]">
                R
              </span>
              Répondly
            </Link>
            <div className="mt-12 max-w-md">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--brand)]">app.repondly.com</p>
              <h1 className="mt-4 text-4xl font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
                Centralisez vos conversations clients dans un espace sécurisé.
              </h1>
              <p className="mt-5 text-sm leading-6 text-[var(--text-secondary)]">
                Connexion propriétaire par entreprise, session JWT limitée dans le temps et séparation stricte des
                données par compte.
              </p>
            </div>
          </div>
          <div className="grid gap-3 text-sm text-[var(--text-secondary)]">
            <div className="rounded-[4px] border border-[var(--border)] bg-[var(--surface-0)] p-4">
              Accès protégé aux conversations, contacts et relances de votre entreprise.
            </div>
            <div className="rounded-[4px] border border-[var(--border)] bg-[var(--surface-0)] p-4">
              Expiration de session après 8 heures et redirection automatique vers la connexion si nécessaire.
            </div>
          </div>
        </section>

        <section className="rounded-[4px] border border-[var(--border)] bg-[var(--surface-0)] p-6 shadow-[var(--shadow-elevated)] sm:p-8">
          <div className="mb-8 lg:hidden">
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)] no-underline">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-[4px] bg-[var(--brand)] text-[var(--text-on-brand)]">
                R
              </span>
              Répondly
            </Link>
          </div>
          <div className="mb-8">
            <h2 className="text-2xl font-semibold tracking-[-0.02em] text-[var(--text-primary)]">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{subtitle}</p>
          </div>
          {children}
          <div className="mt-6 border-t border-[var(--border)] pt-5 text-sm text-[var(--text-secondary)]">{footer}</div>
        </section>
      </div>
    </div>
  )
}
