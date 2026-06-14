import Image from 'next/image'
import type { ReactNode } from 'react'

type AuthShellProps = {
  title: string
  subtitle: string
  children: ReactNode
}

export function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <main className="rp-auth-root">
      <section className="rp-auth-panel" aria-hidden="true">
        <div className="rp-auth-panel-content">
          <div className="rp-auth-brand">
            <Image src="/logo.png" alt="" width={26} height={26} priority className="rp-auth-logo-image" />
            <span>Répondly<em>.</em></span>
          </div>

          <div className="mt-16 max-w-[420px] rounded-[var(--radius-sm)] border border-[color:var(--surface-border)] bg-[color:var(--surface-0)] p-4 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between border-b border-[color:var(--surface-border)] pb-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[color:var(--text-muted)]">Inbox</p>
                <p className="mt-1 text-[13px] font-semibold text-[color:var(--text-primary)]">3 messages à prioriser</p>
              </div>
              <span className="h-2 w-2 rounded-full bg-[color:var(--brand-primary)]" />
            </div>
            <div className="space-y-3 pt-3">
              {['Rendez-vous à confirmer', 'Devis en attente', 'Relance urgente'].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <span className="h-7 w-7 rounded-[var(--radius-sm)] bg-[color:var(--brand-primary-soft)]" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-[color:var(--text-primary)]">{item}</p>
                    <p className="mt-0.5 text-[12px] text-[color:var(--text-muted)]">Réponse client prête à reprendre</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rp-auth-panel-copy">
            <p>Un espace calme pour répondre vite et suivre chaque client.</p>
            <p>Répondly centralise les conversations et donne à votre équipe une file de travail claire, fiable et quotidienne.</p>
          </div>
        </div>
      </section>

      <section className="rp-auth-stage" aria-label="Authentification Répondly">
        <div className="rp-auth-mobile-brand" aria-hidden="true">
          <Image src="/logo.png" alt="" width={24} height={24} priority className="rp-auth-logo-image" />
          <span>Répondly<em>.</em></span>
        </div>

        <div className="rp-auth-card">
          <div className="rp-auth-card-header">
            <p className="rp-auth-eyebrow">Espace entreprise</p>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          <div className="rp-auth-card-body">{children}</div>
        </div>
      </section>
    </main>
  )
}
